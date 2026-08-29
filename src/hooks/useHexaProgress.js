import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_NODES, MAX_LEVEL, MIN_LEVEL } from '../constants.js'
import { clampLevel, totalsForNodes } from '../lib/calc.js'
import { clearProgress, loadProgress, saveProgress } from '../lib/storage.js'
import { SYNC_STATUS, defaultSyncAdapter } from '../lib/sync.js'

export function useHexaProgress({
  syncAdapter = defaultSyncAdapter,
  storageKey,
} = {}) {
  const initial = useMemo(() => loadProgress(storageKey), [storageKey])
  const [progress, setProgress] = useState(initial)
  const [syncStatus, setSyncStatus] = useState(
    syncAdapter.isEnabled() ? SYNC_STATUS.IDLE : SYNC_STATUS.LOCAL,
  )
  const [syncError, setSyncError] = useState(null)

  const commit = useCallback((nodes) => {
    const saved = saveProgress({ nodes }, storageKey)
    setProgress({
      version: saved?.version ?? initial.version,
      nodes,
      updatedAt: saved?.updatedAt ?? new Date().toISOString(),
    })
  }, [initial.version, storageKey])

  useEffect(() => {
    let cancelled = false

    async function hydrateFromCloud() {
      if (!syncAdapter.isEnabled()) return
      setSyncStatus(SYNC_STATUS.SYNCING)
      try {
        const remote = await syncAdapter.pull()
        if (cancelled || !remote?.nodes) {
          setSyncStatus(SYNC_STATUS.LOCAL)
          return
        }
        commit(remote.nodes)
        setSyncStatus(SYNC_STATUS.SYNCED)
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'sync failed')
          setSyncStatus(SYNC_STATUS.ERROR)
        }
      }
    }

    hydrateFromCloud()
    return () => {
      cancelled = true
    }
  }, [commit, syncAdapter])

  const totals = useMemo(() => totalsForNodes(progress.nodes), [progress.nodes])

  const updateNode = useCallback(
    (id, patch) => {
      const next = progress.nodes.map((node) => {
        if (node.id !== id) return node
        const updated = { ...node, ...patch }
        const floor = node.min ?? MIN_LEVEL
        updated.min = floor
        updated.current = clampLevel(updated.current, floor)
        updated.target = clampLevel(updated.target, updated.current)
        return updated
      })
      commit(next)
    },
    [commit, progress.nodes],
  )

  const applyQuickSetting = useCallback(
    (action) => {
      const next = progress.nodes.map((node) => {
        const floor = node.min ?? MIN_LEVEL
        if (action === 'reset-current-and-targets') {
          return { ...node, current: floor, target: MAX_LEVEL }
        }
        if (action === 'reset-current') {
          const current = floor
          return { ...node, current, target: clampLevel(node.target, current) }
        }
        if (action === 'set-targets-30') {
          return { ...node, target: clampLevel(MAX_LEVEL, node.current) }
        }
        return node
      })
      commit(next)
    },
    [commit, progress.nodes],
  )

  const reset = useCallback(() => {
    clearProgress(storageKey)
    const fresh = DEFAULT_NODES.map((node) => ({ ...node }))
    commit(fresh)
    setSyncStatus(syncAdapter.isEnabled() ? SYNC_STATUS.IDLE : SYNC_STATUS.LOCAL)
    setSyncError(null)
  }, [commit, storageKey, syncAdapter])

  return {
    nodes: progress.nodes,
    totals,
    syncStatus,
    syncError,
    updatedAt: progress.updatedAt,
    updateNode,
    applyQuickSetting,
    reset,
  }
}
