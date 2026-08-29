import { expProgress } from './progress.js'

export const ROSTER_STORAGE_KEY = 'maple-helper:roster:v1'

const REGIONS = {
  na: { id: 'na', label: 'NA' },
  eu: { id: 'eu', label: 'EU' },
}

export const ROSTER_REGIONS = [REGIONS.na, REGIONS.eu]

function rankingUrl(region, characterName) {
  const params = new URLSearchParams({
    type: 'overall',
    id: 'legendary',
    reboot_index: '0',
    page_index: '1',
    character_name: characterName,
  })
  return `/nexon-ranking/${region}?${params}`
}

function pickMatch(ranks, characterName) {
  const needle = characterName.toLowerCase()
  return (
    ranks.find((row) => row.isSearchTarget) ||
    ranks.find((row) => String(row.characterName ?? '').toLowerCase() === needle) ||
    null
  )
}

export function rosterId(region, name) {
  return `${region}:${name.trim().toLowerCase()}`
}

/**
 * Look up a GMS character on the public NA/EU ranking search
 * used by the official MapleStory rankings page.
 */
export async function lookupGmsCharacter(region, characterName) {
  const regionId = REGIONS[region] ? region : 'na'
  const name = characterName.trim()
  if (!name) throw new Error('Enter a character name.')

  const response = await fetch(rankingUrl(regionId, name), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Ranking lookup failed (${response.status}).`)
  }

  const payload = await response.json()
  const ranks = Array.isArray(payload?.ranks) ? payload.ranks : []
  const match = pickMatch(ranks, name)
  if (!match) {
    throw new Error(`No ranking data for “${name}” in ${regionId.toUpperCase()}.`)
  }

  const level = Number(match.level) || 0
  const exp = Number(match.exp) || 0
  const progress = expProgress(level, exp)

  return {
    id: rosterId(regionId, match.characterName || name),
    region: regionId,
    name: match.characterName || name,
    job: match.jobName || '',
    level,
    exp,
    expProgress: progress,
    avatarUrl: match.characterImgURL || '',
    fetchedAt: new Date().toISOString(),
  }
}
