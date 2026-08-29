import { useCallback, useMemo, useState } from 'react'
import { formatExactMeso } from '../lib/format.js'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatCompletion, normalizeRow, progressFor, reviveProgress, symbolsToNext } from '../symbols/calc.js'
import { SYMBOL_GROUPS, SYMBOLS, defaultProgress } from '../symbols/constants.js'

export const SYMBOLS_STORAGE_KEY = 'maple-helper:symbols:v1'

function summarize(rows) {
  const symbols = rows.reduce((sum, row) => sum + row.remaining, 0)
  const meso = rows.reduce((sum, row) => sum + row.meso, 0)
  const days = rows.reduce((max, row) => {
    const value = Number.isFinite(row.days) ? row.days : 0
    return Math.max(max, value)
  }, 0)

  return {
    symbols,
    meso,
    days,
    completeOn: rows.every((row) => row.remaining === 0) ? 'Done' : formatCompletion(days),
  }
}

const inputClass =
  'w-16 rounded-lg border border-white/12 bg-slate-950/80 px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-slate-100 outline-none transition focus:border-amber-300/60 disabled:opacity-40'

function NumberBox({ value, min, max, disabled, ariaLabel, onChange }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      disabled={disabled}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  )
}

function SymbolIcon({ entry }) {
  const [failed, setFailed] = useState(false)

  return (
    <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-slate-950/80">
      {failed ? (
        <span className="text-[10px] font-semibold tracking-wide text-slate-500">
          {entry.name.slice(0, 2)}
        </span>
      ) : (
        <img
          src={entry.icon}
          alt=""
          className="h-8 w-8 object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

export default function SymbolsTracker({ storageKey = SYMBOLS_STORAGE_KEY, showHeader = true }) {
  const [progress, setProgress] = useStoredState(storageKey, defaultProgress(), reviveProgress)

  const rows = useMemo(
    () => SYMBOLS.map((entry) => ({ entry, ...progressFor(entry, progress[entry.id]) })),
    [progress],
  )

  const patch = useCallback(
    (id, field, value) => {
      setProgress((prev) => {
        const entry = SYMBOLS.find((item) => item.id === id)
        if (!entry) return prev
        return { ...prev, [id]: normalizeRow(entry, { ...prev[id], [field]: value }) }
      })
    },
    [setProgress],
  )

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.symbols += row.remaining
          acc.meso += row.meso
          acc.days = Math.max(acc.days, Number.isFinite(row.days) ? row.days : 0)
          return acc
        },
        { symbols: 0, meso: 0, days: 0 },
      ),
    [rows],
  )

  return (
    <>
      {showHeader ? (
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Symbol Tracker
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Fill current level and EXP for every symbol. Remaining count, meso, and finish date
            update immediately. Arcane is 20/day plus 45 weekly on Monday. Sacred is 10/day,
            except Cernium at 20/day. Grand Sacred is 10/day.
          </p>
        </header>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg shadow-black/20">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-[11px] tracking-wide text-slate-500 uppercase">
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 text-center font-medium">Level</th>
              <th className="px-3 py-3 text-center font-medium">EXP</th>
              <th className="px-3 py-3 text-center font-medium">Target</th>
              <th className="px-3 py-3 text-right font-medium">Remaining</th>
              <th className="px-3 py-3 text-right font-medium">Mesos</th>
              <th className="px-4 py-3 text-right font-medium">Complete</th>
            </tr>
          </thead>
          <tbody>
            {SYMBOL_GROUPS.map((group) => {
              const groupRows = rows.filter((row) => row.entry.type === group.id)
              return (
                <GroupRows
                  key={group.id}
                  label={group.label}
                  rows={groupRows}
                  progress={progress}
                  onPatch={patch}
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-slate-950/50 text-xs">
              <td className="px-4 py-3 font-medium text-slate-300" colSpan={5}>
                Total
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-200">
                {totals.symbols.toLocaleString('en-US')}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-200">
                {formatExactMeso(totals.meso)}
              </td>
              <td className="px-4 py-3 text-right text-slate-400">
                longest {totals.days.toLocaleString('en-US')} days
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

function GroupRows({ label, rows, progress, onPatch }) {
  const subtotal = summarize(rows)

  return (
    <>
      <tr className="bg-white/3">
        <td
          colSpan={8}
          className="px-4 py-2 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase"
        >
          {label}
        </td>
      </tr>
      {rows.map((row) => {
        const { entry } = row
        const current = progress[entry.id]
        const maxExp = Math.max(0, symbolsToNext(entry, current.level) - 1)

        return (
          <tr key={entry.id} className="border-t border-white/6">
            <td className="px-4 py-2.5">
              <SymbolIcon entry={entry} />
            </td>
            <td className="px-3 py-2.5 font-medium text-slate-200">{entry.name}</td>
            <td className="px-3 py-2.5 text-center">
              <NumberBox
                value={current.level}
                min={0}
                max={entry.maxLevel}
                ariaLabel={`${entry.name} level`}
                onChange={(value) => onPatch(entry.id, 'level', value)}
              />
            </td>
            <td className="px-3 py-2.5 text-center">
              <NumberBox
                value={current.exp}
                min={0}
                max={maxExp}
                disabled={current.level === 0 || current.level >= entry.maxLevel}
                ariaLabel={`${entry.name} EXP`}
                onChange={(value) => onPatch(entry.id, 'exp', value)}
              />
            </td>
            <td className="px-3 py-2.5 text-center">
              <NumberBox
                value={current.target}
                min={1}
                max={entry.maxLevel}
                ariaLabel={`${entry.name} target level`}
                onChange={(value) => onPatch(entry.id, 'target', value)}
              />
            </td>
            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-200">
              {row.remaining.toLocaleString('en-US')}
            </td>
            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-200/90">
              {row.meso === 0 ? '—' : formatExactMeso(row.meso)}
            </td>
            <td className="px-4 py-2.5 text-right">
              {row.remaining === 0 ? (
                <span className="text-emerald-300">Done</span>
              ) : (
                <span className="text-slate-300">
                  {row.completeOn}
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {row.days.toLocaleString('en-US')} days
                  </span>
                </span>
              )}
            </td>
          </tr>
        )
      })}
      <tr className="border-t border-white/10 bg-slate-950/40 text-xs">
        <td className="px-4 py-2.5 font-medium text-slate-400" colSpan={5}>
          {label} subtotal
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-200/90">
          {subtotal.symbols.toLocaleString('en-US')}
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-200/90">
          {subtotal.meso === 0 ? '—' : formatExactMeso(subtotal.meso)}
        </td>
        <td className="px-4 py-2.5 text-right text-slate-400">
          {subtotal.symbols === 0 ? (
            <span className="text-emerald-300">Done</span>
          ) : (
            <>
              {subtotal.completeOn}
              <span className="mt-0.5 block text-[11px] text-slate-500">
                longest {subtotal.days.toLocaleString('en-US')} days
              </span>
            </>
          )}
        </td>
      </tr>
    </>
  )
}
