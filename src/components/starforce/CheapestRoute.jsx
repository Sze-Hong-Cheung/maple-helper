import { formatCount, formatExactMeso, formatMeso } from '../../lib/format.js'

export default function CheapestRoute({ route, onApply }) {
  if (!route) return null

  const { expectation, savings, matches, summary, alternatives } = route

  return (
    <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/70">
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-200/80 uppercase">
            Cheapest route
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-50">{summary}</h2>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Picks Enhancement Modes to minimize expected mesos, counting both star-force
            attempts and the item value you pay after each boom.
            {route.current.config.itemValue === 0
              ? ' Set an item value if replacements actually cost mesos.'
              : null}
          </p>
        </div>
        <button
          type="button"
          disabled={matches}
          onClick={() => onApply(route)}
          className="shrink-0 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-default disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
        >
          {matches ? 'Using this route' : 'Apply cheapest'}
        </button>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] text-slate-500">Expected mesos</p>
          <p className="mt-0.5 font-mono text-xl text-amber-200" title={formatExactMeso(expectation.meso)}>
            {formatMeso(expectation.meso)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Expected booms</p>
          <p className="mt-0.5 font-mono text-xl text-rose-200">{formatCount(expectation.booms, 2)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">{matches ? 'Vs other presets' : 'Saved vs current'}</p>
          <p className={`mt-0.5 font-mono text-xl ${savings > 1000 ? 'text-emerald-300' : 'text-slate-300'}`}>
            {matches || savings <= 1000 ? '—' : formatMeso(savings)}
          </p>
        </div>
      </div>

      {route.steps.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-white/8 px-5 py-3">
          {route.steps.map((step) => (
            <span
              key={step.star}
              className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                step.mode === step.current
                  ? 'bg-white/6 text-slate-400'
                  : 'bg-cyan-300/12 text-cyan-100'
              }`}
            >
              {step.star}★ M{step.mode}
            </span>
          ))}
        </div>
      ) : null}

      <ul className="border-t border-white/8 px-5 py-3 text-[11px] text-slate-400">
        {alternatives.map((row) => {
          const best = Math.abs(row.meso - expectation.meso) <= 1
          return (
            <li key={row.id} className="flex items-center justify-between gap-3 py-0.5">
              <span className={best ? 'text-cyan-100' : ''}>
                {row.label}
                {best ? ' · cheapest' : ''}
              </span>
              <span className="font-mono tabular-nums text-slate-300">{formatMeso(row.meso)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
