export interface ThrashingPoint {
  degree: number
  cpuUtilization: number
  pageFaultsPerSec: number
  inThrashingZone: boolean
}

export interface ThrashingModel {
  points: ThrashingPoint[]
  /** Region where CPU collapses (thrashing) — x-axis degree range; null if graph never enters thrashing */
  thrashingRange: { from: number; to: number } | null
  /** Degree at peak CPU (optimal multiprogramming before collapse) */
  peakDegree: number
  /** Frames available — each process holds one page in RAM until demand exceeds F */
  frames: number
}

/**
 * Textbook-style curve: CPU utilization vs degree of multiprogramming.
 *
 * Story: RAM has F frames. Each process has its own page table; initially each process
 * keeps one page (e.g. page 1) resident. While degree n ≤ F, parallelism rises and CPU
 * utilization climbs toward an optimum. When n exceeds F (or when every process suddenly
 * needs another page), demand exceeds physical memory → page faults and swap dominate →
 * CPU utilization collapses (thrashing).
 *
 * This is a pedagogical model shaped like the standard TutorialsPoint / OS textbook graph.
 */
export function buildThrashingCurve(
  maxDegree: number,
  /** Pages each process must keep resident for the “good” region (1 = one page per process) */
  pagesPerProcessWorkingSet: number,
  /** Total physical frames F */
  memoryFrames: number
): ThrashingModel {
  const F = Math.max(1, memoryFrames)
  const w = Math.max(1, pagesPerProcessWorkingSet)
  /** Degree at which total working-set demand first exceeds F → thrashing begins */
  const criticalDegree = Math.max(1, Math.floor(F / w))
  const peakDegree = Math.min(criticalDegree, Math.max(1, maxDegree))

  const points: ThrashingPoint[] = []
  let thrashFrom = Number.POSITIVE_INFINITY
  let thrashTo = 0

  for (let d = 1; d <= maxDegree; d++) {
    const demand = d * w
    const pressure = demand / F

    let cpuUtilization: number
    let faults: number

    if (pressure <= 1) {
      // Increasing throughput: more processes, CPU stays productive (curve rises toward peak)
      const t = d / criticalDegree
      cpuUtilization = 25 + 68 * Math.pow(Math.min(1, t), 0.85)
      faults = 4 + d * 1.5
    } else {
      // Thrashing: CPU time lost to paging / swap
      const over = pressure - 1
      cpuUtilization = Math.max(5, 92 * Math.exp(-over * 4.2) - over * 8)
      faults = 35 + over * 180 + d * 8
    }

    cpuUtilization = Math.min(98, Math.max(0, cpuUtilization))
    const inThrashingZone = pressure > 1

    if (inThrashingZone) {
      thrashFrom = Math.min(thrashFrom, d)
      thrashTo = Math.max(thrashTo, d)
    }

    points.push({
      degree: d,
      cpuUtilization: Math.round(cpuUtilization * 10) / 10,
      pageFaultsPerSec: Math.round(faults * 10) / 10,
      inThrashingZone,
    })
  }

  const thrashingRange =
    thrashTo > 0 && thrashFrom !== Number.POSITIVE_INFINITY
      ? { from: thrashFrom, to: thrashTo }
      : null

  return {
    points,
    thrashingRange,
    peakDegree,
    frames: F,
  }
}

export function isThrashingWarning(p: ThrashingPoint): boolean {
  return p.inThrashingZone && p.pageFaultsPerSec > 45
}
