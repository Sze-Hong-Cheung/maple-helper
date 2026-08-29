import { useEffect, useMemo, useState } from 'react'
import HexaTracker from '../components/HexaTracker.jsx'
import SymbolsTracker from '../components/SymbolsTracker.jsx'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatPercent } from '../lib/format.js'
import { useRoster } from '../roster/useRoster.js'

const SELECTED_KEY = 'maple-helper:tracker:selected'
const TABS = [
  { id: 'hexa', label: 'HEXA Tracker' },
  { id: 'symbols', label: 'Symbol Tracker' },
]

const reviveSelected = (stored, fallback) => (typeof stored === 'string' ? stored : fallback)

function CharacterChip({ entry, selected, onSelect }) {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={`flex min-w-[11rem] items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
        selected
          ? 'border-amber-300/40 bg-amber-300/10'
          : 'border-white/10 bg-slate-950/60 hover:border-white/20'
      }`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-950">
        {failed || !entry.avatarUrl ? (
          <span className="text-[10px] font-semibold text-slate-500">{entry.name.slice(0, 2)}</span>
        ) : (
          <img
            src={entry.avatarUrl}
            alt=""
            className="h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setFailed(true)}
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-100">{entry.name}</span>
        <span className="block truncate text-[11px] text-slate-500">
          Lv. {entry.level}
          {entry.job ? ` · ${entry.job}` : ''}
        </span>
      </span>
    </button>
  )
}

export default function TrackerPage() {
  const [roster] = useRoster()
  const [selectedId, setSelectedId] = useStoredState(SELECTED_KEY, '', reviveSelected)
  const [tab, setTab] = useState('hexa')

  useEffect(() => {
    if (roster.length === 0) {
      if (selectedId) setSelectedId('')
      return
    }
    const exists = roster.some((entry) => entry.id === selectedId)
    if (!exists) setSelectedId(roster[0].id)
  }, [roster, selectedId, setSelectedId])

  const character = useMemo(
    () => roster.find((entry) => entry.id === selectedId) ?? null,
    [roster, selectedId],
  )

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Tracker</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Pick a roster character, then track HEXA cores and symbols for that character. Each
          character&rsquo;s progress is saved separately.
        </p>
      </header>

      {roster.length === 0 ? (
        <p className="rounded-2xl border border-white/8 bg-slate-900/70 px-4 py-8 text-center text-sm text-slate-400">
          Add a character on the Roster page first.
        </p>
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-white/8 bg-slate-900/70 p-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-slate-400">Character</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {roster.map((entry) => (
                <CharacterChip
                  key={entry.id}
                  entry={entry}
                  selected={entry.id === character?.id}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
            {character ? (
              <p className="mt-3 text-xs text-slate-500">
                {character.region?.toUpperCase()}
                {character.job ? ` · ${character.job}` : ''}
                {Number.isFinite(character.expProgress) && character.level < 300
                  ? ` · EXP ${formatPercent(character.expProgress)}`
                  : ''}
              </p>
            ) : null}
          </section>

          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-slate-900/80 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  tab === item.id
                    ? 'bg-amber-300/15 text-amber-100 ring-1 ring-amber-300/30 ring-inset'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {character && tab === 'hexa' ? (
            <HexaTracker
              key={`hexa-${character.id}`}
              storageKey={`maple-helper:hexa:${character.id}`}
              job={character.job}
              showHeader={false}
            />
          ) : null}
          {character && tab === 'symbols' ? (
            <SymbolsTracker
              key={`symbols-${character.id}`}
              storageKey={`maple-helper:symbols:${character.id}`}
              showHeader={false}
            />
          ) : null}
        </>
      )}
    </>
  )
}
