import { useEffect, useState } from 'react'

const shallowMerge = (stored, fallback) => ({ ...fallback, ...stored })

/**
 * State that mirrors itself into localStorage. `revive` gets the parsed value
 * plus the default so callers can merge in fields added after a save.
 */
export function useStoredState(key, fallback, revive = shallowMerge) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? revive(JSON.parse(raw), fallback) : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private mode or a full quota: keeping the in-memory value is enough.
    }
  }, [key, value])

  return [value, setValue]
}
