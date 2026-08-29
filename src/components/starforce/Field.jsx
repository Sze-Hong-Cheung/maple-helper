export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium tracking-wide text-slate-400">
        {label}
        {hint ? <span className="ml-1.5 text-[10px] text-slate-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

const CARET =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat"

export function SelectField({ value, options, onChange, label }) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950/70 py-2 pr-9 pl-3 text-sm text-slate-100 outline-none transition focus:border-amber-300/60 ${CARET}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-slate-900">
          {option.label}
        </option>
      ))}
    </select>
  )
}
