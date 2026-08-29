/**
 * Star Force data tables.
 *
 * Sources: MapleStory Wiki "Star Force Enhancement" and the KMST ver. 1.2.185
 * patch notes (the NEXT revamp that raised the cap to 30 and removed star loss
 * on failure). Rates below are the post-revamp values.
 */

export const MAX_STAR = 30
export const MIN_ITEM_LEVEL = 1
export const MAX_ITEM_LEVEL = 300
export const MAX_TRIALS = 50_000
export const DEFAULT_TRIALS = 1_000
export const MAX_ITEM_VALUE = 9_999_999_999_999

/** Safeguard is only offered while the item sits at 15~17 stars. */
export const SAFEGUARD_MIN_STAR = 15
export const SAFEGUARD_MAX_STAR = 17

/** Safeguard adds 200% of the base cost on top, and is never discounted. */
export const SAFEGUARD_SURCHARGE = 2

/** GMS Enhancement Mode is offered from 15★ through the 21 → 22 attempt. */
export const ENHANCEMENT_MODE_STARS = [15, 16, 17, 18, 19, 20, 21]
export const ENHANCEMENT_MODE_MIN = 1
export const ENHANCEMENT_MODE_MAX = 4

export function defaultEnhancementModes() {
  return Object.fromEntries(ENHANCEMENT_MODE_STARS.map((star) => [star, 1]))
}

/** MVP / VIP meso discounts stop applying after the 16 -> 17 attempt. */
export const MVP_DISCOUNT_MAX_STAR = 16

/** The 30% boom reduction event only covers attempts below 21 stars. */
export const BOOM_REDUCTION_MAX_STAR = 20

/** Star catching multiplies the success rate by this factor. */
export const STAR_CATCH_MULTIPLIER = 1.05

/** "+2 stars" event: a success at this star or below jumps two stars. */
export const PLUS_TWO_MAX_STAR = 10

/** "5/10/15" event: these attempts become guaranteed successes. */
export const GUARANTEED_STARS = [5, 10, 15]

/**
 * [successRate, destroyRate] in percent, indexed by the item's current star.
 * The maintain (plain failure) rate is whatever is left over.
 */
const GMS_RATES = [
  [95, 0],
  [90, 0],
  [85, 0],
  [85, 0],
  [80, 0],
  [75, 0],
  [70, 0],
  [65, 0],
  [60, 0],
  [55, 0],
  [50, 0],
  [45, 0],
  [40, 0],
  [35, 0],
  [30, 0],
  [30, 2.1],
  [30, 2.1],
  [15, 6.8],
  [15, 6.8],
  [15, 8.5],
  [30, 10.5],
  [15, 12.75],
  [15, 17],
  [10, 18],
  [10, 18],
  [10, 18],
  [7, 18.6],
  [5, 19],
  [3, 19.4],
  [1, 19.8],
]

const KMS_RATES = [
  ...GMS_RATES.slice(0, 18),
  [12, 8.2],
  [10, 9],
  [30, 10.5],
  [20, 11.5],
  [17.5, 12.25],
  [8.5, 18],
  [8.5, 18],
  [8, 18],
  [7, 18.6],
  [5, 19],
  [3, 19.4],
  [1, 19.8],
]

/**
 * Base meso cost is `1000 + level^3 * (star + 1)^exponent / divisor`, rounded to
 * the nearest 100. Below 10 stars the exponent is 1; from 10 stars up it is 2.7
 * and the divisor changes at nearly every star.
 */
const GMS_DIVISORS = {
  low: 25,
  10: 400,
  11: 220,
  12: 150,
  13: 110,
  14: 75,
  15: 200,
  16: 200,
  17: 150,
  18: 70,
  19: 45,
  20: 200,
  21: 125,
  rest: 200,
}

const KMS_DIVISORS = {
  ...GMS_DIVISORS,
  low: 36,
  10: 571,
  11: 314,
  12: 214,
  13: 157,
  14: 107,
}

/**
 * GMS trace checkpoints after a boom (wiki "Star Force Upon Destruction").
 * 15–19 → 12, 20 → 15, 21–22 → 17, 23–25 → 19, 26–30 → 20.
 */
export function gmsRecoverStar(star) {
  if (star >= 26) return 20
  if (star >= 23) return 19
  if (star >= 21) return 17
  if (star >= 20) return 15
  return 12
}

/**
 * KMS/JMS/MSEA can restore a trace back to the star it blew up at (capped at
 * 22) by spending copies and meso, or cheaply restore to 12★ with one copy.
 * That copy-and-meso path is not modeled yet; the cheap 12★ restore is used.
 */
function kmsRecoverStar() {
  return 12
}

/** An item's star cap is decided by its required level. */
export function maxStarForLevel(level) {
  if (level >= 138) return 30
  if (level >= 128) return 20
  if (level >= 118) return 15
  if (level >= 108) return 10
  if (level >= 95) return 8
  return 5
}

export const SERVERS = {
  gms: {
    id: 'gms',
    label: 'GMS 30 Stars',
    hint: 'Current global rates, post-NEXT revamp',
    rates: GMS_RATES,
    divisors: GMS_DIVISORS,
    recoverStar: gmsRecoverStar,
  },
  kms: {
    id: 'kms',
    label: 'KMS / JMS / MSEA 30 Stars',
    hint: 'Different 18–25 star odds. Trace restore is not fully modeled yet',
    rates: KMS_RATES,
    divisors: KMS_DIVISORS,
    recoverStar: kmsRecoverStar,
  },
}

export const SERVER_ORDER = ['gms', 'kms']

/**
 * GMS Enhancement Mode 2–4. Mode 1 is the base GMS rate table.
 * Success / destroy are percents; costMult is applied to the (already
 * discounted) attempt cost, except Mode 4 at 15–17 which is safeguard:
 * +200% of the undiscounted base.
 *
 * Numbers follow masonym / in-game Mode 1 wiki rates, with higher modes
 * using the same success and cost steps as blushie's GMS calculator.
 */
const GMS_ENHANCEMENT_MODES = {
  15: {
    2: { success: 30, destroy: 1.4, costMult: 1.5 },
    3: { success: 30, destroy: 0.7, costMult: 2.5 },
    4: { success: 30, destroy: 0, costMult: 3, safeguard: true },
  },
  16: {
    2: { success: 30, destroy: 1.4, costMult: 1.5 },
    3: { success: 30, destroy: 0.7, costMult: 2.5 },
    4: { success: 30, destroy: 0, costMult: 3, safeguard: true },
  },
  17: {
    2: { success: 15, destroy: 4.25, costMult: 1.5 },
    3: { success: 15, destroy: 1.7, costMult: 2.5 },
    4: { success: 15, destroy: 0, costMult: 3, safeguard: true },
  },
  18: {
    2: { success: 12, destroy: 4.4, costMult: 2 },
    3: { success: 10, destroy: 1.8, costMult: 3.5 },
    4: { success: 8, destroy: 0, costMult: 6.5 },
  },
  19: {
    2: { success: 12, destroy: 6.16, costMult: 2 },
    3: { success: 10, destroy: 3.6, costMult: 3.5 },
    4: { success: 8, destroy: 0, costMult: 6.5 },
  },
  20: {
    2: { success: 25, destroy: 7.5, costMult: 2 },
    3: { success: 20, destroy: 4, costMult: 3.5 },
    4: { success: 15, destroy: 0, costMult: 6.5 },
  },
  21: {
    2: { success: 12, destroy: 8.8, costMult: 2 },
    3: { success: 10, destroy: 4.5, costMult: 3.5 },
    4: { success: 8, destroy: 0, costMult: 6.5 },
  },
}

export function enhancementModeSpec(star, mode, rates) {
  const [baseSuccess, baseDestroy] = rates[star] ?? [0, 0]
  const level = mode ?? 1
  const override = level > 1 ? GMS_ENHANCEMENT_MODES[star]?.[level] : null

  if (!override) {
    return {
      mode: 1,
      success: baseSuccess,
      destroy: baseDestroy,
      costMult: 1,
      safeguard: false,
    }
  }

  return {
    mode: level,
    success: override.success,
    destroy: override.destroy,
    costMult: override.costMult,
    safeguard: Boolean(override.safeguard),
  }
}

export function enhancementModeSummary(modes) {
  const groups = []
  let start = 0

  for (let index = 1; index <= ENHANCEMENT_MODE_STARS.length; index += 1) {
    const same = index < ENHANCEMENT_MODE_STARS.length
      && (modes?.[ENHANCEMENT_MODE_STARS[index]] ?? 1) === (modes?.[ENHANCEMENT_MODE_STARS[start]] ?? 1)
    if (same) continue

    const level = modes?.[ENHANCEMENT_MODE_STARS[start]] ?? 1
    if (level > 1) {
      const from = ENHANCEMENT_MODE_STARS[start]
      const to = ENHANCEMENT_MODE_STARS[index - 1]
      groups.push(from === to ? `${from}★ M${level}` : `${from}–${to}★ M${level}`)
    }
    start = index
  }

  return groups.join(' · ')
}

export const MVP_TIERS = [
  { id: 'none', label: 'None', discount: 0 },
  { id: 'silver', label: 'MVP Silver', discount: 0.03 },
  { id: 'gold', label: 'MVP Gold', discount: 0.05 },
  { id: 'diamond', label: 'MVP Diamond', discount: 0.1 },
]

export const EVENTS = [
  {
    id: 'fiveTenFifteen',
    label: '5/10/15',
    hint: 'Guaranteed success at 5, 10 and 15 stars',
  },
  {
    id: 'plusTwo',
    label: '+2 Stars (Up to 10 stars)',
    hint: 'A success at 10 stars or below grants 2 stars, up to 12',
  },
  {
    id: 'mesoDiscount',
    label: '30% Meso Discount',
    hint: 'Applies to the base cost only, not the safeguard surcharge',
  },
  {
    id: 'boomReduction',
    label: '30% Boom Reduction',
    hint: 'Destruction rate x0.7 below 21 stars',
  },
]

const EMPTY_EVENTS = {
  fiveTenFifteen: false,
  plusTwo: false,
  mesoDiscount: false,
  boomReduction: false,
}

/** V3 event dropdown. +2 is gone in GMS; 30% off and 30% less boom are Shining. */
export const EVENT_PRESETS = [
  {
    id: 'none',
    label: 'None',
    events: { ...EMPTY_EVENTS },
  },
  {
    id: 'fiveTenFifteen',
    label: '5 / 10 / 15★ guaranteed',
    events: { ...EMPTY_EVENTS, fiveTenFifteen: true },
  },
  {
    id: 'shining',
    label: 'Shining Star Force — 30% off + 30% boom red.',
    events: { ...EMPTY_EVENTS, mesoDiscount: true, boomReduction: true },
  },
  {
    id: 'shiningFiveTenFifteen',
    label: 'Shining + 5/10/15',
    events: {
      ...EMPTY_EVENTS,
      fiveTenFifteen: true,
      mesoDiscount: true,
      boomReduction: true,
    },
  },
]

export function eventsFromPreset(id) {
  return { ...(EVENT_PRESETS.find((preset) => preset.id === id) ?? EVENT_PRESETS[0]).events }
}

export function eventPresetFrom(events = {}) {
  const five = Boolean(events.fiveTenFifteen)
  const shining = Boolean(events.mesoDiscount) || Boolean(events.boomReduction)

  if (shining && five) return 'shiningFiveTenFifteen'
  if (shining) return 'shining'
  if (five) return 'fiveTenFifteen'
  return 'none'
}

/** Superior Engraved Gollux Belt — the item shown in the layout mockup. */
export const DEFAULT_ITEM_ID = 1132246

export const DEFAULT_CONFIG = {
  itemId: DEFAULT_ITEM_ID,
  itemLevel: 150,
  itemMaxStar: null,
  itemValue: 0,
  currentStar: 0,
  targetStar: 22,
  server: 'gms',
  starCatch: false,
  safeguard: false,
  modes: defaultEnhancementModes(),
  mvp: 'silver',
  events: {
    fiveTenFifteen: false,
    plusTwo: false,
    mesoDiscount: false,
    boomReduction: false,
  },
  trials: DEFAULT_TRIALS,
}
