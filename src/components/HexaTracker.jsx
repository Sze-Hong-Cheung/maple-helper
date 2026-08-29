import { useMemo, useState } from 'react'
import { CORE_TYPES, CORE_TYPE_ORDER } from '../constants.js'
import { HEXA_JOBS, applyJobCatalog, findHexaJob } from '../hexa/catalog.js'
import { findJobOrder } from '../hexa/orders/index.js'
import HexMatrix from './HexMatrix.jsx'
import NodeCard from './NodeCard.jsx'
import ProgressBoard from './ProgressBoard.jsx'
import UpgradeOrder from './UpgradeOrder.jsx'
import { useHexaProgress } from '../hooks/useHexaProgress.js'
import { defaultSyncAdapter } from '../lib/sync.js'

const syncAdapter = defaultSyncAdapter

const VIEWS = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'list', label: 'List' },
]

export default function HexaTracker({ storageKey, showHeader = true, job, jobPicker = false }) {
  const { nodes, updateNode, applyQuickSetting } = useHexaProgress({
    syncAdapter,
    storageKey,
  })

  const [view, setView] = useState('matrix')
  const [selectedId, setSelectedId] = useState(null)
  const [popoverHost, setPopoverHost] = useState(null)

  const selectNode = (id, host) => {
    if (id == null) {
      setSelectedId(null)
      setPopoverHost(null)
      return
    }
    if (selectedId === id && popoverHost === host) {
      setSelectedId(null)
      setPopoverHost(null)
      return
    }
    setSelectedId(id)
    setPopoverHost(host)
  }
  const [pickedJob, setPickedJob] = useState(HEXA_JOBS[0]?.name ?? '')
  const activeJob = jobPicker ? pickedJob : job
  const catalog = findHexaJob(activeJob)
  const displayNodes = useMemo(() => applyJobCatalog(nodes, activeJob), [nodes, activeJob])
  const order = findJobOrder(catalog)

  const grouped = CORE_TYPE_ORDER.map((type) => ({
    type,
    meta: CORE_TYPES[type],
    nodes: displayNodes.filter((node) => node.type === type),
  })).filter((group) => group.nodes.length > 0)

  const viewToggle = (
    <div className="inline-flex shrink-0 self-start rounded-full border border-white/10 bg-slate-900/80 p-1 sm:self-auto">
      {VIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setView(item.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition ${
            view === item.id
              ? 'bg-amber-300/15 text-amber-100 ring-1 ring-amber-300/30 ring-inset'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="w-full">
      {showHeader ? (
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              HEXA Matrix Calculator
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {catalog
                ? `Skill names and icons for ${catalog.name}, from MapleStory Wiki. Progress still saves in this browser.`
                : 'Track each core’s current and target level to see the Sol Erda and fragments still needed. Progress saves to this browser automatically.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {jobPicker ? (
              <label className="flex items-center gap-2 text-xs text-slate-400">
                Job
                <select
                  value={pickedJob}
                  onChange={(event) => setPickedJob(event.target.value)}
                  className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-slate-100 outline-none focus:border-amber-300/50"
                >
                  <option value="">Generic cores</option>
                  {HEXA_JOBS.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {viewToggle}
          </div>
        </header>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          {catalog ? (
            <p className="mr-auto text-xs text-slate-500">
              {catalog.name} · MapleStory Wiki
            </p>
          ) : null}
          {viewToggle}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-6">
          {view === 'matrix' ? (
            <>
              <HexMatrix
                nodes={displayNodes}
                selectedId={selectedId}
                showPopover={popoverHost === 'matrix'}
                onSelect={(id) => selectNode(id, 'matrix')}
                onUpdateNode={updateNode}
              />
              <p className="text-center text-xs text-slate-500">
                Click any hexagon to set its levels. Escape or a click outside closes it.
              </p>
            </>
          ) : (
            grouped.map((group) => (
              <section key={group.type}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold tracking-wide text-slate-300">
                    {group.meta.label}
                  </h2>
                  <p className="text-xs text-slate-500">{group.meta.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.nodes.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      onChange={(patch) => updateNode(node.id, patch)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="min-w-0 lg:col-span-6">
          <ProgressBoard
            nodes={displayNodes}
            selectedId={selectedId}
            popoverOpen={popoverHost === 'board'}
            onSelect={(id) => selectNode(id, 'board')}
            onChange={updateNode}
            onQuickSetting={applyQuickSetting}
          />
        </div>
      </div>

      {order ? (
        <UpgradeOrder
          order={order}
          nodes={displayNodes}
          onSelect={(id) => {
            setView('matrix')
            selectNode(id, 'matrix')
          }}
        />
      ) : null}
    </div>
  )
}
