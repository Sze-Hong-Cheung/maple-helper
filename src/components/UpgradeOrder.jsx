import { useMemo, useState } from 'react'
import { iconAtLevel } from '../hexa/catalog.js'

const STAT_ICONS = import.meta.glob('../assets/hexa/hexa-stat-*.png', {
  eager: true,
  import: 'default',
})

function stepIcon(step, node) {
  if (step.kind === 'stat') {
    return STAT_ICONS[`../assets/hexa/${step.nodeId}.png`] ?? ''
  }
  if (!node) return ''
  return iconAtLevel(node, step.to) || node.icon
}

function Arrow() {
  return (
    <span className="px-0.5 text-sm text-slate-500" aria-hidden>
      →
    </span>
  )
}

function OrderStep({ step, node, current, onSelect }) {
  const icon = stepIcon(step, node)
  const maxed = step.kind !== 'stat' && step.to >= 30
  const clickable = step.kind !== 'stat' && Boolean(node)
  const pixelated = step.kind !== 'stat'

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && onSelect(node.id)}
      title={step.kind === 'stat' ? step.label : `${step.label} → ${step.to}`}
      aria-current={current ? 'step' : undefined}
      className={`relative shrink-0 ${clickable ? '' : 'cursor-default'}`}
    >
      {current ? (
        <span className="absolute -top-0.5 -left-0.5 z-10 size-2.5 rounded-full bg-sky-300 ring-2 ring-slate-950" />
      ) : null}
      <span className="relative block size-11">
        <span
          className={`block size-full overflow-hidden rounded-lg border bg-slate-950 ${
            maxed
              ? 'border-violet-300/80 shadow-[0_0_12px_rgba(196,181,255,0.55)]'
              : 'border-sky-400/25'
          }`}
        >
          {icon ? (
            <img
              src={icon}
              alt=""
              className="size-full object-contain"
              style={pixelated ? { imageRendering: 'pixelated' } : undefined}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] text-slate-500">
              {step.label.slice(0, 2)}
            </span>
          )}
        </span>
        {step.kind !== 'stat' ? (
          <span className="absolute -top-1 -right-1 rounded-full bg-violet-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white shadow-sm">
            {step.to}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export default function UpgradeOrder({ order, nodes, onSelect }) {
  const [showAll, setShowAll] = useState(true)
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const visible = showAll
    ? order.steps
    : order.steps.filter((step) => {
        if (step.kind === 'stat') return true
        return (byId.get(step.nodeId)?.current ?? 0) < step.to
      })
  const currentIndex = visible.findIndex((step) => {
    if (step.kind === 'stat') return false
    return (byId.get(step.nodeId)?.current ?? 0) < step.to
  })

  return (
    <section className="mt-6 rounded-2xl border border-white/8 bg-slate-900/70 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">Upgrade order</h2>
          <p className="mt-1 text-xs text-slate-500">{order.source}</p>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              !showAll ? 'bg-amber-300/15 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Remaining
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              showAll ? 'bg-amber-300/15 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-y-3">
        {visible.map((step, index) => {
          const node = byId.get(step.nodeId)
          return (
            <span key={`${step.nodeId}-${step.to}-${index}`} className="flex items-center">
              <OrderStep
                step={step}
                node={node}
                current={index === currentIndex}
                onSelect={onSelect}
              />
              {index < visible.length - 1 ? <Arrow /> : null}
            </span>
          )
        })}
      </div>
    </section>
  )
}
