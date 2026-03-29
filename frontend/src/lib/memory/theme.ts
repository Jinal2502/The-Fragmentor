/**
 * Semantic colors for memory lab visuals (Tailwind class fragments + hex for charts/SVG).
 */
export const memoryTheme = {
  allocated: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    fill: '#10b981',
  },
  free: {
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40',
    text: 'text-slate-400',
    fill: '#64748b',
  },
  internalFrag: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    fill: '#f59e0b',
  },
  externalFrag: {
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    fill: '#f97316',
  },
  pageFault: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/50',
    text: 'text-rose-400',
    fill: '#f43f5e',
  },
  thrashing: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/40',
    text: 'text-violet-400',
    fill: '#8b5cf6',
  },
  present: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    fill: '#06b6d4',
  },
  absent: {
    bg: 'bg-zinc-700/40',
    border: 'border-zinc-600',
    text: 'text-zinc-500',
    fill: '#52525b',
  },
  cpu: { fill: '#38bdf8' },
  cache: { fill: '#a78bfa' },
  ram: { fill: '#34d399' },
  disk: { fill: '#fb923c' },
  mmu: { fill: '#f472b6' },
} as const
