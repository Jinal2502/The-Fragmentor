export type BlockKind = 'allocated' | 'free'

export interface MemoryBlock {
  id: string
  start: number
  size: number
  kind: BlockKind
  /** Process id when allocated */
  pid?: string
  /** Bytes used inside block (for internal fragmentation visualization) */
  used?: number
}

export type PartitioningMode = 'fixed' | 'variable'

export interface ContiguousState {
  totalSize: number
  mode: PartitioningMode
  /** Fixed mode: partition count */
  partitionCount: number
  blocks: MemoryBlock[]
}

let idCounter = 0
function nextId() {
  return `b${++idCounter}`
}

function buildFixedBlocks(total: number, partitionCount: number): MemoryBlock[] {
  const partSize = Math.floor(total / partitionCount)
  const blocks: MemoryBlock[] = []
  let start = 0
  for (let i = 0; i < partitionCount; i++) {
    const size = i === partitionCount - 1 ? total - start : partSize
    blocks.push({
      id: nextId(),
      start,
      size,
      kind: 'free',
    })
    start += size
  }
  return blocks
}

function buildVariableBlocks(total: number): MemoryBlock[] {
  return [{ id: nextId(), start: 0, size: total, kind: 'free' }]
}

export function initialContiguousState(
  totalSize: number,
  mode: PartitioningMode,
  partitionCount: number
): ContiguousState {
  idCounter = 0
  const blocks =
    mode === 'fixed'
      ? buildFixedBlocks(totalSize, Math.max(1, partitionCount))
      : buildVariableBlocks(totalSize)
  return {
    totalSize,
    mode,
    partitionCount: mode === 'fixed' ? Math.max(1, partitionCount) : 1,
    blocks: normalizeBlocks(blocks),
  }
}

function normalizeBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  return [...blocks].sort((a, b) => a.start - b.start)
}

/** Merge adjacent free blocks */
function coalesce(blocks: MemoryBlock[]): MemoryBlock[] {
  const sorted = normalizeBlocks(blocks)
  const out: MemoryBlock[] = []
  for (const b of sorted) {
    const last = out[out.length - 1]
    if (last && last.kind === 'free' && b.kind === 'free' && last.start + last.size === b.start) {
      last.size += b.size
    } else {
      out.push({ ...b })
    }
  }
  return out
}

export function allocateProcess(
  state: ContiguousState,
  pid: string,
  requestSize: number
): { state: ContiguousState; ok: boolean; reason?: string } {
  if (requestSize <= 0) return { state, ok: false, reason: 'Invalid size' }

  if (state.mode === 'fixed') {
    const blocks = state.blocks.map((b) => ({ ...b }))
    const hole = blocks.find((b) => b.kind === 'free' && b.size >= requestSize)
    if (!hole) return { state, ok: false, reason: 'No partition large enough' }
    hole.kind = 'allocated'
    hole.pid = pid
    hole.used = requestSize
    return {
      state: { ...state, blocks },
      ok: true,
    }
  }

  const blocks = state.blocks.map((b) => ({ ...b }))
  const idx = blocks.findIndex((b) => b.kind === 'free' && b.size >= requestSize)
  if (idx === -1) return { state, ok: false, reason: 'No hole large enough' }

  const hole = blocks[idx]
  const remaining = hole.size - requestSize
  const alloc: MemoryBlock = {
    id: nextId(),
    start: hole.start,
    size: requestSize,
    kind: 'allocated',
    pid,
    used: requestSize,
  }
  if (remaining > 0) {
    const newFree: MemoryBlock = {
      id: nextId(),
      start: hole.start + requestSize,
      size: remaining,
      kind: 'free',
    }
    blocks.splice(idx, 1, alloc, newFree)
  } else {
    blocks[idx] = alloc
  }

  return { state: { ...state, blocks: coalesce(blocks) }, ok: true }
}

export function freeProcess(state: ContiguousState, pid: string): ContiguousState {
  const blocks = state.blocks.map((b) => {
    if (b.kind === 'allocated' && b.pid === pid) {
      return { ...b, kind: 'free' as const, pid: undefined, used: undefined }
    }
    return { ...b }
  })
  return { ...state, blocks: coalesce(blocks) }
}

/** Pack all allocated segments to low addresses; single free hole at end */
export function compact(state: ContiguousState): ContiguousState {
  if (state.mode === 'fixed') return state
  const allocated = state.blocks.filter((b) => b.kind === 'allocated')
  let cursor = 0
  const newBlocks: MemoryBlock[] = []
  for (const b of normalizeBlocks(allocated)) {
    newBlocks.push({ ...b, start: cursor })
    cursor += b.size
  }
  const freeSize = state.totalSize - cursor
  if (freeSize > 0) {
    newBlocks.push({
      id: nextId(),
      start: cursor,
      size: freeSize,
      kind: 'free',
    })
  }
  return { ...state, blocks: newBlocks }
}

export function internalFragmentationUnits(state: ContiguousState): number {
  return state.blocks
    .filter((b) => b.kind === 'allocated' && b.used !== undefined)
    .reduce((sum, b) => sum + (b.size - (b.used ?? 0)), 0)
}

export function externalFragmentationUnits(state: ContiguousState): number {
  if (state.mode === 'fixed') {
    return state.blocks.filter((b) => b.kind === 'free').reduce((s, b) => s + b.size, 0)
  }
  const holes = state.blocks.filter((b) => b.kind === 'free')
  if (holes.length <= 1) return 0
  return holes.reduce((s, h) => s + h.size, 0)
}
