import { PLUS_TWO_MAX_STAR } from './constants.js'
import { buildPlan, canBoomOnRoute, normalizeConfig } from './model.js'

/**
 * Total state changes the whole run may process. Reaching 30 stars costs
 * hundreds of thousands of booms per attempt, so an unbounded run would hang
 * for minutes; instead we spend a fixed budget and report the sample size we
 * actually managed.
 */
const WORK_BUDGET = 20_000_000
const PER_TRIAL_LIMIT = 2_000_000

/**
 * A "maintain" result leaves the item untouched, so rather than rolling one
 * attempt at a time we draw how many attempts pass before something actually
 * happens. That is a geometric draw - exact, not an approximation - and it
 * skips every iteration that would have changed nothing.
 */
function runTrial(plan, out) {
  const { ctx, cost, success, destroy, recover } = plan
  const target = ctx.targetStar
  const plusTwo = ctx.plusTwo

  let star = ctx.currentStar
  let meso = 0
  let booms = 0
  let attempts = 0
  let resolutions = 0

  while (star < target && resolutions < PER_TRIAL_LIMIT) {
    resolutions += 1

    const resolveChance = success[star] + destroy[star]
    const tries =
      resolveChance >= 1
        ? 1
        : 1 + Math.floor(Math.log1p(-Math.random()) / Math.log1p(-resolveChance))

    attempts += tries
    meso += tries * cost[star]

    if (Math.random() * resolveChance < success[star]) {
      star += plusTwo && star <= PLUS_TWO_MAX_STAR ? 2 : 1
    } else {
      booms += 1
      star = recover[star]
    }
  }

  out.meso = meso
  out.booms = booms
  out.attempts = attempts
  out.resolutions = resolutions
  out.reached = star >= target
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))
  return sorted[index]
}

function summarize(values) {
  const sorted = Float64Array.from(values).sort()
  let sum = 0
  for (let i = 0; i < sorted.length; i += 1) sum += sorted[i]

  return {
    mean: sorted.length ? sum / sorted.length : 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p85: percentile(sorted, 0.85),
    p95: percentile(sorted, 0.95),
  }
}

const HISTOGRAM_BUCKETS = 22

/**
 * Buckets results up to the 95th percentile and lumps the long tail into a
 * final bucket, so one catastrophic run cannot flatten the whole chart.
 */
function buildHistogram(values, stats) {
  const upper = stats.p95 > stats.min ? stats.p95 : stats.max
  const width = (upper - stats.min) / HISTOGRAM_BUCKETS

  if (!(width > 0)) {
    return [{ from: stats.min, to: stats.min, count: values.length, overflow: false }]
  }

  const buckets = Array.from({ length: HISTOGRAM_BUCKETS }, (_, index) => ({
    from: stats.min + index * width,
    to: stats.min + (index + 1) * width,
    count: 0,
    overflow: false,
  }))
  buckets.push({ from: upper, to: stats.max, count: 0, overflow: true })

  for (let i = 0; i < values.length; i += 1) {
    const index = Math.floor((values[i] - stats.min) / width)
    buckets[Math.min(HISTOGRAM_BUCKETS, Math.max(0, index))].count += 1
  }

  return buckets
}

export function simulate(rawConfig) {
  const config = normalizeConfig(rawConfig)
  const plan = buildPlan(config)

  const mesos = []
  const booms = []
  const attempts = []
  const out = { meso: 0, booms: 0, attempts: 0, resolutions: 0, reached: false }

  let spent = 0
  let incomplete = 0

  for (let i = 0; i < config.trials; i += 1) {
    runTrial(plan, out)
    mesos.push(out.meso + out.booms * (config.itemValue ?? 0))
    booms.push(out.booms)
    attempts.push(out.attempts)
    if (!out.reached) incomplete += 1

    spent += out.resolutions
    if (spent >= WORK_BUDGET) break
  }

  const mesoStats = summarize(mesos)

  return {
    config,
    requestedTrials: config.trials,
    trials: mesos.length,
    meso: mesoStats,
    booms: summarize(booms),
    attempts: summarize(attempts),
    histogram: buildHistogram(mesos, mesoStats),
    canBoom: canBoomOnRoute(plan, config),
    // True when the star target is so brutal that some runs were cut short and
    // the numbers below are floors rather than real results.
    incomplete: incomplete > 0,
  }
}
