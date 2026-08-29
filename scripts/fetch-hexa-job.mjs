/**
 * Pull HEXA skill names and icons for one job from MapleStory Wiki.
 *
 *   node scripts/fetch-hexa-job.mjs arch-mage-il
 *
 * Uses the public MediaWiki API (sections + imageinfo), then writes a local
 * catalog module and PNGs. Rate-limited; not a live runtime dependency.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WIKI = 'https://maplestorywiki.net/api.php'
const USER_AGENT = 'MapleHelper/0.0 (local HEXA catalog; MediaWiki API)'
const PAUSE_MS = 400

const JOBS = {
  'arch-mage-il': {
    id: 'arch-mage-il',
    name: 'Arch Mage (Ice, Lightning)',
    aliases: [
      'Arch Mage (I/L)',
      'Arch Mage (Ice/Lightning)',
      'Ice/Lightning Arch Mage',
      'I/L Arch Mage',
    ],
    wikiPage: 'Arch Mage (Ice, Lightning)/Skills',
  },
}

const FILE_RE = /\[\[File:([^\]|#]+)/i
const LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g
const NODE_HEADER_RE = /^;(Skill Node\/Core|Mastery Node\/Core)\s+(\d+)/i

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function fileSlug(fileName) {
  return slugify(fileName.replace(/^Skill\s+/i, '').replace(/\.png$/i, ''))
}

async function wikiJson(params) {
  const url = new URL(WIKI)
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString()
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!response.ok) throw new Error(`${url.pathname} failed: HTTP ${response.status}`)
  return response.json()
}

async function sectionWikitext(page, index) {
  const data = await wikiJson({
    action: 'parse',
    page,
    prop: 'wikitext',
    section: String(index),
  })
  return data?.parse?.wikitext ?? ''
}

function parseFileAndName(line) {
  const fileMatch = line.match(FILE_RE)
  const links = [...line.matchAll(LINK_RE)]
  const nameLink = links.find((match) => !match[1].startsWith('File:'))
  if (!nameLink) return null
  return {
    name: (nameLink[2] || nameLink[1]).trim(),
    file: fileMatch ? fileMatch[1].trim() : null,
  }
}

function parseListedCores(wikitext, kind) {
  const cores = new Map()
  let current = null

  for (const rawLine of wikitext.split('\n')) {
    const line = rawLine.trim()
    const header = line.match(NODE_HEADER_RE)
    if (header && header[1].toLowerCase().startsWith(kind === 'skill' ? 'skill' : 'mastery')) {
      current = Number(header[2])
      if (!cores.has(current)) cores.set(current, [])
      continue
    }
    if (current == null || !line.startsWith('*')) continue
    const skill = parseFileAndName(line)
    if (skill) cores.get(current).push(skill)
  }

  return cores
}

function parseBoosts(wikitext) {
  const blocks = wikitext.split(/\{\{SkillBoxSixthJob/i).slice(1)
  const boosts = []

  for (const block of blocks) {
    const nameLine = block.match(/\|skillName=([^\n]+)/)
    if (!nameLine) continue
    const skill = parseFileAndName(nameLine[1])
    if (!skill?.name?.endsWith('Boost')) continue
    boosts.push(skill)
  }

  return boosts
}

function parseShared(wikitext) {
  const skills = []
  if (/Sixth Job Shared Skills\|Sol Janus/i.test(wikitext)) {
    skills.push({ id: 'solJanus-1', name: 'Sol Janus', file: 'Skill Sol Janus.png' })
  }

  const hecate = wikitext.match(
    /\|skillName=\[\[File:Skill Sol Hecate\.png\]\][\s\S]*?\[\[Sol Hecate#[^\]|]+\|Sol Hecate\]\]/,
  )
  if (hecate || /\[\[Sol Hecate#Base\|Sol Hecate\]\]/.test(wikitext)) {
    skills.push({
      id: 'solJanus-2',
      name: 'Sol Hecate',
      file: 'Skill Sol Hecate.png',
      files: [
        { min: 0, file: 'Skill Sol Hecate.png' },
        { min: 20, file: 'Skill Sol Hecate (2).png' },
        { min: 30, file: 'Skill Sol Hecate (3).png' },
      ],
    })
  }

  return skills
}

function coreEntry(skills) {
  const [primary, ...rest] = skills
  const icons = primary.files?.map((entry) => ({
    min: entry.min,
    icon: `${fileSlug(entry.file)}.png`,
    file: entry.file,
  }))
  return {
    name: primary.name,
    icon: `${fileSlug(primary.file || primary.name)}.png`,
    ...(icons ? { icons } : {}),
    skills: [primary, ...rest].map((skill) => ({
      name: skill.name,
      icon: `${fileSlug(skill.file || skill.name)}.png`,
      file: skill.file,
    })),
  }
}

async function imageUrl(fileName) {
  const data = await wikiJson({
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url',
  })
  const page = data?.query?.pages?.[0]
  const url = page?.imageinfo?.[0]?.url
  if (url) return url
  return `https://maplestorywiki.net/Special:FilePath/${encodeURIComponent(fileName)}`
}

async function downloadPng(url, dest) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`download ${url} failed: HTTP ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  if (!type.includes('png') && !type.includes('octet-stream')) {
    throw new Error(`download ${url} returned ${type || 'unknown type'}`)
  }
  await writeFile(dest, Buffer.from(await response.arrayBuffer()))
}

function emitJobModule(job, nodes) {
  const payload = {
    id: job.id,
    name: job.name,
    aliases: job.aliases,
    wikiPage: job.wikiPage,
    nodes,
  }
  return `// Generated by scripts/fetch-hexa-job.mjs — source: MapleStory Wiki.\nexport default ${JSON.stringify(payload, null, 2)}\n`
}

const jobKey = process.argv[2] ?? 'arch-mage-il'
const job = JOBS[jobKey]
if (!job) {
  console.error(`Unknown job "${jobKey}". Known: ${Object.keys(JOBS).join(', ')}`)
  process.exit(1)
}

const sectionData = await wikiJson({ action: 'parse', page: job.wikiPage, prop: 'sections' })
const sections = sectionData?.parse?.sections ?? []
const byLine = Object.fromEntries(sections.map((section) => [section.line.replace(/&amp;/g, '&'), section.index]))

const needed = [
  ['Shared HEXA Skills', 'shared'],
  ['Class-Specific HEXA Skills', 'skill'],
  ['Mastery Skills', 'mastery'],
  ['HEXA Enhancements', 'boost'],
]

const texts = {}
for (const [line, key] of needed) {
  const index = byLine[line]
  if (index == null) throw new Error(`Missing wiki section "${line}" on ${job.wikiPage}`)
  await sleep(PAUSE_MS)
  texts[key] = await sectionWikitext(job.wikiPage, index)
  console.log(`  fetched ${line}`)
}

const originCores = parseListedCores(texts.skill, 'skill')
const masteryCores = parseListedCores(texts.mastery, 'mastery')
const boosts = parseBoosts(texts.boost)
const shared = parseShared(texts.shared)

const nodes = {}
if (originCores.get(1)?.[0]) nodes['skill-1'] = coreEntry(originCores.get(1))
if (originCores.get(2)?.[0]) nodes['skill-2'] = coreEntry(originCores.get(2))
for (const [index, skills] of masteryCores) {
  if (skills.length) nodes[`mastery-${index}`] = coreEntry(skills)
}
boosts.forEach((skill, index) => {
  nodes[`boost-${index + 1}`] = coreEntry([skill])
})
for (const skill of shared) {
  nodes[skill.id] = coreEntry([skill])
}

const files = new Map()
for (const node of Object.values(nodes)) {
  for (const skill of node.skills) {
    if (skill.file) files.set(skill.icon, skill.file)
  }
  for (const entry of node.icons ?? []) {
    if (entry.file) files.set(entry.icon, entry.file)
  }
}

const iconDir = resolve(ROOT, 'src/assets/hexa')
await mkdir(iconDir, { recursive: true })

for (const [icon, file] of files) {
  await sleep(PAUSE_MS)
  const url = await imageUrl(file)
  await sleep(PAUSE_MS)
  await downloadPng(url, resolve(iconDir, icon))
  console.log(`  icon ${icon}`)
}

const outFile = resolve(ROOT, `src/hexa/jobs/${job.id}.js`)
await mkdir(dirname(outFile), { recursive: true })

const serializable = {}
for (const [id, node] of Object.entries(nodes)) {
  serializable[id] = {
    name: node.name,
    icon: node.icon,
    ...(node.icons ? { icons: node.icons.map(({ min, icon }) => ({ min, icon })) } : {}),
    skills: node.skills.map(({ name, icon }) => ({ name, icon })),
  }
}

await writeFile(outFile, emitJobModule(job, serializable))
console.log(`\nWrote ${Object.keys(serializable).length} cores to src/hexa/jobs/${job.id}.js`)
