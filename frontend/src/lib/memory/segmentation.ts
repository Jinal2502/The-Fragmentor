export type SegmentKind = 'code' | 'data' | 'stack'

export interface SegmentDescriptor {
  id: string
  name: string
  kind: SegmentKind
  /** Logical size in lab units */
  limit: number
  base: number
  /** Whether resident in physical memory */
  loaded: boolean
}

export interface SegmentationState {
  physicalWindowSize: number
  segments: SegmentDescriptor[]
  /** Optional overlay module (second code chunk) */
  overlayCodeSize: number
  overlayLoaded: boolean
}

export function initialSegmentationState(): SegmentationState {
  return {
    physicalWindowSize: 48,
    segments: [
      { id: 'seg-code', name: 'Code (main)', kind: 'code', limit: 16, base: 0, loaded: true },
      { id: 'seg-data', name: 'Data', kind: 'data', limit: 12, base: 16, loaded: true },
      { id: 'seg-stack', name: 'Stack', kind: 'stack', limit: 10, base: 28, loaded: true },
    ],
    overlayCodeSize: 14,
    overlayLoaded: false,
  }
}

export function totalResidentSize(state: SegmentationState): number {
  const base = state.segments.filter((s) => s.loaded).reduce((s, x) => s + x.limit, 0)
  const overlay = state.overlayLoaded ? state.overlayCodeSize : 0
  return base + overlay
}

export function fitsPhysical(state: SegmentationState): boolean {
  return totalResidentSize(state) <= state.physicalWindowSize
}

export function toggleOverlay(state: SegmentationState): SegmentationState {
  return { ...state, overlayLoaded: !state.overlayLoaded }
}
