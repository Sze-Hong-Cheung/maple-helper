import { DEFAULT_NODE_BY_ID } from '../constants.js'
import archMageIl from './jobs/arch-mage-il.js'

const ICON_MODULES = import.meta.glob('../assets/hexa/*.png', {
  eager: true,
  import: 'default',
})

function iconUrl(file) {
  return ICON_MODULES[`../assets/hexa/${file}`] ?? ''
}

export function iconAtLevel(spec, level) {
  const icons = spec.icons?.length ? spec.icons : [{ min: 0, icon: spec.icon }]
  let chosen = icons[0]?.icon ?? spec.icon
  for (const entry of icons) {
    if (level >= entry.min) chosen = entry.icon
  }
  return chosen
}

function hydrate(job) {
  const nodes = {}
  for (const [id, node] of Object.entries(job.nodes)) {
    const icons = (node.icons ?? [{ min: 0, icon: node.icon }]).map((entry) => ({
      min: entry.min,
      icon: iconUrl(entry.icon),
    }))
    nodes[id] = {
      name: node.name,
      icon: icons[0]?.icon ?? iconUrl(node.icon),
      icons,
      skills: node.skills.map((skill) => ({
        name: skill.name,
        icon: iconUrl(skill.icon),
      })),
    }
  }
  return { ...job, nodes }
}

export const HEXA_JOBS = [hydrate(archMageIl)]

export function findHexaJob(jobName) {
  if (!jobName) return null
  const needle = String(jobName).trim().toLowerCase()
  return (
    HEXA_JOBS.find(
      (job) =>
        job.name.toLowerCase() === needle ||
        job.aliases.some((alias) => alias.toLowerCase() === needle),
    ) ?? null
  )
}

/** Overlay wiki names/icons onto saved levels. Custom names are kept. */
export function applyJobCatalog(nodes, jobName) {
  const job = findHexaJob(jobName)
  if (!job) return nodes

  return nodes.map((node) => {
    const spec = job.nodes[node.id]
    if (!spec) return node
    const generic = DEFAULT_NODE_BY_ID.get(node.id)?.name
    const custom = node.name && node.name !== generic
    return {
      ...node,
      name: custom ? node.name : spec.name,
      icon: iconAtLevel(spec, node.current),
      icons: spec.icons,
      skills: spec.skills,
    }
  })
}
