import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CheapestRoute from '../components/starforce/CheapestRoute.jsx'
import ConfigCard from '../components/starforce/ConfigCard.jsx'
import ExpectationPanel from '../components/starforce/ExpectationPanel.jsx'
import SimulationResult from '../components/starforce/SimulationResult.jsx'
import StarBreakdown from '../components/starforce/StarBreakdown.jsx'
import TrialButton from '../components/starforce/TrialButton.jsx'
import SavedRunsTable, { snapshotFrom } from '../components/starforce/SavedRunsTable.jsx'
import { useStoredState } from '../hooks/useStoredState.js'
import { DEFAULT_CONFIG, eventPresetFrom, eventsFromPreset } from '../starforce/constants.js'
import { expectedCost } from '../starforce/expected.js'
import { cheapestRoute } from '../starforce/optimize.js'
import { attemptTable, normalizeConfig, starCapFor } from '../starforce/model.js'
import { simulate } from '../starforce/simulate.js'

const STORAGE_KEY = 'maple-helper:starforce:v3'
const LAYOUT_KEY = 'maple-helper:starforce-layout:v1'
const SAVED_RUNS_KEY = 'maple-helper:starforce-saves:v1'
const MAX_SAVED_RUNS = 40

const LAYOUTS = [
  { id: 'v1', label: 'V1' },
  { id: 'v2', label: 'V2' },
  { id: 'v3', label: 'V3' },
]

const reviveConfig = (stored, fallback) =>
  normalizeConfig({
    ...fallback,
    ...stored,
    modes: stored?.modes,
    events: { ...fallback.events, ...stored?.events },
  })

const reviveRuns = (stored, fallback) => (Array.isArray(stored) ? stored : fallback)

export default function StarForcePage() {
  const [config, setConfig] = useStoredState(STORAGE_KEY, DEFAULT_CONFIG, reviveConfig)
  const [layout, setLayout] = useStoredState(LAYOUT_KEY, 'v1')
  const [savedRuns, setSavedRuns] = useStoredState(SAVED_RUNS_KEY, [], reviveRuns)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const pending = useRef(null)

  const starCap = starCapFor(config.itemLevel, config.itemMaxStar)
  const expectation = useMemo(() => expectedCost(config), [config])
  const breakdown = useMemo(() => attemptTable(config), [config])
  const route = useMemo(() => cheapestRoute(config), [config])

  const stale = result !== null && JSON.stringify(result.config) !== JSON.stringify(config)
  const isV1 = layout === 'v1'

  const handleChange = useCallback(
    (patch) => setConfig((prev) => normalizeConfig({ ...prev, ...patch })),
    [setConfig],
  )

  const applyRoute = useCallback(
    (next) => {
      if (next.server === 'kms') {
        handleChange({ safeguard: next.safeguard })
        return
      }
      handleChange({ modes: next.modes })
    },
    [handleChange],
  )

  const handleEventChange = useCallback(
    (id, checked) =>
      setConfig((prev) =>
        normalizeConfig({ ...prev, events: { ...prev.events, [id]: checked } }),
      ),
    [setConfig],
  )

  const runSimulation = useCallback(() => {
    setRunning(true)
    pending.current = window.setTimeout(() => {
      setResult(simulate(config))
      setRunning(false)
    }, 50)
  }, [config])

  const saveRun = useCallback(() => {
    if (config.currentStar >= config.targetStar) return

    const simulation = result && !stale ? result : null
    setSavedRuns((prev) => [
      snapshotFrom(config, expectation, simulation),
      ...prev,
    ].slice(0, MAX_SAVED_RUNS))
  }, [config, expectation, result, stale, setSavedRuns])

  const loadRun = useCallback(
    (row) => {
      setConfig(
        normalizeConfig({
          ...config,
          itemId: row.itemId,
          itemLevel: row.itemLevel,
          itemValue: row.itemValue,
          currentStar: row.currentStar,
          targetStar: row.targetStar,
          server: row.server,
          starCatch: row.starCatch,
          safeguard: row.safeguard,
          modes: row.modes,
          mvp: row.mvp,
          events: row.events,
        }),
      )
    },
    [config, setConfig],
  )

  useEffect(() => () => window.clearTimeout(pending.current), [])

  const reachedTarget = config.currentStar >= config.targetStar

  const results = (
    <div className="space-y-6">
      <ExpectationPanel expectation={expectation} route={config} />
      <CheapestRoute route={route} onApply={applyRoute} />

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={saveRun}
            disabled={reachedTarget}
            className="rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:outline-none"
          >
            Save this setup
          </button>
          <TrialButton
            trials={config.trials}
            running={running}
            disabled={reachedTarget}
            onRun={runSimulation}
            onTrialsChange={(trials) => handleChange({ trials })}
          />
        </div>
        <p className="text-center text-[11px] text-slate-500">
          Expected Cost updates as you change settings. Trials only add the luck histogram.
        </p>
        {reachedTarget ? (
          <p className="text-xs text-slate-500">Target must be above the current star.</p>
        ) : null}
        {stale && !running ? (
          <p className="text-xs text-amber-200/70">Settings changed — run trials again for a new histogram.</p>
        ) : null}
      </div>

      <SavedRunsTable
        rows={savedRuns}
        onLoad={loadRun}
        onRemove={(id) => setSavedRuns((prev) => prev.filter((row) => row.id !== id))}
        onClear={() => setSavedRuns([])}
      />

      {result && !reachedTarget ? <SimulationResult result={result} /> : null}
      <StarBreakdown rows={breakdown} />

      <p className="text-[11px] leading-5 text-slate-500">
        {config.server === 'gms' ? (
          <>
            GMS rates and meso formulas follow the MapleStory Wiki (30 stars, no star loss
            on failure). A destroyed item resumes from the trace checkpoint: 12★ from
            15–19, 15★ from 20, 17★ from 21–22, 19★ from 23–25, or 20★ from 26+. Meso cost
            uses the item level rounded down to the nearest 10. Enhancement Mode (15–21★)
            is on the V3 layout; Mode 4 at 15–17★ is Safeguard. Cheapest route picks modes
            from the item value and star-force meso. Superior equipment is not supported.
          </>
        ) : (
          <>
            KMS / JMS / MSEA use the wiki rates and low-star meso formula. Trace restore
            with spare copies is not modeled yet; a boom currently resumes at 12★ (the
            cheap one-copy restore). Superior equipment is not supported.
          </>
        )}
      </p>
    </div>
  )

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Star Force Simulator
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Pick an item, set the star range, and the expected meso cost updates immediately.
            Optionally run trials if you want the luck distribution. Settings save to this browser.
          </p>
        </div>

        <div className="inline-flex shrink-0 self-start rounded-full border border-white/10 bg-slate-900/80 p-1 sm:self-auto">
          {LAYOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setLayout(item.id)
                if (item.id === 'v3') {
                  handleChange({
                    events: eventsFromPreset(eventPresetFrom({ ...config.events, plusTwo: false })),
                  })
                }
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                layout === item.id
                  ? 'bg-amber-300/15 text-amber-100 ring-1 ring-amber-300/30 ring-inset'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {isV1 ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <ConfigCard
              layout="v1"
              config={config}
              starCap={starCap}
              onChange={handleChange}
              onEventChange={handleEventChange}
            />
          </div>
          {results}
        </div>
      ) : (
        <div className="space-y-6">
          <ConfigCard
            layout={layout}
            config={config}
            starCap={starCap}
            onChange={handleChange}
            onEventChange={handleEventChange}
            recommendedModes={route?.modes}
          />
          {results}
        </div>
      )}
    </>
  )
}
