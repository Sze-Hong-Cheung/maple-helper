import { formatCount, formatMeso } from '../../lib/format.js'

const PERCENTILES = [
  { key: 'median', label: 'Median', hint: 'Half of all runs come in under this' },
  { key: 'p75', label: '75th', hint: 'Three runs in four stay under this' },
  { key: 'p85', label: '85th' },
  { key: 'p95', label: '95th', hint: 'Only 1 run in 20 goes worse than this' },
]

function Histogram({ buckets, total }) {
  const peak = Math.max(...buckets.map((bucket) => bucket.count), 1)

  return (
    <div className="flex h-40 items-end gap-[3px]">
      {buckets.map((bucket, index) => {
        const share = ((bucket.count / total) * 100).toFixed(1)
        const range = bucket.overflow
          ? `over ${formatMeso(bucket.from)}`
          : `${formatMeso(bucket.from)} – ${formatMeso(bucket.to)}`

        return (
          <div
            key={index}
            title={`${range} · ${bucket.count} runs (${share}%)`}
            className="group relative h-full flex-1"
          >
            <div
              className={`absolute bottom-0 w-full rounded-t-sm transition ${
                bucket.overflow
                  ? 'bg-rose-400/50 group-hover:bg-rose-300/70'
                  : 'bg-gradient-to-t from-cyan-500/40 to-amber-300/70 group-hover:from-cyan-400/60 group-hover:to-amber-200'
              }`}
              style={{ height: `${Math.max(1, (bucket.count / peak) * 100)}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function SimulationResult({ result }) {
  const { meso, booms, histogram, trials, requestedTrials, canBoom, incomplete } = result
  const first = histogram[0]
  const last = histogram[histogram.length - 1]

  return (
    <section className="rounded-2xl border border-white/8 bg-slate-900/70 p-5 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">Cost Distribution</h2>
        <p className="text-xs text-slate-500">
          {trials.toLocaleString('en-US')} runs
          {trials < requestedTrials
            ? ` (asked for ${requestedTrials.toLocaleString('en-US')}, hit the compute budget)`
            : null}
        </p>
      </div>

      {incomplete ? (
        <p className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-xs leading-5 text-rose-100">
          This target is steep enough that some runs were cut off before reaching it, so the
          numbers below are floors rather than real results. Trust the exact expectation above
          for ranges like this.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Histogram buckets={histogram} total={trials} />
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>{formatMeso(first.from)}</span>
            <span>{last.overflow ? `${formatMeso(last.from)}+` : formatMeso(last.to)}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Total mesos spent per run. The red bar on the right is the tail beyond the 95th
            percentile. Hover any bar for its share.
          </p>
        </div>

        <div className="space-y-2">
          {PERCENTILES.map((row) => (
            <div
              key={row.key}
              title={row.hint}
              className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2"
            >
              <span className="text-xs text-slate-400">{row.label}</span>
              <span className="font-mono text-sm text-amber-200">{formatMeso(meso[row.key])}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2">
            <span className="text-xs text-slate-400">Best / worst</span>
            <span className="font-mono text-xs text-slate-300">
              {formatMeso(meso.min)} / {formatMeso(meso.max)}
            </span>
          </div>
          {canBoom ? (
            <div className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2">
              <span className="text-xs text-slate-400">Booms median / 95th</span>
              <span className="font-mono text-xs text-rose-200">
                {formatCount(booms.median, 0)} / {formatCount(booms.p95, 0)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
