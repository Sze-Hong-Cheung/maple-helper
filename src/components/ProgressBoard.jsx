import { useEffect, useMemo, useRef, useState } from 'react'
import { CORE_TYPES } from '../constants.js'
import { nodeProgress, totalsForNodes } from '../lib/calc.js'
import erdaIcon from '../assets/icons/sol_erda.png'
import fragmentIcon from '../assets/icons/sol_erda_fragment.png'
import NodePopover from './NodePopover.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const QUICK_SETTINGS = [
  {
    id: 'reset-current-and-targets',
    label: 'Reset current levels and set target levels to 30',
    title: 'Reset current and set targets to 30?',
    description:
      'Every core’s current level goes back to its default (Origin at 1, everything else at 0), and all targets become 30.',
    confirmLabel: 'Reset',
  },
  {
    id: 'reset-current',
    label: 'Set current levels to 0',
    title: 'Set current levels to 0?',
    description:
      'Every core’s current level is set to 0 (Origin stays at 1). Target levels stay as they are.',
    confirmLabel: 'Reset',
  },
  {
    id: 'set-targets-30',
    label: 'Set all target levels to 30',
    title: 'Set all targets to 30?',
    description: 'Current levels stay as they are. Every target becomes 30.',
    confirmLabel: 'Set targets',
  },
]

function QuickSettings({ onSelect }) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event) {
      if (!wrapper.current?.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-white/12 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-slate-100"
      >
        Quick settings
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1.5 w-72 overflow-hidden rounded-xl border border-white/12 bg-slate-900 py-1 shadow-2xl shadow-black/60"
        >
          {QUICK_SETTINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(item)
                setOpen(false)
              }}
              className="block w-full px-3 py-2 text-left text-[12px] leading-4 text-slate-300 transition hover:bg-white/8 hover:text-slate-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const DISPLAY_ORDER = ['mastery', 'boost', 'skill', 'solJanus']

const NODE_BADGE = {
  'skill-1': 'Origin',
  'skill-2': 'Ascent',
  'mastery-1': 'M1',
  'mastery-2': 'M2',
  'mastery-3': 'M3',
  'mastery-4': 'M4',
  'boost-1': 'H1',
  'boost-2': 'H2',
  'boost-3': 'H3',
  'boost-4': 'H4',
  'solJanus-1': 'Sol J.',
  'solJanus-2': 'Sol H.',
}

function cardBackground(palette) {
  return `linear-gradient(180deg, color-mix(in srgb, ${palette.from} 34%, #16141f), color-mix(in srgb, ${palette.to} 62%, #0d1118))`
}

function formatAmount(value) {
  return value.toLocaleString('en-US')
}

function ResourceNeed({ src, label, value, className }) {
  return (
    <span className={`flex shrink-0 flex-col items-center gap-0.5 ${className}`}>
      <img src={src} alt={label} title={label} width={16} height={16} className="size-4" />
      <span className="w-full text-center text-[11px] font-semibold tabular-nums text-white">
        {formatAmount(value)}
      </span>
    </span>
  )
}

function ResourcePair({ erda, fragments, size = 'sm' }) {
  const icon = size === 'lg' ? 20 : 14
  const numberClass =
    size === 'lg'
      ? 'text-xl font-bold tabular-nums'
      : 'text-xs font-semibold tabular-nums'

  return (
    <span className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5">
        <img src={erdaIcon} alt="Sol Erda" title="Sol Erda" width={icon} height={icon} />
        <span className={`${numberClass} text-amber-100`}>{formatAmount(erda)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <img
          src={fragmentIcon}
          alt="Sol Erda Fragment"
          title="Sol Erda Fragment"
          width={icon}
          height={icon}
        />
        <span className={`${numberClass} text-cyan-100`}>{formatAmount(fragments)}</span>
      </span>
    </span>
  )
}

function TotalsBar({ remaining, consumed }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 rounded-xl border border-white/8 bg-black/35 px-3 py-2.5">
      <div>
        <p className="text-sm font-semibold tracking-wide text-slate-100">Remaining</p>
        <div className="mt-1">
          <ResourcePair erda={remaining.solErda} fragments={remaining.fragments} size="lg" />
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-medium tracking-wide text-slate-500">Consumed</p>
        <div className="mt-0.5">
          <ResourcePair erda={consumed.solErda} fragments={consumed.fragments} size="sm" />
        </div>
      </div>
    </div>
  )
}

function CoreRow({ node, selected, showPopover, onSelect, onChange }) {
  const badge = NODE_BADGE[node.id] ?? node.name
  const { palette } = CORE_TYPES[node.type]
  const { remaining, percent } = nodeProgress(node)

  return (
    <div className={`relative min-w-0 ${showPopover ? 'z-20' : ''}`} data-progress-core={node.id}>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-current={selected ? 'true' : undefined}
        className={`grid min-w-0 w-full grid-cols-[2.5rem_minmax(0,1fr)_2rem_2.25rem_3.5rem] items-center gap-1.5 overflow-hidden rounded-2xl px-1.5 py-1.5 text-left text-slate-100 shadow-sm transition hover:brightness-110 ${
          selected ? 'ring-2 ring-white/55' : ''
        }`}
        style={{
          background: cardBackground(palette),
          boxShadow: selected ? undefined : `inset 0 0 0 1px ${palette.edge}55`,
        }}
      >
      <span className="relative size-10 shrink-0">
        <span className="block size-full overflow-hidden rounded-md bg-black/30">
          {node.icon ? (
            <img
              src={node.icon}
              alt=""
              className="size-full"
            />
          ) : (
            <span className="flex size-full items-center justify-center px-0.5 text-center text-[8px] leading-3 text-white/70">
              {badge}
            </span>
          )}
        </span>
        <span
          className="absolute -top-1 -left-1 z-10 whitespace-nowrap rounded px-1 py-px text-[8px] font-bold leading-3 text-white shadow-sm"
          style={{ background: palette.to }}
        >
          {badge}
        </span>
        <span className="absolute -right-0.5 -bottom-0.5 rounded-[3px] bg-black px-1 text-[10px] font-semibold leading-4 tabular-nums">
          {node.current}
        </span>
      </span>

      <span className="relative h-5 min-w-0 flex-1 overflow-hidden rounded-md bg-black/45">
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            background: `color-mix(in srgb, ${palette.to} 72%, ${palette.from})`,
          }}
        />
        <span className="relative z-10 flex h-full items-center justify-center text-[11px] font-semibold tabular-nums text-white">
          {percent}%
        </span>
      </span>

      <span className="w-full text-center">
        <span className="block text-sm font-bold leading-none tabular-nums">{node.target}</span>
        <span className="mt-0.5 block text-[9px] leading-none text-white/70">to lv</span>
      </span>

      <ResourceNeed src={erdaIcon} label="Sol Erda" value={remaining.solErda} className="w-full" />
      <ResourceNeed
        src={fragmentIcon}
        label="Sol Erda Fragment"
        value={remaining.fragments}
        className="w-full"
      />
      </button>
      {showPopover ? (
        <NodePopover
          node={node}
          placement="board"
          onChange={onChange}
          onClose={() => onSelect(null)}
        />
      ) : null}
    </div>
  )
}

export default function ProgressBoard({
  nodes,
  selectedId,
  popoverOpen,
  onSelect,
  onChange,
  onQuickSetting,
}) {
  const [pendingSetting, setPendingSetting] = useState(null)
  const totals = useMemo(() => totalsForNodes(nodes), [nodes])
  const groups = DISPLAY_ORDER.map((type) => ({
    type,
    nodes: nodes.filter((node) => node.type === type),
  })).filter((group) => group.nodes.length > 0)

  return (
    <aside className="@container w-full min-w-0 lg:sticky lg:top-6">
      <div className="rounded-xl border border-sky-200/20 bg-[#081018] p-6 shadow-xl shadow-black/50">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">HEXA progress</h2>
          <QuickSettings onSelect={setPendingSetting} />
        </div>

        <TotalsBar remaining={totals.remaining} consumed={totals.spent} />

        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.type} className="grid grid-cols-1 gap-2 @min-[32rem]:grid-cols-2">
              {group.nodes.map((node) => (
                <CoreRow
                  key={node.id}
                  node={node}
                  selected={node.id === selectedId}
                  showPopover={popoverOpen && node.id === selectedId}
                  onSelect={onSelect}
                  onChange={(patch) => onChange(node.id, patch)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingSetting)}
        title={pendingSetting?.title}
        description={pendingSetting?.description}
        confirmLabel={pendingSetting?.confirmLabel}
        onConfirm={() => {
          onQuickSetting(pendingSetting.id)
          setPendingSetting(null)
        }}
        onCancel={() => setPendingSetting(null)}
      />
    </aside>
  )
}
