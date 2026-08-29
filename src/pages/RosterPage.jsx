import { useState } from 'react'
import { useStoredState } from '../hooks/useStoredState.js'
import { formatPercent } from '../lib/format.js'
import { ROSTER_REGIONS, ROSTER_STORAGE_KEY, lookupGmsCharacter, rosterId } from '../roster/lookup.js'

const STORAGE_KEY = ROSTER_STORAGE_KEY

const reviveRoster = (stored, fallback) => (Array.isArray(stored) ? stored : fallback)

function Avatar({ name, src }) {
  const [failed, setFailed] = useState(false)

  return (
    <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
      {failed || !src ? (
        <span className="text-sm font-semibold tracking-wide text-slate-500">
          {name.slice(0, 2)}
        </span>
      ) : (
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

export default function RosterPage() {
  const [roster, setRoster] = useStoredState(STORAGE_KEY, [], reviveRoster)
  const [region, setRegion] = useState('na')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const character = await lookupGmsCharacter(region, name)
      setRoster((current) => {
        const rest = current.filter((entry) => entry.id !== character.id)
        return [character, ...rest]
      })
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  const remove = (id) => {
    setRoster((current) => current.filter((entry) => entry.id !== id))
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Roster</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Look up a GMS character on the public rankings and keep their avatar, class, level, and
          EXP progress in this browser.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-900/70 p-4 sm:flex-row sm:items-end"
      >
        <fieldset className="sm:w-36">
          <legend className="mb-1.5 text-xs font-medium tracking-wide text-slate-400">Region</legend>
          <div className="inline-flex rounded-full border border-white/10 bg-slate-950/80 p-1">
            {ROSTER_REGIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRegion(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  region === item.id
                    ? 'bg-amber-300/15 text-amber-100 ring-1 ring-amber-300/30 ring-inset'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">
            Character name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Exact in-game name"
            autoComplete="off"
            spellCheck="false"
            className="w-full rounded-lg border border-white/12 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300/60"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-amber-300/30 ring-inset transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Looking up…' : 'Confirm'}
        </button>
      </form>

      {error ? (
        <p className="mb-6 rounded-xl border border-rose-400/20 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {roster.length === 0 ? (
        <p className="text-sm text-slate-500">No characters saved yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((entry) => (
            <li
              key={entry.id ?? rosterId(entry.region, entry.name)}
              className="flex gap-4 rounded-2xl border border-white/8 bg-slate-900/70 p-4"
            >
              <Avatar name={entry.name} src={entry.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div>
                    <p className="truncate font-semibold text-slate-100">{entry.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      <span className="uppercase">{entry.region}</span>
                      {entry.job ? ` · ${entry.job}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="text-xs text-slate-500 transition hover:text-rose-200"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm tabular-nums text-slate-200">Lv. {entry.level}</p>
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>EXP</span>
                    <span className="tabular-nums text-slate-200">
                      {entry.level >= 300 ? 'Max' : formatPercent(entry.expProgress)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300"
                      style={{ width: `${Math.round((entry.expProgress ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
