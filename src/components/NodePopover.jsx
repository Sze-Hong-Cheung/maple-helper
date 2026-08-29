import { useEffect, useRef } from 'react'
import { MATRIX_VIEWBOX } from '../constants.js'
import NodeCard from './NodeCard.jsx'

const GAP_PX = 62

/** Keep the card inside the board by biasing it away from the nearest edge. */
function verticalShift(y) {
  if (y < -120) return -22
  if (y > 120) return -78
  return -50
}

export default function NodePopover({
  entry,
  node: nodeProp,
  onChange,
  onClose,
  placement = 'matrix',
}) {
  const node = nodeProp ?? entry?.node
  const ref = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    function handlePointerDown(event) {
      if (ref.current?.contains(event.target)) return
      if (!(event.target instanceof Element)) return
      if (event.target.closest('.hex-node')) return
      if (event.target.closest('[data-progress-core]')) return
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onClose])

  if (!node) return null

  if (placement === 'board') {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-label={`${node.name} level settings`}
        className="absolute top-full left-0 z-30 mt-1.5 w-64 max-w-[calc(100vw-2.5rem)]"
      >
        <div className="absolute -top-1.5 left-6 size-3 rotate-45 border border-white/10 border-r-0 border-b-0 bg-slate-900" />
        <NodeCard node={node} onChange={onChange} variant="popover" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full border border-white/15 bg-slate-950 text-sm leading-none text-slate-400 shadow-lg transition hover:border-rose-300/40 hover:text-rose-200"
        >
          ×
        </button>
      </div>
    )
  }

  const { x, y } = entry
  const leftPct = ((x - MATRIX_VIEWBOX.x) / MATRIX_VIEWBOX.width) * 100
  const topPct = ((y - MATRIX_VIEWBOX.y) / MATRIX_VIEWBOX.height) * 100
  const placeRight = x <= 0
  const shift = verticalShift(y)

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${node.name} level settings`}
      className="pointer-events-auto absolute z-20 w-64 max-w-[calc(100vw-2.5rem)]"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(${placeRight ? `${GAP_PX}px` : `calc(-100% - ${GAP_PX}px)`}, ${shift}%)`,
      }}
    >
      <div
        className={`absolute size-3 rotate-45 border border-white/10 bg-slate-900 ${
          placeRight ? '-left-1.5 border-r-0 border-b-0' : '-right-1.5 border-l-0 border-t-0'
        }`}
        style={{ top: `${-shift}%`, marginTop: '-6px' }}
      />

      <NodeCard node={node} onChange={onChange} variant="popover" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full border border-white/15 bg-slate-950 text-sm leading-none text-slate-400 shadow-lg transition hover:border-rose-300/40 hover:text-rose-200"
      >
        ×
      </button>
    </div>
  )
}
