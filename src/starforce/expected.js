import { buildPlan, normalizeConfig } from './model.js'

/**
 * Solves `matrix * x = rhs[i]` for several right-hand sides at once using
 * Gaussian elimination with partial pivoting. The system is at most 30x30, so
 * a dense direct solve is far cheaper than any iterative scheme.
 */
function solve(matrix, rhsList) {
  const n = matrix.length
  const extra = rhsList.length
  const rows = matrix.map((row, i) => [...row, ...rhsList.map((rhs) => rhs[i])])

  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row
    }
    if (pivot !== col) [rows[col], rows[pivot]] = [rows[pivot], rows[col]]

    const pivotValue = rows[col][col]
    if (pivotValue === 0) continue

    for (let row = col + 1; row < n; row += 1) {
      const factor = rows[row][col] / pivotValue
      if (factor === 0) continue
      for (let k = col; k < n + extra; k += 1) {
        rows[row][k] -= factor * rows[col][k]
      }
    }
  }

  const solutions = rhsList.map(() => new Float64Array(n))
  for (let row = n - 1; row >= 0; row -= 1) {
    for (let e = 0; e < extra; e += 1) {
      let value = rows[row][n + e]
      for (let col = row + 1; col < n; col += 1) {
        value -= rows[row][col] * solutions[e][col]
      }
      solutions[e][row] = rows[row][row] === 0 ? 0 : value / rows[row][row]
    }
  }

  return solutions
}

/**
 * Solve expected enhance meso, booms and attempts from every star below the
 * target. `total[s]` already includes replacement cost (`booms * itemValue`).
 */
export function expectedFields(rawConfig) {
  const config = normalizeConfig(rawConfig)
  const plan = buildPlan(config)
  const n = config.targetStar
  const zero = {
    config,
    plan,
    n,
    total: new Float64Array(0),
    meso: 0,
    enhanceMeso: 0,
    replacementMeso: 0,
    booms: 0,
    attempts: 0,
    noBoomChance: 1,
  }
  if (n === 0 || config.currentStar >= config.targetStar) return zero

  const matrix = Array.from({ length: n }, () => new Float64Array(n))
  const mesoRhs = new Float64Array(n)
  const attemptRhs = new Float64Array(n)
  const boomRhs = new Float64Array(n)

  for (let star = 0; star < n; star += 1) {
    const resolve = plan.success[star] + plan.destroy[star]
    const advanceChance = plan.success[star] / resolve
    const boomChance = plan.destroy[star] / resolve

    matrix[star][star] = 1
    if (plan.nextStar[star] < n) matrix[star][plan.nextStar[star]] -= advanceChance
    if (plan.recover[star] < n) matrix[star][plan.recover[star]] -= boomChance

    mesoRhs[star] = plan.cost[star] / resolve
    attemptRhs[star] = 1 / resolve
    boomRhs[star] = boomChance
  }

  const [enhance, attempts, booms] = solve(matrix, [mesoRhs, attemptRhs, boomRhs])

  const noBoom = new Float64Array(n + 1).fill(1)
  for (let star = n - 1; star >= 0; star -= 1) {
    const resolve = plan.success[star] + plan.destroy[star]
    const next = Math.min(n, plan.nextStar[star])
    noBoom[star] = (plan.success[star] / resolve) * noBoom[next]
  }

  const itemValue = config.itemValue ?? 0
  const total = new Float64Array(n)
  for (let star = 0; star < n; star += 1) {
    total[star] = enhance[star] + booms[star] * itemValue
  }

  const from = config.currentStar
  return {
    config,
    plan,
    n,
    total,
    meso: total[from],
    enhanceMeso: enhance[from],
    replacementMeso: booms[from] * itemValue,
    attempts: attempts[from],
    booms: booms[from],
    noBoomChance: noBoom[from],
  }
}

/**
 * Exact expected meso, booms and attempts needed to reach the target star.
 *
 * A "maintain" result changes nothing, so each visit to star s costs
 * `cost[s] / resolveChance[s]` on average and then either advances or blows the
 * item back down to a fixed checkpoint. Because destruction sends you
 * *backwards*, the expectations reference each other in both directions and
 * cannot be unrolled with a plain backward pass - hence the linear solve.
 */
export function expectedCost(rawConfig) {
  const { config, meso, enhanceMeso, replacementMeso, attempts, booms, noBoomChance } =
    expectedFields(rawConfig)
  return { config, meso, enhanceMeso, replacementMeso, attempts, booms, noBoomChance }
}
