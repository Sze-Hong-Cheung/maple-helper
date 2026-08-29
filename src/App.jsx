import { useState } from 'react'
import HexaPage from './pages/HexaPage.jsx'
import RosterPage from './pages/RosterPage.jsx'
import StarForcePage from './pages/StarForcePage.jsx'
import SymbolsPage from './pages/SymbolsPage.jsx'
import TrackerPage from './pages/TrackerPage.jsx'

const PAGES = [
  { id: 'hexa', label: 'HEXA Matrix', Component: HexaPage },
  { id: 'starforce', label: 'Star Force', Component: StarForcePage },
  { id: 'symbols', label: 'Symbols', Component: SymbolsPage },
  { id: 'roster', label: 'Roster', Component: RosterPage },
  { id: 'tracker', label: 'Tracker', Component: TrackerPage },
]

export default function App() {
  const [pageId, setPageId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('page')
    return PAGES.some((page) => page.id === requested) ? requested : 'hexa'
  })
  const { Component } = PAGES.find((page) => page.id === pageId) ?? PAGES[0]

  return (
    <div className="min-h-svh bg-[#070a10] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(234,179,8,0.1),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(34,211,238,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300/80 uppercase">
            MapleStory Tool
          </p>

          <div className="inline-flex max-w-full flex-wrap self-start rounded-full border border-white/10 bg-slate-900/80 p-1 sm:self-auto">
            {PAGES.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setPageId(page.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  pageId === page.id
                    ? 'bg-white/10 text-white ring-1 ring-white/15 ring-inset'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </nav>

        <Component />
      </div>
    </div>
  )
}
