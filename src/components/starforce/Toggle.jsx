export default function Toggle({ checked, onChange, disabled, label, title }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:outline-none ${
        checked ? 'bg-amber-300' : 'bg-slate-600 hover:bg-slate-500'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

/** Label on the left, switch on the right — matches the wireframe rows. */
export function ToggleRow({ label, hint, checked, onChange, disabled, title, className = '' }) {
  return (
    <div
      title={title ?? hint}
      className={`flex items-center justify-between gap-3 px-4 py-3 ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      <p className="text-sm text-slate-200">{label}</p>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={label}
        title={title ?? hint}
      />
    </div>
  )
}
