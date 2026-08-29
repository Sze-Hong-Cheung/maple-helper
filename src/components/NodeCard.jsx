import { CORE_TYPES, MAX_LEVEL, MIN_LEVEL } from '../constants.js'
import { nodeRemaining } from '../lib/calc.js'
import ResourceAmount from './ResourceAmount.jsx'

const accentMap = {
  violet: {
    badge: 'bg-violet-500/15 text-violet-200 ring-violet-400/30',
    bar: 'bg-violet-400',
    glow: 'hover:border-violet-400/40',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-200 ring-sky-400/30',
    bar: 'bg-sky-400',
    glow: 'hover:border-sky-400/40',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
    bar: 'bg-amber-400',
    glow: 'hover:border-amber-400/40',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-200 ring-rose-400/30',
    bar: 'bg-rose-400',
    glow: 'hover:border-rose-400/40',
  },
  fuchsia: {
    badge: 'bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30',
    bar: 'bg-fuchsia-400',
    glow: 'hover:border-fuchsia-400/40',
  },
  slate: {
    badge: 'bg-slate-500/15 text-slate-200 ring-slate-400/30',
    bar: 'bg-slate-400',
    glow: 'hover:border-slate-400/40',
  },
}

function LevelField({ label, value, min = MIN_LEVEL, onChange }) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-slate-400">
        {label}
        {min > MIN_LEVEL ? (
          <span className="ml-1 text-[10px] text-slate-500">min {min}</span>
        ) : null}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={MAX_LEVEL}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-300"
        />
        <input
          type="number"
          min={min}
          max={MAX_LEVEL}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-14 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-center text-sm font-semibold text-slate-100 outline-none focus:border-amber-300/60"
        />
      </div>
    </label>
  )
}

export default function NodeCard({ node, onChange, variant = 'card' }) {
  const meta = CORE_TYPES[node.type]
  const accent = accentMap[meta.accent]
  const remaining = nodeRemaining(node)
  const ratio = node.target === 0 ? 1 : node.current / node.target
  const done = node.current >= node.target
  const isPopover = variant === 'popover'
  const skillNames = node.skills?.length
    ? node.skills.map((skill) => skill.name)
    : [node.name]

  return (
    <article
      className={`rounded-2xl border transition ${
        isPopover
          ? 'border-white/15 bg-slate-900 p-3 shadow-2xl shadow-black/60'
          : `border-white/8 bg-slate-900/70 p-4 shadow-lg shadow-black/20 backdrop-blur-sm ${accent.glow}`
      }`}
    >
      <div className={isPopover ? 'mb-3' : 'mb-4'}>
        <div className="flex items-start gap-3">
          {node.icon && !isPopover ? (
            <img
              src={node.icon}
              alt=""
              className="size-8 shrink-0 rounded-md border border-white/10 bg-slate-950"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${accent.badge}`}
              >
                {meta.label}
              </span>
              {isPopover ? null : (
                <span className="text-[11px] text-slate-500">{meta.description}</span>
              )}
            </div>
            {node.skills?.length ? (
              <div className="text-base font-semibold leading-5 text-slate-100">
                {skillNames.map((name, index) => (
                  <p key={`${name}-${index}`}>{name}</p>
                ))}
              </div>
            ) : (
              <input
                value={node.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className="w-full bg-transparent text-base font-semibold text-slate-100 outline-none placeholder:text-slate-500"
                placeholder="Node name"
              />
            )}
          </div>
        </div>
      </div>

      <div className={`${isPopover ? 'mb-0 flex flex-col gap-2.5' : 'mb-4 flex gap-4'}`}>
        <LevelField
          label="Current level"
          value={node.current}
          min={node.min ?? MIN_LEVEL}
          onChange={(value) => onChange({ current: value })}
        />
        <LevelField
          label="Target level"
          value={node.target}
          min={node.min ?? MIN_LEVEL}
          onChange={(value) => onChange({ target: value })}
        />
      </div>

      {isPopover ? null : (
        <>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${accent.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            {done ? (
              <span className="text-emerald-300">Target reached</span>
            ) : (
              <span className="inline-flex items-center gap-2.5">
                <span className="text-slate-500">Needs</span>
                <ResourceAmount
                  kind="solErda"
                  value={remaining.solErda}
                  className="text-amber-200"
                />
                <ResourceAmount
                  kind="fragments"
                  value={remaining.fragments}
                  className="text-cyan-200"
                />
              </span>
            )}
            <span className="shrink-0 tabular-nums">
              {node.current} / {node.target}
            </span>
          </div>
        </>
      )}
    </article>
  )
}
