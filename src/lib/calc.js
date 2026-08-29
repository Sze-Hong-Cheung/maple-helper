import { MAX_LEVEL, MIN_LEVEL, UPGRADE_COSTS } from '../constants.js'

export function emptyCost() {
  return { solErda: 0, fragments: 0 }
}

export function addCosts(...parts) {
  return parts.reduce(
    (sum, part) => ({
      solErda: sum.solErda + (part?.solErda ?? 0),
      fragments: sum.fragments + (part?.fragments ?? 0),
    }),
    emptyCost(),
  )
}

export function clampLevel(value, min = MIN_LEVEL) {
  const floor = Math.min(Math.max(min, MIN_LEVEL), MAX_LEVEL)
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) return floor
  return Math.min(MAX_LEVEL, Math.max(floor, n))
}

export function costToReachLevel(costKey, level) {
  const table = UPGRADE_COSTS[costKey]
  if (!table || level < 1) return emptyCost()
  return table[level] ?? emptyCost()
}

export function costBetween(costKey, from, to) {
  const start = clampLevel(from)
  const end = clampLevel(to)
  if (end <= start) return emptyCost()

  let solErda = 0
  let fragments = 0
  for (let level = start + 1; level <= end; level += 1) {
    const step = costToReachLevel(costKey, level)
    solErda += step.solErda
    fragments += step.fragments
  }
  return { solErda, fragments }
}

/** A node's branch (`type`) and its upgrade table (`costs`) can differ. */
export function costKeyFor(node) {
  return node.costs ?? node.type
}

export function nodeRemaining(node) {
  return costBetween(costKeyFor(node), node.current, node.target)
}

/** Spent / remaining / percent toward a node’s target (defaults to `node.target`). */
export function nodeProgress(node, toLevel = node.target) {
  const costKey = costKeyFor(node)
  const remaining = costBetween(costKey, node.current, toLevel)
  const spent = costBetween(costKey, MIN_LEVEL, node.current)
  const total = costBetween(costKey, MIN_LEVEL, toLevel)
  const percent =
    total.fragments === 0 ? 100 : Math.round((100 * spent.fragments) / total.fragments)
  return { remaining, spent, total, percent }
}

export function totalsForNodes(nodes) {
  const remaining = emptyCost()
  const spent = emptyCost()
  const toTarget = emptyCost()
  const byType = {}

  for (const node of nodes) {
    const costKey = costKeyFor(node)
    const left = nodeRemaining(node)
    const used = costBetween(costKey, MIN_LEVEL, node.current)
    const planned = costBetween(costKey, MIN_LEVEL, node.target)

    remaining.solErda += left.solErda
    remaining.fragments += left.fragments
    spent.solErda += used.solErda
    spent.fragments += used.fragments
    toTarget.solErda += planned.solErda
    toTarget.fragments += planned.fragments

    if (!byType[node.type]) {
      byType[node.type] = { remaining: emptyCost(), count: 0 }
    }
    byType[node.type].remaining = addCosts(byType[node.type].remaining, left)
    byType[node.type].count += 1
  }

  const fragmentProgress =
    toTarget.fragments === 0 ? 1 : Math.min(1, spent.fragments / toTarget.fragments)

  return { remaining, spent, toTarget, byType, fragmentProgress }
}
