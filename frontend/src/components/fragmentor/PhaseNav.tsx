'use client'

import { cn } from '@/lib/utils'

export type PhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Full phase titles as shown in the syllabus (no abbreviations). */
const PHASES: { id: PhaseId; fullName: string }[] = [
  { id: 0, fullName: 'Memory hierarchy and access costs' },
  { id: 1, fullName: 'Contiguous memory: fixed and variable partitions' },
  { id: 2, fullName: 'Placement strategies: first, next, best, and worst fit' },
  { id: 3, fullName: 'Paging, MMU, and page tables' },
  { id: 4, fullName: 'Inverted page table' },
  { id: 5, fullName: 'Thrashing and multiprogramming' },
  { id: 6, fullName: 'Final quiz (eight multiple-choice questions)' },
]

export function phaseList() {
  return PHASES
}

export function getPhaseById(id: PhaseId) {
  return PHASES.find((p) => p.id === id) ?? PHASES[0]
}

export function PhaseNav({
  active,
  onChange,
}: {
  active: PhaseId
  onChange: (p: PhaseId) => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Lab syllabus">
      {PHASES.map((p) => {
        const isActive = active === p.id
        return (
          <button
            key={p.id}
            type="button"
            title={p.fullName}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(p.id)}
            className={cn(
              'w-full rounded-lg px-2.5 py-2 text-left transition-colors',
              isActive
                ? 'bg-cyan-600/90 text-white shadow-sm shadow-cyan-950/40 ring-1 ring-cyan-400/25'
                : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
            )}
          >
            <span
              className={cn(
                'mb-0.5 block font-mono text-[10px] tabular-nums',
                isActive ? 'text-cyan-100/80' : 'text-zinc-600'
              )}
            >
              Phase {p.id}
            </span>
            <span className="block text-[12px] font-medium leading-snug sm:text-[13px]">{p.fullName}</span>
          </button>
        )
      })}
    </nav>
  )
}
