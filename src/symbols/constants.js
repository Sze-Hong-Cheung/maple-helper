/**
 * Arcane / Sacred / Grand Sacred symbol tables.
 *
 * Symbol counts and meso fees follow MapleStory Wiki:
 *   Arcane  — count L²+11, meso 10,000×floor((base+0.1L)×count)
 *   Sacred  — count 9L²+20L, meso 100,000×floor(count×(base−0.6L))
 * Daily / weekly defaults are the current GMS quest rewards.
 *
 * Geardock (1714001) is newer than the GMS 264 dump on maplestory.io,
 * so its icon is bundled from MapleStory Wiki.
 */

import geardockIcon from '../assets/symbols/geardock.png'

const CDN = 'https://maplestory.io/api/GMS/264/item'

export const ARCANE_MAX_LEVEL = 20
export const SACRED_MAX_LEVEL = 11

function symbol({
  id,
  name,
  type,
  itemId,
  maxLevel,
  mesoBase,
  daily,
  weekly = 0,
  icon,
}) {
  return {
    id,
    name,
    type,
    itemId,
    icon: icon ?? `${CDN}/${itemId}/icon`,
    maxLevel,
    mesoBase,
    daily,
    weekly,
  }
}

export const SYMBOLS = [
  symbol({
    id: 'vanishing-journey',
    name: 'Vanishing Journey',
    type: 'arcane',
    itemId: 1712001,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 8,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'chu-chu',
    name: 'Chu Chu Island',
    type: 'arcane',
    itemId: 1712002,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 10,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'lachelein',
    name: 'Lachelein',
    type: 'arcane',
    itemId: 1712003,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 12,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'arcana',
    name: 'Arcana',
    type: 'arcane',
    itemId: 1712004,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 14,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'morass',
    name: 'Morass',
    type: 'arcane',
    itemId: 1712005,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 16,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'esfera',
    name: 'Esfera',
    type: 'arcane',
    itemId: 1712006,
    maxLevel: ARCANE_MAX_LEVEL,
    mesoBase: 18,
    daily: 20,
    weekly: 45,
  }),
  symbol({
    id: 'cernium',
    name: 'Cernium',
    type: 'sacred',
    itemId: 1713000,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 13.2,
    daily: 20,
  }),
  symbol({
    id: 'arcus',
    name: 'Hotel Arcus',
    type: 'sacred',
    itemId: 1713001,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 15.0,
    daily: 10,
  }),
  symbol({
    id: 'odium',
    name: 'Odium',
    type: 'sacred',
    itemId: 1713002,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 16.8,
    daily: 10,
  }),
  symbol({
    id: 'shangri-la',
    name: 'Shangri-La',
    type: 'sacred',
    itemId: 1713003,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 18.6,
    daily: 10,
  }),
  symbol({
    id: 'arteria',
    name: 'Arteria',
    type: 'sacred',
    itemId: 1713004,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 20.4,
    daily: 10,
  }),
  symbol({
    id: 'carcion',
    name: 'Carcion',
    type: 'sacred',
    itemId: 1713005,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 22.2,
    daily: 10,
  }),
  symbol({
    id: 'tallahart',
    name: 'Tallahart',
    type: 'grand',
    itemId: 1714000,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 39.8,
    daily: 10,
  }),
  symbol({
    id: 'geardock',
    name: 'Geardock',
    type: 'grand',
    itemId: 1714001,
    maxLevel: SACRED_MAX_LEVEL,
    mesoBase: 48.8,
    daily: 10,
    icon: geardockIcon,
  }),
]

export const SYMBOL_GROUPS = [
  { id: 'arcane', label: 'Arcane' },
  { id: 'sacred', label: 'Sacred' },
  { id: 'grand', label: 'Grand Sacred' },
]

export function defaultProgress() {
  return Object.fromEntries(
    SYMBOLS.map((entry) => [
      entry.id,
      { level: 1, exp: 0, target: entry.maxLevel },
    ]),
  )
}
