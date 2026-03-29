/** Relative latency units (pedagogical, not cycle-accurate). */
export const HIERARCHY_LEVELS = [
  { id: 'registers', label: 'CPU / Registers', latency: 1 },
  { id: 'l1', label: 'Cache', latency: 3 },
  { id: 'ram', label: 'RAM', latency: 80 },
  { id: 'disk', label: 'Disk (secondary)', latency: 8000 },
] as const

export type HierarchyLevelId = (typeof HIERARCHY_LEVELS)[number]['id']

/**
 * Maps RAM size (GB) to model outputs. Clearly a teaching model, not hardware measurement.
 */
export function computeHierarchyMetrics(ramGb: number): {
  cpuUtilizationPercent: number
  multiprogrammingDegree: number
  effectiveThroughput: number
} {
  const clamped = Math.max(0.5, Math.min(128, ramGb))
  const baseline = 4
  const ratio = clamped / baseline
  const cpuUtilizationPercent = Math.min(
    96,
    28 + 42 * Math.log2(1 + ratio * 0.35) + (clamped > baseline ? 8 : 0)
  )
  const nominalProcessGb = 1.2
  const multiprogrammingDegree = Math.max(1, Math.floor(clamped / nominalProcessGb))
  const effectiveThroughput = (cpuUtilizationPercent / 100) * Math.sqrt(multiprogrammingDegree)

  return {
    cpuUtilizationPercent: Math.round(cpuUtilizationPercent * 10) / 10,
    multiprogrammingDegree,
    effectiveThroughput: Math.round(effectiveThroughput * 100) / 100,
  }
}

export function latencyScale(latency: number): number {
  const min = HIERARCHY_LEVELS[0].latency
  const max = HIERARCHY_LEVELS[HIERARCHY_LEVELS.length - 1].latency
  return (Math.log10(latency) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))
}
