import {
  CORE_TYPE_ORDER,
  HEX_COL_STEP,
  HEX_ROW_STEP,
  MATRIX_BRANCHES,
} from '../constants.js'

/**
 * Slot `i` of a branch: pairs of hexes stepping diagonally away from the centre.
 * i = 0,1 sit on the innermost row, 2,3 on the next, and so on.
 */
export function slotForIndex(branch, index) {
  const [sx, sy] = branch.dir
  const ring = Math.floor(index / 2)
  const lane = index % 2
  return [sx * (ring + 2 * lane), sy * ring]
}

export function fillSequence(branch, count) {
  const sequence = [...(branch.fillOrder ?? [])]
  let candidate = 0
  while (sequence.length < count) {
    if (!sequence.includes(candidate)) sequence.push(candidate)
    candidate += 1
  }
  return sequence.slice(0, count)
}

export function positionForSlot(branch, slotIndex) {
  const [col, row] = slotForIndex(branch, slotIndex)
  const [anchorX, anchorY] = branch.anchor
  return {
    x: anchorX + col * HEX_COL_STEP,
    y: anchorY + row * HEX_ROW_STEP,
  }
}

/** Assign every node a position on the matrix board. */
export function layoutNodes(nodes) {
  return layoutBoard(nodes).filter((entry) => entry.kind === 'node')
}

/**
 * Nodes plus unused board slots (locked placeholders), matching the in-game
 * cluster silhouette for each branch.
 */
export function layoutBoard(nodes) {
  return CORE_TYPE_ORDER.flatMap((type) => {
    const branch = MATRIX_BRANCHES[type]
    if (!branch) return []

    const branchNodes = nodes.filter((node) => node.type === type)
    const sequence = fillSequence(branch, branchNodes.length)
    const used = new Set(sequence)
    const visibleSlots = branch.slots ?? sequence

    const filled = branchNodes.map((node, index) => ({
      kind: 'node',
      node,
      type,
      slotIndex: sequence[index],
      ...positionForSlot(branch, sequence[index]),
    }))

    const empties = visibleSlots
      .filter((slotIndex) => !used.has(slotIndex))
      .map((slotIndex) => ({
        kind: 'empty',
        type,
        slotIndex,
        ...positionForSlot(branch, slotIndex),
      }))

    return [...filled, ...empties]
  })
}
