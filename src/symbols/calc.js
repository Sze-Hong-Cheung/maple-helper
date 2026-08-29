import { SYMBOLS } from './constants.js'

export function symbolsToNext(entry, level) {
  if (level < 1 || level >= entry.maxLevel) return 0
  if (entry.type === 'arcane') return level ** 2 + 11
  return 9 * level ** 2 + 20 * level
}

export function mesoToNext(entry, level) {
  const count = symbolsToNext(entry, level)
  if (count === 0) return 0
  const tenths = Math.round(entry.mesoBase * 10)
  if (entry.type === 'arcane') {
    return 10_000 * Math.floor((count * (tenths + level)) / 10)
  }
  return 100_000 * Math.floor((count * (tenths - 6 * level)) / 10)
}

function clampInt(value, min, max, fallback) {
  const parsed = Math.trunc(Number(value))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export function normalizeRow(entry, row = {}) {
  const level = clampInt(row.level, 0, entry.maxLevel, 1)
  const maxExp = Math.max(0, symbolsToNext(entry, level) - 1)
  const exp = level === 0 || level === entry.maxLevel ? 0 : clampInt(row.exp, 0, maxExp, 0)
  const target = clampInt(row.target, Math.max(level, 1), entry.maxLevel, entry.maxLevel)
  return { level, exp, target }
}

/**
 * Remaining symbols and meso to go from `level`/`exp` to exactly `target`.
 * Level 0 means the starter symbol has not been obtained yet.
 */
export function remainingToTarget(entry, row) {
  const { level, exp, target } = normalizeRow(entry, row)

  if (level >= target) return { symbols: 0, meso: 0 }

  let symbols = 0
  let meso = 0
  let from = level

  if (from === 0) {
    symbols += 1
    from = 1
  }

  if (from < target) {
    symbols += Math.max(0, symbolsToNext(entry, from) - exp)
    meso += mesoToNext(entry, from)
    for (let star = from + 1; star < target; star += 1) {
      symbols += symbolsToNext(entry, star)
      meso += mesoToNext(entry, star)
    }
  }

  return { symbols, meso }
}

export function daysToFinish(remaining, daily, weekly, from = new Date()) {
  if (remaining <= 0) return 0
  if (daily <= 0 && weekly <= 0) return Infinity

  let have = 0
  let days = 0
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)

  while (have < remaining && days < 20_000) {
    have += daily
    if (cursor.getDay() === 1) have += weekly
    days += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function completionDate(days, from = new Date()) {
  if (!Number.isFinite(days) || days <= 0) return from
  const date = new Date(from)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

export function formatCompletion(days, from = new Date()) {
  if (days === 0) return 'Done'
  if (!Number.isFinite(days)) return '—'
  return completionDate(days, from).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function progressFor(entry, row, from = new Date()) {
  const normalized = normalizeRow(entry, row)
  const remaining = remainingToTarget(entry, normalized)
  const days = daysToFinish(remaining.symbols, entry.daily, entry.weekly, from)
  return {
    ...normalized,
    remaining: remaining.symbols,
    meso: remaining.meso,
    days,
    completeOn: formatCompletion(days, from),
  }
}

export function reviveProgress(stored, fallback) {
  const next = { ...fallback }
  if (!stored || typeof stored !== 'object') return next
  for (const entry of SYMBOLS) {
    next[entry.id] = normalizeRow(entry, { ...fallback[entry.id], ...stored[entry.id] })
  }
  return next
}
