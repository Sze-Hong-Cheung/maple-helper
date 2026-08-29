function StarIcon({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 fill-slate-400 ${className}`} aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z" />
    </svg>
  )
}

function StarBox({ value, min, max, label, onChange }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-14 rounded-lg border border-white/15 bg-slate-950/80 px-1.5 py-1 text-center text-base font-semibold tabular-nums text-slate-100 outline-none transition focus:border-amber-300/60"
    />
  )
}

export default function StarRange({ current, target, starCap, onChange, starsAfter = false }) {
  return (
    <div className="flex items-center gap-2">
      {starsAfter ? null : <StarIcon className="size-5" />}

      <StarBox
        value={current}
        min={0}
        max={starCap}
        label="Current stars"
        onChange={(value) => onChange({ currentStar: value })}
      />
      {starsAfter ? <StarIcon /> : null}

      <span aria-hidden="true" className="text-slate-500">
        →
      </span>

      <StarBox
        value={target}
        min={current}
        max={starCap}
        label="Target stars"
        onChange={(value) => onChange({ targetStar: value })}
      />
      {starsAfter ? <StarIcon /> : null}
    </div>
  )
}
