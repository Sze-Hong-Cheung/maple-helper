import { EVENT_PRESETS, EVENTS, MVP_TIERS, SERVERS, enhancementModeSummary, eventPresetFrom } from '../../starforce/constants.js'
import { formatCount, formatMeso, formatPercent } from '../../lib/format.js'
import { findItemById } from '../../starforce/items.js'

function eventLabels(events) {
  const preset = eventPresetFrom(events)
  if (preset !== 'none') {
    return EVENT_PRESETS.find((item) => item.id === preset)?.label ?? '—'
  }
  const extra = EVENTS.filter((event) => events?.[event.id]).map((event) => event.label)
  return extra.length ? extra.join(' · ') : '—'
}

function mvpLabel(id) {
  return MVP_TIERS.find((tier) => tier.id === id)?.label ?? 'None'
}

export function snapshotFrom(config, expectation, simulation) {
  return {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    itemId: config.itemId,
    itemLevel: config.itemLevel,
    itemValue: config.itemValue ?? 0,
    currentStar: config.currentStar,
    targetStar: config.targetStar,
    server: config.server,
    starCatch: config.starCatch,
    safeguard: config.safeguard,
    modes: { ...config.modes },
    mvp: config.mvp,
    events: { ...config.events },
    meso: expectation.meso,
    booms: expectation.booms,
    attempts: expectation.attempts,
    noBoomChance: expectation.noBoomChance,
    medianMeso: simulation?.meso.median ?? null,
  }
}

export default function SavedRunsTable({ rows, onLoad, onRemove, onClear }) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-xs text-slate-500">
        Saved setups will show up here.
      </p>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">Saved runs</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 transition hover:text-rose-200"
        >
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">Item</th>
              <th className="px-3 py-2.5 font-medium">Stars</th>
              <th className="px-3 py-2.5 font-medium">Settings</th>
              <th className="px-3 py-2.5 text-right font-medium">Mesos</th>
              <th className="px-3 py-2.5 text-right font-medium">Booms</th>
              <th className="px-3 py-2.5 text-right font-medium">Attempts</th>
              <th className="px-3 py-2.5 text-right font-medium">No boom</th>
              <th className="px-5 py-2.5 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const item = row.itemId ? findItemById(row.itemId) : null
              const modeNote = enhancementModeSummary(row.modes)
              return (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      {item?.icon ? (
                        <img
                          src={item.icon}
                          alt=""
                          className="size-7 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-slate-200">{item?.name ?? 'Custom item'}</p>
                        <p className="text-[10px] text-slate-500">
                          Lv {row.itemLevel}
                          {row.itemValue > 0 ? ` · ${formatMeso(row.itemValue)}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                    {row.currentStar} → {row.targetStar}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">
                    <p>
                      {SERVERS[row.server]?.label ?? row.server}
                      {row.starCatch ? ' · Catch' : ''}
                      {row.safeguard ? ' · Safeguard' : ''}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {mvpLabel(row.mvp)} · {eventLabels(row.events)}
                      {modeNote ? ` · ${modeNote}` : ''}
                    </p>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-amber-200"
                    title={row.medianMeso != null ? `Trial median ${formatMeso(row.medianMeso)}` : undefined}
                  >
                    {formatMeso(row.meso)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-rose-200">
                    {formatCount(row.booms, 2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-cyan-200">
                    {formatCount(row.attempts, 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                    {formatPercent(row.noBoomChance, 2)}
                  </td>
                  <td className="px-5 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onLoad(row)}
                      className="text-slate-400 transition hover:text-amber-200"
                    >
                      Load
                    </button>
                    <span className="mx-2 text-white/10">|</span>
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="text-slate-400 transition hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
