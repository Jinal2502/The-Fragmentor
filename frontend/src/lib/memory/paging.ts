export interface PageTableEntry {
  pageIndex: number
  frame: number | null
  present: boolean
  read: boolean
  write: boolean
  execute: boolean
  reference: boolean
  dirty: boolean
}

export interface PagingConfig {
  logicalAddressSpaceBytes: number
  physicalMemoryBytes: number
  pageSizeBytes: number
}

export interface AddressSplit {
  logicalAddress: number
  pageNumber: number
  offset: number
  pageSizeBytes: number
  numPages: number
}

export interface TranslationResult {
  split: AddressSplit
  pte: PageTableEntry | null
  physicalAddress: number | null
  pageFault: boolean
  reason: string
}

export function validatePagingConfig(c: PagingConfig): string | null {
  if (c.pageSizeBytes <= 0 || (c.pageSizeBytes & (c.pageSizeBytes - 1)) !== 0) {
    return 'Page size should be a positive power of two for clean bit splitting in this lab'
  }
  if (c.logicalAddressSpaceBytes < c.pageSizeBytes) return 'Address space too small'
  if (c.physicalMemoryBytes < c.pageSizeBytes) return 'Physical memory too small'
  return null
}

export function splitAddress(logicalAddress: number, pageSizeBytes: number, logicalAddressSpaceBytes: number): AddressSplit {
  const numPages = Math.ceil(logicalAddressSpaceBytes / pageSizeBytes)
  const pageNumber = Math.floor(logicalAddress / pageSizeBytes)
  const offset = logicalAddress % pageSizeBytes
  return {
    logicalAddress,
    pageNumber,
    offset,
    pageSizeBytes,
    numPages,
  }
}

export function buildDefaultPageTable(
  config: PagingConfig,
  options?: Partial<{ absentPages: Set<number> }>
): { table: PageTableEntry[]; numFrames: number } {
  const numPages = Math.ceil(config.logicalAddressSpaceBytes / config.pageSizeBytes)
  const numFrames = Math.floor(config.physicalMemoryBytes / config.pageSizeBytes)
  const absent = options?.absentPages ?? new Set<number>()

  const table: PageTableEntry[] = []
  let nextFrame = 0
  for (let p = 0; p < numPages; p++) {
    const present = !absent.has(p) && nextFrame < numFrames
    const frame = present ? nextFrame : null
    if (present) nextFrame++
    table.push({
      pageIndex: p,
      frame: frame ?? null,
      present,
      read: true,
      write: true,
      execute: p === 0,
      reference: false,
      dirty: false,
    })
  }
  return { table, numFrames }
}

export function translate(
  config: PagingConfig,
  table: PageTableEntry[],
  logicalAddress: number
): TranslationResult {
  const split = splitAddress(logicalAddress, config.pageSizeBytes, config.logicalAddressSpaceBytes)
  if (split.pageNumber < 0 || split.pageNumber >= split.numPages) {
    return {
      split,
      pte: null,
      physicalAddress: null,
      pageFault: true,
      reason: 'Logical address out of range for this address space',
    }
  }
  if (split.offset >= config.pageSizeBytes) {
    return {
      split,
      pte: null,
      physicalAddress: null,
      pageFault: true,
      reason: 'Offset exceeds page size',
    }
  }

  const pte = table.find((e) => e.pageIndex === split.pageNumber) ?? null
  if (!pte || !pte.present || pte.frame === null) {
    return {
      split,
      pte,
      physicalAddress: null,
      pageFault: true,
      reason: 'Page not resident — page fault (OS must fetch or map)',
    }
  }

  const physicalAddress = pte.frame * config.pageSizeBytes + split.offset
  return {
    split,
    pte,
    physicalAddress,
    pageFault: false,
    reason: 'Mapped: physical = frame × page_size + offset',
  }
}

export function withReferenceDirty(
  table: PageTableEntry[],
  pageIndex: number,
  opts: { reference?: boolean; dirty?: boolean }
): PageTableEntry[] {
  return table.map((e) =>
    e.pageIndex === pageIndex
      ? {
          ...e,
          reference: opts.reference ?? e.reference,
          dirty: opts.dirty ?? e.dirty,
        }
      : e
  )
}
