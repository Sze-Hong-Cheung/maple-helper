import { useEffect, useRef, useState } from 'react'

const TRIAL_OPTIONS = [100, 500, 1_000, 5_000, 10_000, 50_000]

export default function TrialButton({ trials, running, disabled, onRun, onTrialsChange }) {
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
    <div ref={wrapper} className="relative flex w-full max-w-sm">
      <button
        type="button"
        onClick={onRun}
        disabled={disabled || running}
        className="flex-1 rounded-l-xl border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:outline-none"
      >
        {running ? 'Running…' : `Trial ${trials.toLocaleString('en-US')} Times`}
      </button>

      <button
        type="button"
        aria-label="Change trial count"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        disabled={running}
        className="rounded-r-xl border border-l-0 border-white/15 bg-white/6 px-3 text-slate-300 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:outline-none"
      >
        <span aria-hidden="true" className="text-[10px]">
          ▼
        </span>
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-white/12 bg-slate-900 py-1 shadow-2xl shadow-black/60">
          {TRIAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onTrialsChange(option)
                setOpen(false)
              }}
              className={`block w-full px-4 py-1.5 text-left text-sm tabular-nums transition hover:bg-white/8 ${
                option === trials ? 'text-amber-200' : 'text-slate-300'
              }`}
            >
              {option.toLocaleString('en-US')} times
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
