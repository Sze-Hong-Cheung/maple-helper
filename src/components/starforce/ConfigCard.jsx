import { useLayoutEffect, useRef, useState } from 'react'
import {
  EVENT_PRESETS,
  EVENTS,
  MVP_TIERS,
  SAFEGUARD_MAX_STAR,
  SAFEGUARD_MIN_STAR,
  SERVERS,
  SERVER_ORDER,
  eventPresetFrom,
  eventsFromPreset,
} from '../../starforce/constants.js'
import { findItemById } from '../../starforce/items.js'
import EnhancementModeCard from './EnhancementModeCard.jsx'
import { SelectField } from './Field.jsx'
import ItemPicker from './ItemPicker.jsx'
import StarRange from './StarRange.jsx'
import { ToggleRow } from './Toggle.jsx'

const serverOptions = SERVER_ORDER.map((id) => ({
  value: id,
  label: SERVERS[id].label,
}))

const mvpOptions = MVP_TIERS.map((tier) => ({ value: tier.id, label: tier.label }))

function ItemSlot({ item, level, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={item ? `${item.name} · ${item.slot} · Lv ${item.level}` : 'Choose an item'}
      className="flex size-[7.25rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-white/12 bg-slate-950/80 transition hover:border-amber-300/40 hover:bg-slate-900"
    >
      <span className="text-xs font-medium text-slate-300">Lv {level}</span>
      {item?.icon ? (
        <img
          src={item.icon}
          alt={item.name}
          className="h-12 w-12 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <span className="text-2xl text-slate-600">?</span>
      )}
    </button>
  )
}

function ServerSelect({ config, onChange }) {
  return (
    <SelectField
      value={config.server}
      options={serverOptions}
      onChange={(value) => onChange({ server: value })}
      label="Server"
    />
  )
}

function formatItemValue(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits || Number(digits) === 0) return ''
  return Number(digits).toLocaleString('en-US')
}

function caretFromDigitCount(formatted, digitCount) {
  let pos = 0
  let seen = 0
  while (pos < formatted.length && seen < digitCount) {
    if (formatted[pos] >= '0' && formatted[pos] <= '9') seen += 1
    pos += 1
  }
  return pos
}

function ItemValueField({ value, onChange, wide = false }) {
  const inputRef = useRef(null)
  const caretDigitsRef = useRef(null)

  useLayoutEffect(() => {
    const el = inputRef.current
    const digitCount = caretDigitsRef.current
    if (!el || digitCount == null) return
    caretDigitsRef.current = null
    const pos = caretFromDigitCount(el.value, digitCount)
    el.setSelectionRange(pos, pos)
  })

  return (
    <label className={wide ? 'flex min-w-0 flex-1 flex-col gap-1' : 'flex w-[7.25rem] flex-col gap-1'}>
      <span className="text-[11px] font-medium text-slate-400">Item value</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={formatItemValue(value)}
        placeholder="0"
        onChange={(event) => {
          const caret = event.target.selectionStart ?? event.target.value.length
          caretDigitsRef.current = event.target.value.slice(0, caret).replace(/\D/g, '').length
          const digits = event.target.value.replace(/\D/g, '')
          onChange({ itemValue: digits === '' ? 0 : digits })
        }}
        title="Mesos to buy a replacement after a boom"
        className={`w-full rounded-lg border border-white/12 bg-slate-950/80 font-semibold tabular-nums text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 ${
          wide ? 'px-2.5 py-2 text-left text-sm' : 'px-1.5 py-1 text-center text-[11px]'
        }`}
      />
    </label>
  )
}

function CheckLabel({ label, checked, onChange, disabled, title }) {
  return (
    <label
      title={title}
      className={`flex cursor-pointer items-center gap-1.5 text-sm text-slate-200 select-none ${
        disabled ? 'cursor-not-allowed opacity-40' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-emerald-400"
      />
      {label}
    </label>
  )
}

function setSafeguardValue(config, onChange, value) {
  if (config.server === 'gms') {
    onChange({
      safeguard: value,
      modes: {
        ...config.modes,
        15: value ? 4 : 1,
        16: value ? 4 : 1,
        17: value ? 4 : 1,
      },
    })
    return
  }
  onChange({ safeguard: value })
}

function ItemFieldsV3({ item, config, starCap, onChange, onOpenPicker }) {
  const safeguardUseful =
    config.targetStar > SAFEGUARD_MIN_STAR && config.currentStar <= SAFEGUARD_MAX_STAR
  const showSafeguard = config.server !== 'gms'

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ItemSlot item={item} level={config.itemLevel} onOpen={onOpenPicker} />
        <ItemValueField value={config.itemValue} onChange={onChange} wide />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StarRange
          current={config.currentStar}
          target={config.targetStar}
          starCap={starCap}
          onChange={onChange}
          starsAfter
        />
        {showSafeguard ? (
          <CheckLabel
            label="Safeguard"
            checked={config.safeguard}
            disabled={!safeguardUseful}
            title={
              safeguardUseful
                ? `${SAFEGUARD_MIN_STAR}–${SAFEGUARD_MAX_STAR} stars only`
                : 'Safeguard does not apply to this range'
            }
            onChange={(value) => setSafeguardValue(config, onChange, value)}
          />
        ) : null}
        <CheckLabel
          label="Star Catch"
          checked={config.starCatch}
          title="Success rate ×1.05"
          onChange={(value) => onChange({ starCatch: value })}
        />
      </div>
    </div>
  )
}

function ItemFields({ item, config, starCap, onChange, onOpenPicker, showSafeguard = true }) {
  const safeguardUseful =
    config.targetStar > SAFEGUARD_MIN_STAR && config.currentStar <= SAFEGUARD_MAX_STAR

  return (
    <div className="flex items-start gap-4">
      <div className="flex shrink-0 flex-col items-center gap-2">
        <ItemSlot item={item} level={config.itemLevel} onOpen={onOpenPicker} />
        <ItemValueField value={config.itemValue} onChange={onChange} />
      </div>

      <div className="min-w-0 flex-1 space-y-3 pt-1">
        <StarRange
          current={config.currentStar}
          target={config.targetStar}
          starCap={starCap}
          onChange={onChange}
        />

        <div className="-mx-1">
          <ToggleRow
            label="Star Catching"
            hint="Success rate ×1.05"
            checked={config.starCatch}
            onChange={(value) => onChange({ starCatch: value })}
          />
          {showSafeguard ? (
            <ToggleRow
              label="Safeguard"
              hint={`${SAFEGUARD_MIN_STAR}–${SAFEGUARD_MAX_STAR} stars only · triples the cost`}
              checked={config.safeguard}
              disabled={!safeguardUseful}
              title={safeguardUseful ? undefined : 'Safeguard does not apply to this range'}
              onChange={(value) => setSafeguardValue(config, onChange, value)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EventBuffs({ config, onEventChange, framed = true, columns = 1 }) {
  const compact = columns > 1
  const rows = EVENTS.map((event) => (
    <ToggleRow
      key={event.id}
      label={event.label}
      hint={event.hint}
      checked={Boolean(config.events[event.id])}
      onChange={(checked) => onEventChange(event.id, checked)}
      className={compact ? 'px-2 py-2' : undefined}
    />
  ))

  const list = compact ? (
    <div className="grid grid-cols-2 gap-x-2">{rows}</div>
  ) : (
    <div className={framed ? 'divide-y divide-white/8' : '-mx-1 divide-y divide-white/8'}>
      {rows}
    </div>
  )

  return (
    <section className="min-w-0">
      <p className="mb-2 text-sm font-medium text-slate-200">Event Buff</p>
      {framed ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          {list}
        </div>
      ) : (
        list
      )}
    </section>
  )
}

function EventPresetSelect({ config, onChange }) {
  return (
    <section>
      <p className="mb-2 text-sm font-medium text-slate-200">Event</p>
      <SelectField
        value={eventPresetFrom(config.events)}
        options={EVENT_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))}
        onChange={(value) => onChange({ events: eventsFromPreset(value) })}
        label="Event"
      />
    </section>
  )
}

function MvpDiscount({ config, onChange }) {
  return (
    <section>
      <p className="mb-2 text-sm font-medium text-slate-200">MVP Discount</p>
      <SelectField
        value={config.mvp}
        options={mvpOptions}
        onChange={(value) => onChange({ mvp: value })}
        label="MVP Discount"
      />
    </section>
  )
}

export default function ConfigCard({
  config,
  starCap,
  onChange,
  onEventChange,
  recommendedModes,
  layout = 'v1',
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const item = config.itemId ? findItemById(config.itemId) : null
  const isV3 = layout === 'v3'

  const selectItem = (next) => {
    onChange({ itemId: next.id, itemLevel: next.level, itemMaxStar: next.maxStar ?? null })
    setPickerOpen(false)
  }

  const picker = pickerOpen ? (
    <ItemPicker selectedId={config.itemId} onSelect={selectItem} onClose={() => setPickerOpen(false)} />
  ) : null

  const itemFields = (
    <ItemFields
      item={item}
      config={config}
      starCap={starCap}
      onChange={onChange}
      onOpenPicker={() => setPickerOpen(true)}
      showSafeguard
    />
  )

  if (isV3) {
    return (
      <div className="space-y-4">
        <div className="w-full sm:max-w-xs">
          <ServerSelect config={config} onChange={onChange} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="grid lg:grid-cols-[minmax(280px,2fr)_minmax(0,3fr)] lg:divide-x lg:divide-white/8">
            <div className="space-y-4 p-4 md:p-5">
              <ItemFieldsV3
                item={item}
                config={config}
                starCap={starCap}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
              />
              <EventPresetSelect config={config} onChange={onChange} />
              <MvpDiscount config={config} onChange={onChange} />
            </div>
            <div className="border-t border-white/8 lg:border-t-0">
              <EnhancementModeCard
                config={config}
                recommendedModes={recommendedModes}
                onChange={onChange}
              />
            </div>
          </div>
        </section>
        {picker}
      </div>
    )
  }

  if (layout === 'v2') {
    return (
      <div className="space-y-4">
        <div className="w-full sm:max-w-xs">
          <ServerSelect config={config} onChange={onChange} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:divide-x md:divide-white/8">
            <div className="p-4 md:p-5">{itemFields}</div>
            <div className="space-y-4 border-t border-white/8 p-4 md:border-t-0 md:p-5">
              <EventBuffs
                config={config}
                onEventChange={onEventChange}
                framed={false}
                columns={2}
              />
              <MvpDiscount config={config} onChange={onChange} />
            </div>
          </div>
        </section>
        {picker}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ServerSelect config={config} onChange={onChange} />
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">{itemFields}</section>
      <EventBuffs config={config} onEventChange={onEventChange} />
      <MvpDiscount config={config} onChange={onChange} />
      {picker}
    </div>
  )
}
