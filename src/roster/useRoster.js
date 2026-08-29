import { useEffect, useState } from 'react'
import {
  lookupMissing,
  mergeRoster,
  persistRosterFile,
  readFileRoster,
  readStoredRoster,
} from './db.js'
import { ROSTER_STORAGE_KEY } from './lookup.js'

export function useRoster() {
  const [roster, setRoster] = useState(() =>
    mergeRoster(readFileRoster(), readStoredRoster(ROSTER_STORAGE_KEY)),
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster))
    } catch {
      // Private mode or a full quota: keeping the in-memory value is enough.
    }
    persistRosterFile(roster)
  }, [roster])

  useEffect(() => {
    let cancelled = false
    lookupMissing(roster).then((found) => {
      if (cancelled || found.length === 0) return
      setRoster((current) => mergeRoster(current, found))
    })
    return () => {
      cancelled = true
    }
    // Only hydrate stubs from the file/storage snapshot on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [roster, setRoster]
}
