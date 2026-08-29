import {
  ENHANCEMENT_MODE_MAX,
  ENHANCEMENT_MODE_STARS,
  defaultEnhancementModes,
  enhancementModeSummary,
} from './constants.js'
import { expectedCost, expectedFields } from './expected.js'
import { buildPlan, normalizeConfig } from './model.js'

const TIE_MESO = 1
const MAX_ITERS = 16

function copyModes(modes) {
  return { ...defaultEnhancementModes(), ...modes }
}

function modesEqual(left, right) {
  return ENHANCEMENT_MODE_STARS.every((star) => (left?.[star] ?? 1) === (right?.[star] ?? 1))
}

function setStars(modes, stars, level) {
  const next = copyModes(modes)
  for (const star of stars) next[star] = level
  return next
}

function actionableStars(config) {
  return ENHANCEMENT_MODE_STARS.filter((star) => star < config.targetStar)
}

function actionValue(config, star, mode, total, n) {
  const trial = normalizeConfig({
    ...config,
    modes: { ...config.modes, [star]: mode },
  })
  const plan = buildPlan(trial)
  const resolve = plan.success[star] + plan.destroy[star]
  if (!(resolve > 0)) return Number.POSITIVE_INFINITY

  const next = plan.nextStar[star]
  const recover = plan.recover[star]
  const goNext = next >= n ? 0 : total[next]
  const goRecover = recover >= n ? 0 : total[recover]
  const itemValue = config.itemValue ?? 0

  return (
    plan.cost[star] / resolve +
    (plan.success[star] / resolve) * goNext +
    (plan.destroy[star] / resolve) * (itemValue + goRecover)
  )
}

function improvePolicy(config, modes, stars) {
  const fields = expectedFields({ ...config, modes })
  const next = copyModes(modes)
  let changed = false

  for (const star of stars) {
    let bestMode = next[star]
    let bestValue = Number.POSITIVE_INFINITY

    for (let mode = 1; mode <= ENHANCEMENT_MODE_MAX; mode += 1) {
      const value = actionValue({ ...config, modes }, star, mode, fields.total, fields.n)
      if (value + TIE_MESO < bestValue || (Math.abs(value - bestValue) <= TIE_MESO && mode < bestMode)) {
        bestValue = value
        bestMode = mode
      }
    }

    if (bestMode !== next[star]) {
      next[star] = bestMode
      changed = true
    }
  }

  return { modes: next, changed }
}

function policyIterate(config, start, stars) {
  let modes = copyModes(start)

  for (let iter = 0; iter < MAX_ITERS; iter += 1) {
    const step = improvePolicy(config, modes, stars)
    modes = step.modes
    if (!step.changed) break
  }

  return { modes, meso: expectedCost({ ...config, modes }).meso }
}

function snapshot(config, modes, label) {
  const expectation = expectedCost({ ...config, modes })
  return {
    id: label,
    label,
    modes,
    summary: enhancementModeSummary(modes) || 'All Mode 1',
    meso: expectation.meso,
    booms: expectation.booms,
  }
}

/**
 * Cheapest GMS Enhancement Mode mix for this item value, star range, and
 * events. Policy iteration on the exact cost-to-go, started from a few
 * common presets so a single greedy pass cannot get stuck.
 */
export function cheapestRoute(rawConfig) {
  const config = normalizeConfig(rawConfig)
  if (config.currentStar >= config.targetStar) return null

  if (config.server !== 'gms') {
    if (config.targetStar <= 15) return null

    const off = expectedCost({ ...config, safeguard: false })
    const on = expectedCost({ ...config, safeguard: true })
    const useSafeguard = on.meso + TIE_MESO < off.meso
    const expectation = useSafeguard ? on : off
    const current = expectedCost(config)

    return {
      server: 'kms',
      modes: setStars(defaultEnhancementModes(), [15, 16, 17], useSafeguard ? 4 : 1),
      safeguard: useSafeguard,
      expectation,
      current,
      summary: useSafeguard ? 'Safeguard 15–17★' : 'No safeguard',
      matches: Boolean(config.safeguard) === useSafeguard,
      savings: current.meso - expectation.meso,
      steps: [],
      alternatives: [
        { id: 'off', label: 'No safeguard', meso: off.meso, booms: off.booms, summary: 'No safeguard' },
        { id: 'on', label: 'Safeguard 15–17★', meso: on.meso, booms: on.booms, summary: 'Safeguard 15–17★' },
      ],
    }
  }

  const stars = actionableStars(config)
  if (stars.length === 0) return null

  const seeds = [
    defaultEnhancementModes(),
    setStars(defaultEnhancementModes(), [15, 16, 17], 4),
    setStars(defaultEnhancementModes(), ENHANCEMENT_MODE_STARS, 4),
    copyModes(config.modes),
  ]

  let best = null
  for (const seed of seeds) {
    const result = policyIterate(config, seed, stars)
    if (!best || result.meso + TIE_MESO < best.meso) best = result
  }

  const expectation = expectedCost({ ...config, modes: best.modes })
  const current = expectedCost(config)
  const alternatives = [
    snapshot(config, defaultEnhancementModes(), 'All Mode 1'),
    snapshot(config, setStars(defaultEnhancementModes(), [15, 16, 17], 4), 'Safeguard 15–17★'),
    snapshot(config, setStars(defaultEnhancementModes(), ENHANCEMENT_MODE_STARS, 4), 'All Mode 4'),
  ].sort((a, b) => a.meso - b.meso)

  return {
    server: 'gms',
    modes: best.modes,
    safeguard: [15, 16, 17].every((star) => best.modes[star] === 4),
    expectation,
    current,
    summary: enhancementModeSummary(best.modes) || 'All Mode 1',
    matches: modesEqual(config.modes, best.modes),
    savings: current.meso - expectation.meso,
    steps: stars.map((star) => ({
      star,
      mode: best.modes[star],
      current: config.modes[star] ?? 1,
    })),
    alternatives,
  }
}
