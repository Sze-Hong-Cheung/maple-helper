import { useId } from 'react'
import {
  CORE_TYPES,
  CORE_TYPE_ORDER,
  HEX_HALF_WIDTH,
  HEX_RADIUS,
  MATRIX_VIEWBOX,
} from '../constants.js'
import { nodeRemaining } from '../lib/calc.js'
import { layoutBoard } from '../lib/matrixLayout.js'
import NodePopover from './NodePopover.jsx'
// import referenceArt from '../assets/hexa/matrix-reference.webp'

const CENTRE_SCALE = 1.38
/** Nudge the VI emblem down so it sits optically in the matrix gap. */
const CENTRE_OFFSET_Y = 8
/** Branch cores only — centre VI / slot positions stay put. */
const CORE_HEX_SCALE = 0.94

function hexPoints(scale = 1) {
  return [
    [0, -HEX_RADIUS],
    [HEX_HALF_WIDTH, -HEX_RADIUS / 2],
    [HEX_HALF_WIDTH, HEX_RADIUS / 2],
    [0, HEX_RADIUS],
    [-HEX_HALF_WIDTH, HEX_RADIUS / 2],
    [-HEX_HALF_WIDTH, -HEX_RADIUS / 2],
  ]
    .map(([x, y]) => `${x * scale},${y * scale}`)
    .join(' ')
}

const OUTER_HEX = hexPoints(CORE_HEX_SCALE)
const INNER_HEX = hexPoints(0.82 * CORE_HEX_SCALE)
const SELECTION_HEX = hexPoints(1.16 * CORE_HEX_SCALE)
const CENTRE_HEX = hexPoints(CENTRE_SCALE)

function LockGlyph({ color }) {
  return (
    <g color={color} opacity="0.9">
      <path
        d="M-8 -3 a8 8 0 0 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="-12" y="-3" width="24" height="18" rx="4" fill="currentColor" />
    </g>
  )
}

function NodeGlyph({ nodeId, stroke }) {
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 2.2,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }

  if (nodeId === 'skill-1') {
    return (
      <g>
        <polygon points="0,-11 3,-3 11,0 3,3 0,11 -3,3 -11,0 -3,-3" fill={stroke} opacity="0.9" />
      </g>
    )
  }
  if (nodeId === 'skill-2') {
    return (
      <g>
        <path d="M-9 4 L0 -10 L9 4" {...common} />
        <path d="M-6 8 L0 -2 L6 8" {...common} />
      </g>
    )
  }
  if (nodeId?.startsWith('mastery')) {
    const n = Number(nodeId.slice(-1)) || 1
    return (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={-11 + (i % 2) * 12}
            y={-11 + Math.floor(i / 2) * 12}
            width="10"
            height="10"
            rx="2"
            fill={i < n ? stroke : 'none'}
            stroke={stroke}
            strokeWidth="1.8"
            opacity={i < n ? 1 : 0.35}
          />
        ))}
      </g>
    )
  }
  if (nodeId?.startsWith('boost')) {
    return (
      <g>
        <path d="M0 10 V-10 M-8 2 L0 -10 L8 2" {...common} />
      </g>
    )
  }
  if (nodeId === 'solJanus-2') {
    return <path d="M-10 0 A10 10 0 1 1 0 -10" {...common} />
  }
  return (
    <g>
      <circle r="9" {...common} />
      <path d="M-9 0 H9 M0 -9 V9" {...common} />
    </g>
  )
}

function LevelBadge({ level, color }) {
  return (
    <g transform={`translate(0, ${-HEX_RADIUS * CORE_HEX_SCALE + 18})`}>
      <rect
        x="-15"
        y="-8"
        width="30"
        height="16"
        rx="4"
        fill="#0b1220"
        stroke={color}
        strokeWidth="1.4"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        y="1"
        fill="#e2e8f0"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.6"
      >
        {String(level).padStart(2, '0')}
      </text>
    </g>
  )
}

function MatrixBackdrop({ uid }) {
  return (
    <g className="pointer-events-none">
      <circle r="310" fill={`url(#${uid}-space)`} />
      {[118, 176, 238, 300].map((r, i) => (
        <circle
          key={r}
          r={r}
          fill="none"
          stroke="#7dd3fc"
          strokeOpacity={0.08 + i * 0.015}
          strokeWidth={i === 0 ? 1.4 : 1}
        />
      ))}
      <polygon
        points="0,-210 182,0 0,210 -182,0"
        fill="none"
        stroke="#a5b4fc"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      <polygon
        points="0,-188 163,94 -163,94"
        fill="none"
        stroke="#7dd3fc"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <polygon
        points="0,188 163,-94 -163,-94"
        fill="none"
        stroke="#7dd3fc"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      {[45, 135, 225, 315].map((angle) => {
        const radians = (angle * Math.PI) / 180
        const x = Math.cos(radians) * 300
        const y = Math.sin(radians) * 300
        return (
          <line
            key={angle}
            x1={Math.cos(radians) * 52}
            y1={Math.sin(radians) * 52}
            x2={x}
            y2={y}
            stroke="#93c5fd"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        )
      })}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const radians = (angle * Math.PI) / 180
        return (
          <circle
            key={angle}
            cx={Math.cos(radians) * 238}
            cy={Math.sin(radians) * 238}
            r="3.5"
            fill="#7dd3fc"
            fillOpacity="0.28"
          />
        )
      })}
    </g>
  )
}

function CentreEmblem({ uid }) {
  return (
    <g
      className="pointer-events-none"
      transform={`translate(0, ${CENTRE_OFFSET_Y})`}
      filter={`url(#${uid}-centre-glow)`}
    >
      <polygon
        points={CENTRE_HEX}
        fill={`url(#${uid}-centre)`}
        stroke="#f8fafc"
        strokeOpacity="0.92"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <polygon
        points={hexPoints(1.12)}
        fill="none"
        stroke="#c4b5fd"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        y="3"
        fill="#f8fafc"
        fontSize="42"
        fontWeight="650"
        letterSpacing="3"
      >
        VI
      </text>
    </g>
  )
}

function SkillIcon({ href, grayscale = false, filterId }) {
  return (
    <image
      href={href}
      x="-16"
      y="-16"
      width="32"
      height="32"
      filter={grayscale ? `url(#${filterId})` : undefined}
    />
  )
}

function HexChrome({ palette, uid, type, active }) {
  return (
    <>
      <polygon
        points={OUTER_HEX}
        fill="none"
        stroke={palette.glow}
        strokeWidth={active ? 11 : 8}
        strokeLinejoin="round"
        opacity={active ? 0.45 : 0.28}
        filter={`url(#${uid}-soft-glow)`}
      />
      <polygon
        points={OUTER_HEX}
        fill={`url(#${uid}-${type}-fill-${active ? 'lit' : 'dim'})`}
        stroke={palette.edge}
        strokeOpacity={active ? 0.95 : 0.72}
        strokeWidth={active ? 6 : 5}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <polygon
        points={INNER_HEX}
        fill="#070b14"
        fillOpacity={active ? 0.55 : 0.7}
        stroke={palette.edge}
        strokeOpacity={active ? 0.28 : 0.2}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </>
  )
}

function EmptyHex({ entry, uid }) {
  const { x, y, type } = entry
  const palette = CORE_TYPES[type].palette
  return (
    <g
      className="hex-slot pointer-events-none"
      style={{ '--hex-x': `${x}px`, '--hex-y': `${y}px` }}
    >
      <HexChrome palette={palette} uid={uid} type={type} active={false} />
      <LockGlyph color={palette.edge} />
    </g>
  )
}

function HexNode({ entry, isSelected, onSelect, uid }) {
  const { node, x, y } = entry
  const meta = CORE_TYPES[node.type]
  const { palette } = meta
  const locked = node.current === 0
  const remaining = nodeRemaining(node)

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.name}, level ${node.current}, target ${node.target}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(node.id)
        }
      }}
      className="hex-node"
      data-selected={isSelected ? 'true' : 'false'}
      style={{ '--hex-x': `${x}px`, '--hex-y': `${y}px` }}
    >
      <title>
        {`${node.name} · ${meta.label} · ${node.current} → ${node.target}` +
          (remaining.fragments > 0
            ? ` (needs ${remaining.solErda} Sol Erda / ${remaining.fragments} fragments)`
            : ' (target reached)')}
      </title>

      {isSelected ? (
        <polygon
          points={SELECTION_HEX}
          fill="none"
          stroke={palette.edge}
          strokeWidth="2.5"
          strokeLinejoin="round"
          opacity="0.95"
        />
      ) : null}

      {node.icon ? (
        <>
          <HexChrome palette={palette} uid={uid} type={node.type} active={!locked} />
          <SkillIcon href={node.icon} grayscale={locked} filterId={`${uid}-grayscale`} />
          <LevelBadge level={node.current} color={palette.edge} />
        </>
      ) : locked ? (
        <>
          <HexChrome palette={palette} uid={uid} type={node.type} active={false} />
          <LockGlyph color={palette.edge} />
        </>
      ) : (
        <>
          <HexChrome palette={palette} uid={uid} type={node.type} active />
          <rect
            x="-18"
            y="-14"
            width="36"
            height="36"
            rx="7"
            fill="#10182a"
            stroke={palette.edge}
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          <g transform="translate(0, 4)">
            <NodeGlyph nodeId={node.id} stroke={palette.edge} />
          </g>
          <LevelBadge level={node.current} color={palette.edge} />
        </>
      )}
    </g>
  )
}

export default function HexMatrix({
  nodes,
  selectedId,
  onSelect,
  onUpdateNode,
  showPopover = true,
}) {
  const uid = useId().replace(/:/g, '')
  // const [refOpacity, setRefOpacity] = useState(0.45)
  const entries = layoutBoard(nodes)
  const selectedEntry = entries.find((entry) => entry.node?.id === selectedId) ?? null
  const { x, y, width, height } = MATRIX_VIEWBOX

  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-200/20 bg-[#081018] shadow-xl shadow-black/50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,_rgba(56,189,248,0.08),_transparent_58%),radial-gradient(ellipse_at_50%_8%,_rgba(167,139,250,0.12),_transparent_42%)]" />

      <div className="relative">
        <svg
          viewBox={`${x} ${y} ${width} ${height}`}
          className="relative w-full"
          role="group"
          aria-label="HEXA Matrix board"
        >
          <defs>
            <radialGradient id={`${uid}-space`} cx="50%" cy="42%">
              <stop offset="0%" stopColor="#152038" />
              <stop offset="100%" stopColor="#070b14" />
            </radialGradient>
            <radialGradient id={`${uid}-centre`} cx="50%" cy="32%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="55%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0b1020" />
            </radialGradient>
            <filter id={`${uid}-soft-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id={`${uid}-centre-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.2" result="src" />
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#e2e8f0" floodOpacity="0.55" />
            </filter>
            <filter id={`${uid}-grayscale`}>
              <feColorMatrix type="saturate" values="0" />
            </filter>
            {CORE_TYPE_ORDER.map((type) => {
              const palette = CORE_TYPES[type].palette
              return (
                <g key={type}>
                  <linearGradient id={`${uid}-${type}-fill-lit`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.from} />
                    <stop offset="100%" stopColor={palette.to} />
                  </linearGradient>
                  <linearGradient id={`${uid}-${type}-fill-dim`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.from} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={palette.to} stopOpacity="0.85" />
                  </linearGradient>
                </g>
              )
            })}
          </defs>

          <MatrixBackdrop uid={uid} />
          <CentreEmblem uid={uid} />

          {entries.map((entry) =>
            entry.kind === 'empty' ? (
              <EmptyHex key={`empty-${entry.type}-${entry.slotIndex}`} entry={entry} uid={uid} />
            ) : (
              <HexNode
                key={entry.node.id}
                entry={entry}
                isSelected={entry.node.id === selectedId}
                onSelect={onSelect}
                uid={uid}
              />
            ),
          )}
        </svg>

        {/*
        <img
          src={referenceArt}
          alt=""
          className="pointer-events-none absolute inset-0 z-10 size-full object-contain"
          style={{ opacity: refOpacity }}
        />

        <label className="absolute top-2 right-2 z-20 flex items-center gap-2 rounded-lg border border-white/12 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-300">
          Ref
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(refOpacity * 100)}
            onChange={(event) => setRefOpacity(Number(event.target.value) / 100)}
            className="h-1 w-20 cursor-pointer accent-sky-300"
          />
        </label>
        */}

        {showPopover && selectedEntry ? (
          <div className="pointer-events-none absolute inset-0 z-30">
            <NodePopover
              entry={selectedEntry}
              onChange={(patch) => onUpdateNode(selectedEntry.node.id, patch)}
              onClose={() => onSelect(null)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
