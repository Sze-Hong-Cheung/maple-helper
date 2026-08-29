export const MIN_LEVEL = 0
export const MAX_LEVEL = 30

export const STORAGE_KEY = 'maple-helper:hexa-progress:v1'
export const STORAGE_VERSION = 3

/** Cost to reach this level from the previous one. Index = target level. */
function costs(...rows) {
  return [null, ...rows.map(([solErda, fragments]) => ({ solErda, fragments }))]
}

/**
 * HEXA Matrix upgrade costs (KMS/GMS-style tables).
 * Skill Core 0→1 is free (origin unlock); other cores pay to activate.
 */
export const UPGRADE_COSTS = {
  skill: costs(
    [0, 0],
    [1, 30],
    [1, 35],
    [1, 40],
    [2, 45],
    [2, 50],
    [2, 55],
    [3, 60],
    [3, 65],
    [10, 200],
    [3, 80],
    [3, 90],
    [4, 100],
    [4, 110],
    [4, 120],
    [4, 130],
    [4, 140],
    [4, 150],
    [5, 160],
    [15, 350],
    [5, 170],
    [5, 180],
    [5, 190],
    [5, 200],
    [5, 210],
    [6, 220],
    [6, 230],
    [6, 240],
    [7, 250],
    [20, 500],
  ),
  /** Same curve as the Origin skill, but the node has to be paid for to unlock. */
  ascent: costs(
    [5, 100],
    [1, 30],
    [1, 35],
    [1, 40],
    [2, 45],
    [2, 50],
    [2, 55],
    [3, 60],
    [3, 65],
    [10, 200],
    [3, 80],
    [3, 90],
    [4, 100],
    [4, 110],
    [4, 120],
    [4, 130],
    [4, 140],
    [4, 150],
    [5, 160],
    [15, 350],
    [5, 170],
    [5, 180],
    [5, 190],
    [5, 200],
    [5, 210],
    [6, 220],
    [6, 230],
    [6, 240],
    [7, 250],
    [20, 500],
  ),
  mastery: costs(
    [3, 50],
    [1, 15],
    [1, 18],
    [1, 20],
    [1, 23],
    [1, 25],
    [1, 28],
    [2, 30],
    [2, 33],
    [5, 100],
    [2, 40],
    [2, 45],
    [2, 50],
    [2, 55],
    [2, 60],
    [2, 65],
    [2, 70],
    [2, 75],
    [3, 80],
    [8, 175],
    [3, 85],
    [3, 90],
    [3, 95],
    [3, 100],
    [3, 105],
    [3, 110],
    [3, 115],
    [3, 120],
    [4, 125],
    [10, 250],
  ),
  boost: costs(
    [4, 75],
    [1, 23],
    [1, 27],
    [1, 30],
    [2, 34],
    [2, 38],
    [2, 42],
    [3, 45],
    [3, 49],
    [8, 150],
    [3, 60],
    [3, 68],
    [3, 75],
    [3, 83],
    [3, 90],
    [3, 98],
    [3, 105],
    [3, 113],
    [4, 120],
    [12, 263],
    [4, 128],
    [4, 135],
    [4, 143],
    [4, 150],
    [4, 158],
    [5, 165],
    [5, 173],
    [5, 180],
    [6, 188],
    [15, 375],
  ),
  solJanus: costs(
    [7, 125],
    [2, 38],
    [2, 44],
    [2, 50],
    [3, 57],
    [3, 63],
    [3, 69],
    [5, 75],
    [5, 82],
    [14, 300],
    [5, 110],
    [5, 124],
    [6, 138],
    [6, 152],
    [6, 165],
    [6, 179],
    [6, 193],
    [6, 207],
    [7, 220],
    [17, 525],
    [7, 234],
    [7, 248],
    [7, 262],
    [7, 275],
    [7, 289],
    [9, 303],
    [9, 317],
    [9, 330],
    [10, 344],
    [20, 750],
  ),
}

export const CORE_TYPES = {
  skill: {
    id: 'skill',
    label: 'Skill Core',
    description: 'Origin and Ascent skills',
    accent: 'violet',
    palette: { from: '#c084fc', to: '#5b21b6', edge: '#e9d5ff', glow: '#c084fc' },
  },
  mastery: {
    id: 'mastery',
    label: 'Mastery Core',
    description: '4th and 5th job mastery',
    accent: 'fuchsia',
    palette: { from: '#f0abfc', to: '#a21caf', edge: '#f5d0fe', glow: '#e879f9' },
  },
  boost: {
    id: 'boost',
    label: 'Boost Core',
    description: '5th job skill boosts',
    accent: 'sky',
    palette: { from: '#67e8f9', to: '#0e7490', edge: '#a5f3fc', glow: '#22d3ee' },
  },
  solJanus: {
    id: 'solJanus',
    label: 'Common Core',
    description: 'Common cores',
    accent: 'slate',
    palette: { from: '#93c5fd', to: '#334155', edge: '#cbd5e1', glow: '#94a3b8' },
  },
}

export const CORE_TYPE_ORDER = ['skill', 'mastery', 'boost', 'solJanus']

/** The matrix board's SVG viewBox, shared by the board and its popover. */
export const MATRIX_VIEWBOX = { x: -300, y: -310, width: 600, height: 640 }

/** Pointy-top hex geometry, in SVG user units. */
export const HEX_RADIUS = 44
export const HEX_HALF_WIDTH = HEX_RADIUS * (Math.sqrt(3) / 2)
export const HEX_WIDTH = HEX_HALF_WIDTH * 2
export const HEX_HEIGHT = HEX_RADIUS * 2
/** Extra centre-to-centre space vs a packed hex grid. Slot 0 stays on the branch anchor. */
export const HEX_GAP = 5
const HEX_PACK = (HEX_WIDTH + HEX_GAP) / HEX_WIDTH
export const HEX_COL_STEP = (HEX_WIDTH / 2) * HEX_PACK
export const HEX_ROW_STEP = HEX_HEIGHT * 0.75 * HEX_PACK

/**
 * Each branch is a parallelogram of hex slots growing away from the centre.
 * `dir` is the [x, y] direction, `fillOrder` picks which slots get used first
 * so a partially-filled branch keeps the staggered in-game silhouette.
 */
export const MATRIX_BRANCHES = {
  skill: {
    anchor: [-60, -74],
    dir: [-1, -1],
    fillOrder: [0, 2, 3, 5],
    slots: [0, 1, 2, 3, 4, 5],
  },
  mastery: {
    anchor: [60, -74],
    dir: [1, -1],
    fillOrder: [0, 2, 3, 5],
    slots: [0, 2, 3, 5],
  },
  boost: {
    anchor: [-60, 92],
    dir: [-1, 1],
    fillOrder: [0, 2, 3, 5],
    slots: [0, 2, 3, 5],
  },
  solJanus: {
    anchor: [60, 92],
    dir: [1, 1],
    fillOrder: [0, 2, 3, 5],
    slots: [0, 2, 3, 5],
  },
}

/**
 * `type` decides which branch and colour a node gets, `costs` which upgrade
 * table it pays from — Origin and Ascent share a branch but not a table.
 * `min` is the floor a node can never drop below (Origin is granted at 1).
 */
function node(id, type, name, options = {}) {
  const min = options.min ?? MIN_LEVEL
  return {
    id,
    type,
    name,
    costs: options.costs ?? type,
    min,
    current: min,
    target: MAX_LEVEL,
  }
}

export const DEFAULT_NODES = [
  node('skill-1', 'skill', 'Origin Skill', { min: 1 }),
  node('skill-2', 'skill', 'Ascent Skill', { costs: 'ascent' }),
  node('mastery-1', 'mastery', 'Mastery Core 1'),
  node('mastery-2', 'mastery', 'Mastery Core 2'),
  node('mastery-3', 'mastery', 'Mastery Core 3'),
  node('mastery-4', 'mastery', 'Mastery Core 4'),
  node('boost-1', 'boost', 'Boost Core 1'),
  node('boost-2', 'boost', 'Boost Core 2'),
  node('boost-3', 'boost', 'Boost Core 3'),
  node('boost-4', 'boost', 'Boost Core 4'),
  node('solJanus-1', 'solJanus', 'Sol Janus'),
  node('solJanus-2', 'solJanus', 'Sol Hecate'),
]

export const DEFAULT_NODE_BY_ID = new Map(DEFAULT_NODES.map((item) => [item.id, item]))
