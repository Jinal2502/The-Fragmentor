export interface ProcessPageTableSummary {
  pid: string
  pageCount: number
  /** One entry per logical page */
  entries: { page: number; frame: number }[]
}

export interface InvertedEntry {
  frame: number
  pid: string
  page: number
}

export interface InvertedComparison {
  processCount: number
  frames: number
  /** Sum of (pages per process) — conventional multi-level cost model */
  conventionalEntryCount: number
  /** One IPT row per physical frame */
  invertedEntryCount: number
  /** Positive = IPT uses fewer entries */
  entriesSaved: number
  /** Assume 8 bytes per entry for teaching display */
  bytesSavedEstimate: number
  ipt: InvertedEntry[]
  perProcess: ProcessPageTableSummary[]
}

/**
 * Build a toy comparison: each process has `pagesEach` pages mapped 1:1 into frames in order.
 */
export function buildInvertedComparison(
  processIds: string[],
  pagesEach: number,
  frames: number
): InvertedComparison {
  const perProcess: ProcessPageTableSummary[] = []
  let frameCursor = 0
  const ipt: InvertedEntry[] = []

  for (const pid of processIds) {
    const entries: { page: number; frame: number }[] = []
    for (let p = 0; p < pagesEach; p++) {
      if (frameCursor >= frames) break
      entries.push({ page: p, frame: frameCursor })
      ipt.push({ frame: frameCursor, pid, page: p })
      frameCursor++
    }
    perProcess.push({ pid, pageCount: pagesEach, entries })
  }

  const conventionalEntryCount = processIds.length * pagesEach
  const invertedEntryCount = ipt.length
  const entriesSaved = Math.max(0, conventionalEntryCount - invertedEntryCount)
  const bytesSavedEstimate = Math.max(0, entriesSaved) * 8

  return {
    processCount: processIds.length,
    frames,
    conventionalEntryCount,
    invertedEntryCount,
    entriesSaved,
    bytesSavedEstimate,
    ipt: ipt.sort((a, b) => a.frame - b.frame),
    perProcess,
  }
}

export function lookupInverted(ipt: InvertedEntry[], pid: string, page: number): InvertedEntry | undefined {
  return ipt.find((e) => e.pid === pid && e.page === page)
}
