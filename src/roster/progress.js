import { EXP_TO_NEXT } from './expToNext.js'

export const MAX_CHARACTER_LEVEL = 300

/** Share of the current level completed, 0–1. Max level is treated as complete. */
export function expProgress(level, exp) {
  if (!Number.isFinite(level) || level >= MAX_CHARACTER_LEVEL) return 1
  const need = EXP_TO_NEXT[level]
  if (!need) return null
  const current = Number(exp)
  if (!Number.isFinite(current) || current <= 0) return 0
  return Math.min(1, Math.max(0, current / need))
}
