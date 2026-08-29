import { formatCount, formatExactMeso, formatMeso, formatPercent } from '../../lib/format.js'

function Tile({ label, value, hint, tone = 'slate', title }) {
  const tones = {
    amber: 'text-amber-200',
    rose: 'text-rose-200',
    cyan: 'text-cyan-200',
    slate: 'text-slate-100',
  }

  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4" title={title}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-2xl tracking-tight ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  )
}

export default function ExpectationPanel({ expectation, route }) {
  const done = route.currentStar >= route.targetStar

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/40">
      <div className="border-b border-white/8 bg-amber-300/8 px-5 py-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-200/80 uppercase">
          Expected Cost
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-50">
          {done
            ? 'Already at the target'
            : `${route.currentStar}★ → ${route.targetStar}★ · exact expectation`}
        </h2>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Mesos"
          tone="amber"
          value={formatMeso(expectation.meso)}
          hint={
            expectation.replacementMeso > 0
              ? `${formatMeso(expectation.enhanceMeso)} star force + ${formatMeso(expectation.replacementMeso)} replacements`
              : `${formatExactMeso(expectation.meso)} mesos`
          }
          title={`${formatExactMeso(expectation.meso)} mesos`}
        />
        <Tile
          label="Booms"
          tone="rose"
          value={formatCount(expectation.booms, 2)}
          hint={
            expectation.booms > 0
              ? route.itemValue > 0
                ? 'Replacement cost is included in mesos'
                : 'Set an item value to include replacements'
              : 'This range cannot destroy the item'
          }
        />
        <Tile
          label="Attempts"
          tone="cyan"
          value={formatCount(expectation.attempts, 0)}
          hint="Includes attempts that keep the star"
        />
        <Tile
          label="No-boom chance"
          value={formatPercent(expectation.noBoomChance, 2)}
          hint="Odds of clearing on a single item"
        />
      </div>

      <p className="border-t border-white/8 px-5 py-3 text-[11px] leading-5 text-slate-500">
        These are exact expectations from solving the cost recursion, not sampled averages,
        and they update as you change the settings above. A few catastrophic runs pull the
        mean well above what most players actually pay — check the percentiles below for
        that.
      </p>
    </section>
  )
}
