export type AllocationStrategy = 'first-fit' | 'next-fit' | 'best-fit' | 'worst-fit'

export interface FreeHole {
  start: number
  size: number
}

export interface StrategyStep {
  index: number
  strategy: AllocationStrategy
  request: { pid: string; size: number }
  chosenHole: FreeHole | null
  freeHolesBefore: FreeHole[]
  freeHolesAfter: FreeHole[]
  message: string
}

export interface StrategySimulatorState {
  totalSize: number
  freeHoles: FreeHole[]
  allocations: { pid: string; start: number; size: number }[]
  nextFitCursor: number
  stepIndex: number
  history: StrategyStep[]
}

function cloneHoles(h: FreeHole[]): FreeHole[] {
  return h.map((x) => ({ ...x }))
}

function sortHoles(holes: FreeHole[]): FreeHole[] {
  return [...holes].sort((a, b) => a.start - b.start)
}

export function createStrategyState(totalSize: number): StrategySimulatorState {
  return {
    totalSize,
    freeHoles: [{ start: 0, size: totalSize }],
    allocations: [],
    nextFitCursor: 0,
    stepIndex: 0,
    history: [],
  }
}

function insertHole(holes: FreeHole[], hole: FreeHole): FreeHole[] {
  return sortHoles([...holes.filter((h) => !(h.start === hole.start && h.size === hole.size)), hole])
}

/**
 * Pick hole for strategy. `holes` should be sorted by start.
 */
export function pickHole(
  holes: FreeHole[],
  size: number,
  strategy: AllocationStrategy,
  nextFitCursor: number
): { hole: FreeHole | null; message: string } {
  const fits = holes.filter((h) => h.size >= size).sort((a, b) => a.start - b.start)
  if (fits.length === 0) return { hole: null, message: 'No hole fits this request' }

  switch (strategy) {
    case 'first-fit': {
      const h = fits[0]
      return {
        hole: h,
        message: `First fit: first hole at start ${h.start} (size ${h.size})`,
      }
    }
    case 'next-fit': {
      const after = fits.filter((h) => h.start >= nextFitCursor)
      const h = after.length > 0 ? after[0] : fits[0]
      return {
        hole: h,
        message: `Next fit: chose hole at ${h.start} (wraps if none after cursor ${nextFitCursor})`,
      }
    }
    case 'best-fit': {
      const sorted = [...fits].sort((a, b) => a.size - b.size || a.start - b.start)
      const h = sorted[0]
      return {
        hole: h,
        message: `Best fit: smallest sufficient hole (size ${h.size}) — may leave tiny unusable slivers`,
      }
    }
    case 'worst-fit': {
      const sorted = [...fits].sort((a, b) => b.size - a.size || a.start - b.start)
      const h = sorted[0]
      return {
        hole: h,
        message: `Worst fit: largest hole (size ${h.size}) — leftover space often still allocatable`,
      }
    }
  }
}

export function allocateOne(
  state: StrategySimulatorState,
  pid: string,
  size: number,
  strategy: AllocationStrategy
): { state: StrategySimulatorState; step: StrategyStep } {
  const holesBefore = cloneHoles(state.freeHoles)
  const sorted = sortHoles(state.freeHoles)
  const { hole, message } = pickHole(sorted, size, strategy, state.nextFitCursor)

  if (!hole) {
    const step: StrategyStep = {
      index: state.stepIndex,
      strategy,
      request: { pid, size },
      chosenHole: null,
      freeHolesBefore: holesBefore,
      freeHolesAfter: cloneHoles(state.freeHoles),
      message,
    }
    return {
      state: {
        ...state,
        stepIndex: state.stepIndex + 1,
        history: [...state.history, step],
      },
      step,
    }
  }

  const remaining = hole.size - size
  const newHoles = state.freeHoles.filter((h) => !(h.start === hole.start && h.size === hole.size))
  let merged = newHoles
  if (remaining > 0) {
    merged = insertHole(merged, { start: hole.start + size, size: remaining })
  }
  const newAlloc = { pid, start: hole.start, size }
  const newAllocs = [...state.allocations, newAlloc]
  const nextCursor = hole.start + size

  const step: StrategyStep = {
    index: state.stepIndex,
    strategy,
    request: { pid, size },
    chosenHole: { ...hole },
    freeHolesBefore: holesBefore,
    freeHolesAfter: cloneHoles(merged),
    message,
  }

  return {
    state: {
      totalSize: state.totalSize,
      freeHoles: sortHoles(merged),
      allocations: newAllocs,
      nextFitCursor: strategy === 'next-fit' ? nextCursor : state.nextFitCursor,
      stepIndex: state.stepIndex + 1,
      history: [...state.history, step],
    },
    step,
  }
}

export function resetStrategy(totalSize: number): StrategySimulatorState {
  return createStrategyState(totalSize)
}
