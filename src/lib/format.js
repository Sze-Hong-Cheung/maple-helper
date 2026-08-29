const UNITS = [
  { limit: 1e12, divisor: 1e12, suffix: 'T', digits: 2 },
  { limit: 1e9, divisor: 1e9, suffix: 'B', digits: 2 },
  { limit: 1e6, divisor: 1e6, suffix: 'M', digits: 2 },
  { limit: 1e3, divisor: 1e3, suffix: 'K', digits: 1 },
]

/** Meso totals reach into the trillions, so they get compact units. */
export function formatMeso(value) {
  if (!Number.isFinite(value)) return '—'

  const unit = UNITS.find((entry) => value >= entry.limit)
  if (!unit) return Math.round(value).toLocaleString('en-US')

  return `${(value / unit.divisor).toFixed(unit.digits)}${unit.suffix}`
}

export function formatExactMeso(value) {
  if (!Number.isFinite(value)) return '—'
  return Math.round(value).toLocaleString('en-US')
}

export function formatCount(value, digits = 1) {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1000) return Math.round(value).toLocaleString('en-US')
  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

export function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return '—'
  if (value > 0 && value < 0.001) return '<0.1%'
  return `${(value * 100).toFixed(digits)}%`
}
