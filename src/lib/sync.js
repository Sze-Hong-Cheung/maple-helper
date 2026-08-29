/**
 * Cloud sync adapter seam for a future Supabase login.
 * Keep this file as the only place that talks to a remote backend.
 */
export const SYNC_STATUS = {
  LOCAL: 'local',
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
}

export const defaultSyncAdapter = {
  provider: 'none',
  isEnabled() {
    return false
  },
  async getSession() {
    return null
  },
  async pull() {
    return null
  },
  async push(payload) {
    return { skipped: true, reason: 'cloud-sync-not-configured', payload }
  },
}

export function createSupabaseSyncAdapter(client = null) {
  return {
    provider: 'supabase',
    client,
    isEnabled() {
      return false
    },
    async getSession() {
      throw new Error('Supabase adapter is not wired yet')
    },
    async pull() {
      throw new Error('Supabase adapter is not wired yet')
    },
    async push() {
      throw new Error('Supabase adapter is not wired yet')
    },
  }
}
