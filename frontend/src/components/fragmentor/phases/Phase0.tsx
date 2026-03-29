'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { computeHierarchyMetrics, HIERARCHY_LEVELS } from '@/lib/memory/hierarchy'
import { memoryTheme } from '@/lib/memory/theme'

export function Phase0() {
  const [ramGb, setRamGb] = useState(8)
  const metrics = useMemo(() => computeHierarchyMetrics(ramGb), [ramGb])

  return (
    <LabPhaseLayout
      phaseLabel="Phase 0"
      title="Memory hierarchy and why RAM matters"
      focus="CPU can use registers, cache, and RAM directly. Disk is far slower, so increasing RAM improves CPU efficiency and multiprogramming."
      concept={
        <div className="space-y-3">
          <p>Plain view: CPU talks fast to Registers and Cache, then to RAM. Disk is not direct and is much slower.</p>
          <p>If RAM is small, the OS keeps waiting on disk. If RAM is bigger, more processes stay in memory and CPU spends less time idle.</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400">
            Chain: <span className="font-mono text-zinc-200">CPU → Cache → RAM → Disk</span>
          </div>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <label className="block text-sm text-zinc-400">
            RAM size: <span className="font-semibold text-cyan-300">{ramGb} GB</span>
            <input
              type="range"
              min={2}
              max={64}
              step={2}
              value={ramGb}
              onChange={(e) => setRamGb(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-500"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Metric title="CPU efficiency (model)" value={`${metrics.cpuUtilizationPercent}%`} />
            <Metric title="Degree of multiprogramming" value={`${metrics.multiprogrammingDegree}`} />
            <Metric title="Throughput score" value={`${metrics.effectiveThroughput}`} />
          </div>
        </div>
      }
      visual={
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            {HIERARCHY_LEVELS.map((level) => (
              <div key={level.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-xs text-zinc-500">{level.label}</p>
                <p className="mt-1 font-mono text-sm text-zinc-200">Latency units: {level.latency}</p>
              </div>
            ))}
          </div>
          <div className="relative h-9 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            <motion.div
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: memoryTheme.cpu.fill, boxShadow: `0 0 12px ${memoryTheme.cpu.fill}` }}
              initial={{ left: '2%' }}
              animate={{ left: '98%' }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
            />
            <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
              Request path animation (fast to slow memory levels)
            </p>
          </div>
        </div>
      }
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- Disk latency is huge compared to RAM.</li>
          <li>- Increasing RAM improves CPU usage and process concurrency.</li>
          <li>- This is a teaching model, not a hardware benchmark.</li>
        </ul>
      }
      footnote="Simplified simulation used for learning behavior."
    />
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
