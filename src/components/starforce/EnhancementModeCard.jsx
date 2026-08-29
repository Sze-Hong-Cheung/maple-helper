import { useEffect, useRef, useState } from 'react'
import {
  ENHANCEMENT_MODE_MAX,
  ENHANCEMENT_MODE_STARS,
  defaultEnhancementModes,
} from '../../starforce/constants.js'
import { formatMeso, formatPercent } from '../../lib/format.js'
import { buildPlan, normalizeConfig } from '../../starforce/model.js'

const MODE_HELP =
  'Each step picks its own mode (1–4). Mode 4 cannot boom; at 15–17★ that is Safeguard (×3). Steps below your current ★ stay editable and are tagged re-climb: a boom can drop the item under them, so their mode is what you climb back up on.'

function InfoPopover({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handlePointerDown(event) {
      if (ref.current?.contains(event.target)) return
      setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-4 items-center justify-center rounded-full text-slate-500 transition hover:text-amber-200"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.25" />
          <path d="M8 7.25v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div
          role="tooltip"
          className="absolute top-full left-0 z-20 mt-2 w-72 max-w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-white/12 bg-slate-900 px-3 py-2.5 text-[11px] leading-4 text-slate-300 shadow-xl shadow-black/50"
        >
          {children}
        </div>
      ) : null}
    </span>
  )
}

function setStars(modes, stars, level) {
  const next = { ...modes }
  for (const star of stars) next[star] = level
  return next
}

function ModePicker({ star, mode, recommended, disabled, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-white/12">
      {Array.from({ length: ENHANCEMENT_MODE_MAX }, (_, index) => {
        const level = index + 1
        const active = mode === level
        const isRecommended = recommended === level
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={`${star} stars, mode ${level}`}
            onClick={() => onChange(level)}
            className={`w-7 py-1 text-[11px] font-semibold tabular-nums transition disabled:cursor-not-allowed ${
              active
                ? 'bg-amber-300/20 text-amber-100'
                : isRecommended
                  ? 'text-cyan-200'
                  : 'text-slate-500 hover:text-slate-200'
            } ${index > 0 ? 'border-l border-white/10' : ''}`}
          >
            {level}
          </button>
        )
      })}
    </div>
  )
}

export default function EnhancementModeCard({ config, recommendedModes, onChange }) {
  if (config.server !== 'gms' || config.targetStar <= 15) {
    return (
      <div className="flex h-full min-h-[12rem] items-center px-5 py-6">
        <p className="text-sm leading-6 text-slate-500">
          {config.server !== 'gms'
            ? 'Enhancement Mode is GMS only. Use Safeguard on the left for 15–17★.'
            : 'Enhancement Mode starts at 15★. Raise the target to 16★ or higher to pick a mode per star.'}
        </p>
      </div>
    )
  }

  const modes = config.modes ?? defaultEnhancementModes()
  const plan = buildPlan(normalizeConfig(config))
  const rows = ENHANCEMENT_MODE_STARS.filter((star) => star < config.targetStar)

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-200/90 uppercase">
              Per-star strategy
            </p>
            <InfoPopover label="About per-star strategy">{MODE_HELP}</InfoPopover>
          </div>
          <p className="text-[11px] text-slate-500">mode by star</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ modes: setStars(modes, ENHANCEMENT_MODE_STARS, level) })}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 transition hover:border-amber-300/40 hover:text-amber-100"
            >
              All {level}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                safeguard: true,
                modes: setStars(modes, [15, 16, 17], 4),
              })
            }
            className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 transition hover:border-amber-300/40 hover:text-amber-100"
          >
            Safeguard
          </button>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">★</th>
              <th className="px-2 py-2 font-medium">Mode</th>
              <th className="px-2 py-2 text-right font-medium">Boom</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((star) => {
              const reclimb = star < config.currentStar
              return (
                <tr key={star} className="border-t border-white/6">
                  <td className="px-4 py-2 whitespace-nowrap text-slate-200">
                    <span className="tabular-nums">
                      {star} → {star + 1}
                    </span>
                    {reclimb ? (
                      <span className="ml-2 text-[10px] text-slate-500">re-climb</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    <ModePicker
                      star={star}
                      mode={modes[star] ?? 1}
                      recommended={recommendedModes?.[star]}
                      onChange={(level) => onChange({ modes: { ...modes, [star]: level } })}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-amber-200/90">
                    {formatPercent(plan.destroy[star], 2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-amber-200/90">
                    {formatMeso(plan.cost[star])}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
