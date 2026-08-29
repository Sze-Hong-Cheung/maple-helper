import {
  CORE_TYPES,
  DEFAULT_NODES,
  DEFAULT_NODE_BY_ID,
  MAX_LEVEL,
  MIN_LEVEL,
  STORAGE_KEY,
  STORAGE_VERSION,
  UPGRADE_COSTS,
} from '../constants.js'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function clamp(value, min, max) {
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

/**
 * Saves written before `min` / `costs` existed fall back to the matching
 * default node, so an old Ascent entry still picks up its own cost table.
 */
function normalizeNode(saved) {
  if (!saved || !saved.id || !CORE_TYPES[saved.type]) return null

  const base = DEFAULT_NODE_BY_ID.get(saved.id)
  const min = clamp(saved.min ?? base?.min ?? MIN_LEVEL, MIN_LEVEL, MAX_LEVEL)
  const current = clamp(saved.current, min, MAX_LEVEL)
  const costs = saved.costs ?? base?.costs ?? saved.type

  return {
    id: String(saved.id),
    type: saved.type,
    name: typeof saved.name === 'string' ? saved.name : '',
    costs: UPGRADE_COSTS[costs] ? costs : saved.type,
    min,
    current,
    target: clamp(saved.target, current, MAX_LEVEL),
  }
}

/**
 * A save from an older version can be missing nodes that the current default
 * board has (or carry ones it dropped), so rebuild the board from the defaults
 * and carry each node's levels across by id.
 */
function migrateNodes(nodes) {
  const savedById = new Map(nodes.map((node) => [node.id, node]))

  return DEFAULT_NODES.map((base) => {
    const saved = savedById.get(base.id)
    if (!saved) return { ...base }

    const current = clamp(saved.current, base.min, MAX_LEVEL)
    return { ...base, current, target: clamp(saved.target, current, MAX_LEVEL) }
  })
}

export function createEmptyProgress() {
  return {
    version: STORAGE_VERSION,
    nodes: DEFAULT_NODES.map((node) => ({ ...node })),
    updatedAt: null,
  }
}

export function loadProgress(storageKey = STORAGE_KEY) {
  if (!canUseStorage()) return createEmptyProgress()

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return createEmptyProgress()

    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.nodes)) return createEmptyProgress()

    const normalized = parsed.nodes.map(normalizeNode).filter(Boolean)
    if (normalized.length === 0) return createEmptyProgress()

    const nodes =
      parsed.version === STORAGE_VERSION ? normalized : migrateNodes(normalized)

    return {
      version: STORAGE_VERSION,
      nodes,
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(progress, storageKey = STORAGE_KEY) {
  if (!canUseStorage()) return null

  const payload = {
    version: STORAGE_VERSION,
    nodes: progress.nodes,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(storageKey, JSON.stringify(payload))
  return payload
}

export function clearProgress(storageKey = STORAGE_KEY) {
  if (!canUseStorage()) return
  window.localStorage.removeItem(storageKey)
}
