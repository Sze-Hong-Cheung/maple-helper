import { formatMeso, formatPercent } from '../../lib/format.js'

export default function StarBreakdown({ rows }) {
  if (rows.length === 0) return null

  return (
    <details className="group rounded-2xl border border-white/8 bg-slate-900/70 shadow-lg shadow-black/20 backdrop-blur-sm">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold tracking-wide text-slate-300 transition hover:text-slate-100">
        <span className="mr-2 inline-block transition group-open:rotate-90">›</span>
        Per-star cost and odds
      </summary>

      <div className="overflow-x-auto border-t border-white/8">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">Star</th>
              <th className="px-3 py-2.5 text-right font-medium">Cost / attempt</th>
              <th className="px-3 py-2.5 text-right font-medium">Success</th>
              <th className="px-3 py-2.5 text-right font-medium">Maintain</th>
              <th className="px-3 py-2.5 text-right font-medium">Boom</th>
              <th className="px-5 py-2.5 text-right font-medium">Recover</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((row) => (
              <tr key={row.star} className="border-t border-white/5">
                <td className="px-5 py-2 text-slate-300">
                  {row.star} → {row.star + 1}
                  {row.safeguarded ? (
                    <span className="ml-2 rounded bg-emerald-400/10 px-1.5 py-0.5 font-sans text-[10px] text-emerald-300">
                      safeguard
                    </span>
                  ) : row.mode > 1 ? (
                    <span className="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 font-sans text-[10px] text-amber-200">
                      M{row.mode}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right text-amber-200/90">{formatMeso(row.cost)}</td>
                <td className="px-3 py-2 text-right text-emerald-300/90">
                  {formatPercent(row.success, 2)}
                </td>
                <td className="px-3 py-2 text-right text-slate-400">
                  {formatPercent(row.maintain, 2)}
                </td>
                <td className="px-3 py-2 text-right text-rose-300/90">
                  {row.destroy > 0 ? formatPercent(row.destroy, 2) : '—'}
                </td>
                <td className="px-5 py-2 text-right text-slate-400">
                  {row.recover != null ? `${row.recover}★` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
