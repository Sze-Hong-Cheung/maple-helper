import {
  BOOM_REDUCTION_MAX_STAR,
  ENHANCEMENT_MODE_MAX,
  ENHANCEMENT_MODE_MIN,
  ENHANCEMENT_MODE_STARS,
  GUARANTEED_STARS,
  MAX_ITEM_LEVEL,
  MAX_ITEM_VALUE,
  MAX_STAR,
  MAX_TRIALS,
  MIN_ITEM_LEVEL,
  MVP_DISCOUNT_MAX_STAR,
  MVP_TIERS,
  PLUS_TWO_MAX_STAR,
  SAFEGUARD_MAX_STAR,
  SAFEGUARD_MIN_STAR,
  SAFEGUARD_SURCHARGE,
  SERVERS,
  STAR_CATCH_MULTIPLIER,
  defaultEnhancementModes,
  enhancementModeSpec,
  maxStarForLevel,
} from './constants.js'

/** Every in-game cost lands on a multiple of 100. */
function roundTo100(value) {
  return Math.round(value / 100) * 100
}

/**
 * Meso cost uses the item's required level rounded down to the nearest 10.
 * Star caps still use the real level — only the price formula floors.
 */
export function starForceCostLevel(itemLevel) {
  return Math.floor(Number(itemLevel) / 10) * 10
}

export function baseMesoCost(star, itemLevel, server) {
  const next = star + 1
  const { divisors } = server
  const level = starForceCostLevel(itemLevel)

  if (star < 10) {
    return roundTo100(1000 + (level ** 3 * next) / divisors.low)
  }

  const divisor = divisors[star] ?? divisors.rest
  return roundTo100(1000 + (level ** 3 * next ** 2.7) / divisor)
}

function isGuaranteed(star, ctx) {
  return ctx.fiveTenFifteen && GUARANTEED_STARS.includes(star)
}

function modeFor(star, ctx) {
  if (ctx.server.id !== 'gms') return 1
  return ctx.modes?.[star] ?? 1
}

export function modeSpecFor(star, ctx) {
  return enhancementModeSpec(star, modeFor(star, ctx), ctx.server.rates)
}

export function safeguardActive(star, ctx) {
  if (isGuaranteed(star, ctx)) return false
  if (ctx.server.id === 'gms') return modeSpecFor(star, ctx).safeguard
  if (!ctx.safeguard) return false
  return star >= SAFEGUARD_MIN_STAR && star <= SAFEGUARD_MAX_STAR
}

export function attemptCost(star, ctx) {
  const base = baseMesoCost(star, ctx.itemLevel, ctx.server)
  let cost = base

  if (ctx.mvpDiscount > 0 && star <= MVP_DISCOUNT_MAX_STAR) {
    cost *= 1 - ctx.mvpDiscount
  }
  if (ctx.mesoDiscount) cost *= 0.7

  if (isGuaranteed(star, ctx)) return Math.round(cost)

  const spec = modeSpecFor(star, ctx)
  if (safeguardActive(star, ctx)) {
    // Safeguard surcharge sits outside every discount.
    cost += base * SAFEGUARD_SURCHARGE
  } else if (spec.costMult !== 1) {
    cost *= spec.costMult
  }

  return Math.round(cost)
}

export function attemptRates(star, ctx) {
  if (isGuaranteed(star, ctx)) return { success: 1, destroy: 0 }

  const spec = modeSpecFor(star, ctx)
  let success = spec.success / 100
  let destroy = spec.destroy / 100

  if (ctx.starCatch && success < 1) {
    const boosted = Math.min(1, success * STAR_CATCH_MULTIPLIER)
    // Star catching shrinks failure and destruction proportionally.
    destroy *= (1 - boosted) / (1 - success)
    success = boosted
  }

  if (ctx.boomReduction && star <= BOOM_REDUCTION_MAX_STAR) destroy *= 0.7
  if (safeguardActive(star, ctx) || spec.destroy === 0) destroy = 0

  return { success, destroy }
}

function clampInt(value, min, max, fallback) {
  const parsed = Math.trunc(Number(value))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

/**
 * Star ceiling for an item. Usually decided by its level, but a handful of
 * items (badges, Sweetwater pieces) carry a lower hard cap.
 */
export function starCapFor(itemLevel, itemMaxStar) {
  const levelCap = Math.min(MAX_STAR, maxStarForLevel(itemLevel))
  return itemMaxStar ? Math.min(levelCap, itemMaxStar) : levelCap
}

export function normalizeConfig(config) {
  const itemLevel = clampInt(config.itemLevel, MIN_ITEM_LEVEL, MAX_ITEM_LEVEL, 200)
  const itemMaxStar = config.itemMaxStar
    ? clampInt(config.itemMaxStar, 1, MAX_STAR, MAX_STAR)
    : null
  const starCap = starCapFor(itemLevel, itemMaxStar)
  const currentStar = clampInt(config.currentStar, 0, starCap, 0)
  const targetStar = clampInt(config.targetStar, currentStar, starCap, starCap)
  const server = SERVERS[config.server] ? config.server : 'gms'
  const modes = normalizeModes(config)

  return {
    itemId: config.itemId ?? null,
    itemLevel,
    itemMaxStar,
    itemValue: clampInt(config.itemValue, 0, MAX_ITEM_VALUE, 0),
    currentStar,
    targetStar,
    server,
    starCatch: Boolean(config.starCatch),
    safeguard:
      server === 'gms'
        ? ENHANCEMENT_MODE_STARS.slice(0, 3).every((star) => modes[star] === 4)
        : Boolean(config.safeguard),
    modes,
    mvp: config.mvp ?? 'none',
    events: { ...(config.events ?? {}) },
    trials: clampInt(config.trials, 1, MAX_TRIALS, 1000),
  }
}

function normalizeModes(config) {
  const modes = defaultEnhancementModes()
  const incoming = config.modes

  if (incoming && typeof incoming === 'object') {
    for (const star of ENHANCEMENT_MODE_STARS) {
      modes[star] = clampInt(incoming[star], ENHANCEMENT_MODE_MIN, ENHANCEMENT_MODE_MAX, 1)
    }
    return modes
  }

  // Pre-mode saves: the old safeguard toggle meant Mode 4 at 15–17.
  if (config.safeguard) {
    modes[15] = 4
    modes[16] = 4
    modes[17] = 4
  }

  return modes
}

function buildContext(config) {
  const events = config.events ?? {}

  return {
    itemLevel: config.itemLevel,
    currentStar: config.currentStar,
    targetStar: config.targetStar,
    server: SERVERS[config.server],
    starCatch: config.starCatch,
    safeguard: config.safeguard,
    modes: config.modes ?? defaultEnhancementModes(),
    mvpDiscount: MVP_TIERS.find((tier) => tier.id === config.mvp)?.discount ?? 0,
    mesoDiscount: Boolean(events.mesoDiscount),
    boomReduction: Boolean(events.boomReduction),
    fiveTenFifteen: Boolean(events.fiveTenFifteen),
    plusTwo: Boolean(events.plusTwo),
  }
}

/**
 * Cost and odds never change for a given star, so they are resolved once up
 * front. Both the simulator and the expected-value solver then read flat
 * arrays instead of recomputing pow() on every attempt.
 */
export function buildPlan(config) {
  const ctx = buildContext(config)
  const cost = new Float64Array(MAX_STAR)
  const success = new Float64Array(MAX_STAR)
  const destroy = new Float64Array(MAX_STAR)
  const recover = new Int32Array(MAX_STAR)
  const nextStar = new Int32Array(MAX_STAR)

  for (let star = 0; star < MAX_STAR; star += 1) {
    const rates = attemptRates(star, ctx)
    cost[star] = attemptCost(star, ctx)
    success[star] = rates.success
    destroy[star] = rates.destroy
    recover[star] = ctx.server.recoverStar(star)
    nextStar[star] = star + (ctx.plusTwo && star <= PLUS_TWO_MAX_STAR ? 2 : 1)
  }

  return { ctx, cost, success, destroy, recover, nextStar }
}

/** Per-star cost and odds along the planned route, for the breakdown table. */
export function attemptTable(config) {
  const normalized = normalizeConfig(config)
  const plan = buildPlan(normalized)
  const rows = []

  for (let star = normalized.currentStar; star < normalized.targetStar; star += 1) {
    rows.push({
      star,
      cost: plan.cost[star],
      success: plan.success[star],
      destroy: plan.destroy[star],
      maintain: Math.max(0, 1 - plan.success[star] - plan.destroy[star]),
      recover: plan.destroy[star] > 0 ? plan.recover[star] : null,
      mode: modeFor(star, plan.ctx),
      safeguarded: safeguardActive(star, plan.ctx),
    })
  }

  return rows
}

export function canBoomOnRoute(plan, config) {
  for (let star = config.currentStar; star < config.targetStar; star += 1) {
    if (plan.destroy[star] > 0) return true
  }
  return false
}
