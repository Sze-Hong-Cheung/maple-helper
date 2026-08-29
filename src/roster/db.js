import fileDb from './db.json'
import { lookupGmsCharacter, rosterId } from './lookup.js'

export const ROSTER_DB_PATH = '/__roster-db'

export function readFileRoster() {
  return Array.isArray(fileDb?.characters) ? fileDb.characters : []
}

export function normalizeCharacter(entry) {
  if (!entry || typeof entry !== 'object') return null
  const region = entry.region === 'eu' ? 'eu' : 'na'
  const name = String(entry.name ?? '').trim()
  if (!name) return null
  return {
    id: entry.id || rosterId(region, name),
    region,
    name,
    job: String(entry.job ?? ''),
    level: Number(entry.level) || 0,
    exp: Number(entry.exp) || 0,
    expProgress: Number(entry.expProgress) || 0,
    avatarUrl: String(entry.avatarUrl ?? ''),
    fetchedAt: entry.fetchedAt ?? null,
  }
}

function fetchedMs(entry) {
  const stamp = Date.parse(entry?.fetchedAt ?? '')
  return Number.isFinite(stamp) ? stamp : 0
}

function prefer(a, b) {
  if (fetchedMs(a) !== fetchedMs(b)) return fetchedMs(a) > fetchedMs(b) ? a : b
  if (Boolean(a.avatarUrl) !== Boolean(b.avatarUrl)) return a.avatarUrl ? a : b
  if (a.level !== b.level) return a.level > b.level ? a : b
  return { ...b, ...a }
}

export function mergeRoster(...lists) {
  const byId = new Map()
  for (const list of lists) {
    for (const raw of list ?? []) {
      const entry = normalizeCharacter(raw)
      if (!entry) continue
      const current = byId.get(entry.id)
      byId.set(entry.id, current ? prefer(current, entry) : entry)
    }
  }
  return [...byId.values()]
}

export function readStoredRoster(storageKey) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function persistRosterFile(characters) {
  try {
    await fetch(ROSTER_DB_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characters }),
    })
  } catch {
    // Static preview / production has no file writer; localStorage still holds the list.
  }
}

export function needsLookup(entry) {
  return Boolean(entry?.name) && !entry.fetchedAt
}

export async function lookupMissing(entries) {
  const found = []
  for (const entry of entries.filter(needsLookup)) {
    try {
      found.push(await lookupGmsCharacter(entry.region, entry.name))
    } catch {
      // Keep the stub already in the roster; the name is still saved.
    }
  }
  return found
}
