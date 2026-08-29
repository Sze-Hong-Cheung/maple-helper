import { useState } from 'react'
import { CORE_TYPES, CORE_TYPE_ORDER } from '../constants.js'
import { SYNC_STATUS } from '../lib/sync.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import ResourceAmount from './ResourceAmount.jsx'

const statusCopy = {
  [SYNC_STATUS.LOCAL]: { label: 'Local only', hint: 'Cloud sync hook is reserved' },
  [SYNC_STATUS.IDLE]: { label: 'Not synced', hint: 'Waiting for sign-in' },
  [SYNC_STATUS.SYNCING]: { label: 'Syncing', hint: 'Writing to the cloud' },
  [SYNC_STATUS.SYNCED]: { label: 'Synced', hint: 'Cloud progress is up to date' },
  [SYNC_STATUS.ERROR]: { label: 'Sync failed', hint: 'Still saved locally' },
}

export default function TotalPanel({ totals, syncStatus, updatedAt, onReset }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const status = statusCopy[syncStatus] ?? statusCopy[SYNC_STATUS.LOCAL]
  const percent = Math.round(totals.fragmentProgress * 100)

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/40">
        <div className="border-b border-white/8 bg-amber-300/8 px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-200/80 uppercase">
            Totals
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-50">Still needed</h2>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-400">Sol Erda</p>
            <ResourceAmount
              kind="solErda"
              value={totals.remaining.solErda}
              size={26}
              className="mt-1 font-mono text-3xl tracking-tight text-amber-200"
            />
          </div>
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-400">Sol Erda Fragments</p>
            <ResourceAmount
              kind="fragments"
              value={totals.remaining.fragments}
              size={26}
              className="mt-1 font-mono text-3xl tracking-tight text-cyan-200"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Progress by fragments</span>
              <span className="font-medium text-slate-200">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {CORE_TYPE_ORDER.map((type) => {
              const row = totals.byType[type]
              if (!row) return null
              const meta = CORE_TYPES[type]
              return (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{meta.label}</span>
                  <span className="inline-flex items-center gap-2.5 font-mono">
                    <ResourceAmount
                      kind="solErda"
                      value={row.remaining.solErda}
                      size={14}
                      className="text-amber-200/80"
                    />
                    <ResourceAmount
                      kind="fragments"
                      value={row.remaining.fragments}
                      size={14}
                      className="text-cyan-200/80"
                    />
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 border-t border-white/8 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-200">{status.label}</p>
              <p className="text-[11px] text-slate-500">{status.hint}</p>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 ring-1 ring-white/10">
              {syncStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {updatedAt
              ? `Saved locally at ${new Date(updatedAt).toLocaleString('en-US')}`
              : 'Level changes are written to localStorage automatically'}
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-full rounded-xl border border-white/10 bg-white/4 py-2 text-sm text-slate-300 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-100"
          >
            Reset all levels
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset all levels?"
        description="Every node goes back to its default — Origin Skill at 1, everything else at 0, all targets at 30. The progress saved in this browser is cleared and this cannot be undone."
        confirmLabel="Reset"
        onConfirm={() => {
          setConfirmOpen(false)
          onReset()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </aside>
  )
}
