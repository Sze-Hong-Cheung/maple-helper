import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ITEM_GROUPS } from '../../starforce/items.js'
import { starCapFor } from '../../starforce/model.js'

function ItemTile({ item, selected, onSelect }) {
  const cap = starCapFor(item.level, item.maxStar)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={`${item.name} · ${item.slot} · Lv ${item.level} · up to ${cap}★`}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
        selected
          ? 'border-amber-300/50 bg-amber-300/10'
          : 'border-white/8 bg-white/2 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      <span className="flex h-10 items-center justify-center">
        <img
          src={item.icon}
          alt=""
          className="max-h-10 w-auto"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
      <span className="line-clamp-2 text-[11px] leading-4 text-slate-300">{item.name}</span>
      <span className="text-[10px] text-slate-500">Lv {item.level}</span>
    </button>
  )
}

/** Mounted only while open, so the search box starts empty every time. */
export default function ItemPicker({ selectedId, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    searchRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return ITEM_GROUPS

    return ITEM_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) ||
          item.slot.toLowerCase().includes(needle) ||
          String(item.level).includes(needle),
      ),
    })).filter((group) => group.items.length > 0)
  }, [query])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select an item"
        className="relative w-full max-w-3xl rounded-2xl border border-white/12 bg-slate-900 shadow-2xl shadow-black/70"
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-50">Select Item</h2>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slot or level"
            className="ml-auto w-56 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/60"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nothing matches “{query}”.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.id}>
                <h3 className="mb-2.5 text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                  {group.label}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {group.items.map((item) => (
                    <ItemTile
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <p className="border-t border-white/8 px-5 py-3 text-[11px] text-slate-500">
          Cost depends only on item level, so one class variant stands in for each set.
          Superior equipment (Tyrant) is not listed.
        </p>
      </div>
    </div>,
    document.body,
  )
}
