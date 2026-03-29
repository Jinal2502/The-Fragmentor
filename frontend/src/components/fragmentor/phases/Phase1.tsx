'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { memoryTheme } from '@/lib/memory/theme'
import { cn } from '@/lib/utils'

export function Phase1() {
  const [scenario, setScenario] = useState<'fixed' | 'variable'>('fixed')
  const [fixedStep, setFixedStep] = useState<0 | 1>(0)
  const [variableStep, setVariableStep] = useState<0 | 1 | 2>(0)

  return (
    <LabPhaseLayout
      phaseLabel="Phase 1"
      title="Contiguous allocation"
      focus="Both parts shown now: fixed partitioning example and variable partitioning with compaction."
      concept={
        <div className="space-y-3">
          <p><strong className="text-zinc-100">Fixed partitioning (static):</strong> memory is pre-divided into fixed-size partitions.</p>
          <ul className="space-y-1 text-zinc-400">
            <li>- Internal fragmentation: wasted memory inside allocated partition.</li>
            <li>- Process size limit: process must fit partition size.</li>
            <li>- Degree of multiprogramming limit: only one process per partition.</li>
            <li>- External fragmentation: total free space exists but not as one contiguous block.</li>
          </ul>
          <p><strong className="text-zinc-100">Variable partitioning</strong> improves first three, but external fragmentation can still happen; compaction solves it.</p>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScenario('fixed')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1',
                scenario === 'fixed' ? 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
              )}
            >
              Fixed partitioning
            </button>
            <button
              type="button"
              onClick={() => setScenario('variable')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1',
                scenario === 'variable' ? 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
              )}
            >
              Variable + compaction
            </button>
          </div>

          {scenario === 'fixed' ? (
            <>
              <div className="flex flex-wrap gap-2">
                <StepBtn active={fixedStep === 0} onClick={() => setFixedStep(0)} label="Step 1: Load 4 × 6MB" />
                <StepBtn active={fixedStep === 1} onClick={() => setFixedStep(1)} label="Step 2: Try P5 = 8MB" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                <MiniStat k="Partitions" v="4 × 8MB" />
                <MiniStat k="Processes loaded" v="4 × 6MB" />
                <MiniStat k="Internal waste" v="4 × 2MB = 8MB" />
                <MiniStat k="Requested now" v={fixedStep === 0 ? "—" : "8MB"} />
              </div>
              {fixedStep === 0 ? (
                <p className="text-xs text-cyan-300">Each process uses 6MB inside an 8MB partition, so 2MB in each partition is wasted (internal fragmentation).</p>
              ) : (
                <p className="text-xs text-rose-300">Allocation fails: even though total free = 8MB (2+2+2+2), it is not contiguous as one 8MB block.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <StepBtn active={variableStep === 0} onClick={() => setVariableStep(0)} label="Step 1: Fragmented holes" />
                <StepBtn active={variableStep === 1} onClick={() => setVariableStep(1)} label="Step 2: Apply compaction" />
                <StepBtn active={variableStep === 2} onClick={() => setVariableStep(2)} label="Step 3: Allocate P5=6MB" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                <MiniStat k="Total free before" v="3+2+3 = 8MB" />
                <MiniStat k="Largest hole before" v="3MB" />
                <MiniStat k="After compaction" v="single 8MB hole" />
                <MiniStat k="P5 request" v="6MB" />
              </div>
              {variableStep === 0 ? (
                <p className="text-xs text-rose-300">Before compaction: request 6MB fails because largest contiguous hole is only 3MB (external fragmentation).</p>
              ) : variableStep === 1 ? (
                <p className="text-xs text-cyan-300">After compaction: free holes merge into one contiguous 8MB block.</p>
              ) : (
                <p className="text-xs text-emerald-300">Now P5=6MB succeeds, 2MB free remains contiguous.</p>
              )}
            </>
          )}
        </div>
      }
      visual={scenario === 'fixed' ? <FixedMemory step={fixedStep} /> : <VariableMemory step={variableStep} />}
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- Fixed: internal fragmentation is visible as 2MB waste in each partition.</li>
          <li>- Variable: process size flexibility improves, but external fragmentation still appears.</li>
          <li>- Compaction solves external fragmentation by making scattered holes contiguous.</li>
        </ul>
      }
    />
  )
}

function StepBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1',
        active ? 'bg-violet-500/15 text-violet-200 ring-violet-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
      )}
    >
      {label}
    </button>
  )
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
      <p className="text-[10px] text-zinc-500">{k}</p>
      <p className="mt-0.5 font-mono text-zinc-200">{v}</p>
    </div>
  )
}

function FixedMemory({ step }: { step: 0 | 1 }) {
  const blocks = [
    { pid: 'P1', used: 6, hole: 2 },
    { pid: 'P2', used: 6, hole: 2 },
    { pid: 'P3', used: 6, hole: 2 },
    { pid: 'P4', used: 6, hole: 2 },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        {blocks.map((b) => (
          <motion.div key={b.pid} layout className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
            <div className="flex h-12">
              <div className="flex w-3/4 items-center justify-center text-xs font-mono text-emerald-300" style={{ background: 'rgba(16,185,129,0.18)' }}>
                {b.pid} 6MB used
              </div>
              <div className="flex w-1/4 items-center justify-center text-xs font-mono text-amber-300" style={{ background: 'rgba(245,158,11,0.2)' }}>
                2MB hole
              </div>
            </div>
            <p className="border-t border-zinc-800 px-2 py-1 text-[11px] text-zinc-500">Partition size = 8MB</p>
          </motion.div>
        ))}
      </div>

      {step === 1 ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          New request: <span className="font-mono">P5 = 8MB</span> <br />
          Available free space = <span className="font-mono">2+2+2+2 = 8MB</span>, but these are four separate non-contiguous holes. <br />
          <strong>Result: allocation fails.</strong>
        </div>
      ) : null}

      <div className="flex gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: memoryTheme.allocated.fill }} />Used by process</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: memoryTheme.internalFrag.fill }} />Wasted / hole part</span>
      </div>
    </div>
  )
}

type VariableBlock = { label: string; size: number; kind: 'alloc' | 'hole' }

function VariableMemory({ step }: { step: 0 | 1 | 2 }) {
  const total = 32

  const before: VariableBlock[] = [
    { label: 'P1 6', size: 6, kind: 'alloc' },
    { label: 'H3', size: 3, kind: 'hole' },
    { label: 'P2 7', size: 7, kind: 'alloc' },
    { label: 'H2', size: 2, kind: 'hole' },
    { label: 'P3 5', size: 5, kind: 'alloc' },
    { label: 'H3', size: 3, kind: 'hole' },
    { label: 'P4 6', size: 6, kind: 'alloc' },
  ]

  const compacted: VariableBlock[] = [
    { label: 'P1 6', size: 6, kind: 'alloc' },
    { label: 'P2 7', size: 7, kind: 'alloc' },
    { label: 'P3 5', size: 5, kind: 'alloc' },
    { label: 'P4 6', size: 6, kind: 'alloc' },
    { label: 'H8', size: 8, kind: 'hole' },
  ]

  const afterAlloc: VariableBlock[] = [
    { label: 'P1 6', size: 6, kind: 'alloc' },
    { label: 'P2 7', size: 7, kind: 'alloc' },
    { label: 'P3 5', size: 5, kind: 'alloc' },
    { label: 'P4 6', size: 6, kind: 'alloc' },
    { label: 'P5 6', size: 6, kind: 'alloc' },
    { label: 'H2', size: 2, kind: 'hole' },
  ]

  const blocks = step === 0 ? before : step === 1 ? compacted : afterAlloc

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
        <div className="flex h-14">
          {blocks.map((b, i) => (
            <motion.div
              key={`${b.label}-${i}`}
              layout
              className={cn(
                'flex items-center justify-center border-r border-zinc-900/80 text-[11px] font-mono',
                b.kind === 'alloc' ? 'text-emerald-300' : 'text-amber-300'
              )}
              style={{
                width: `${(b.size / total) * 100}%`,
                background: b.kind === 'alloc' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)',
              }}
            >
              {b.label}MB
            </motion.div>
          ))}
        </div>
      </div>

      {step === 0 ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          Request <span className="font-mono">P5 = 6MB</span> fails now: total free is 8MB but split as 3MB, 2MB, 3MB.
        </div>
      ) : step === 1 ? (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm text-cyan-200">
          Compaction done: holes merged to one contiguous 8MB block.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          Allocation success after compaction: P5 uses 6MB, remaining free hole = 2MB.
        </div>
      )}

      <div className="flex gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: memoryTheme.allocated.fill }} />Allocated</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: memoryTheme.externalFrag.fill }} />Free holes</span>
      </div>
    </div>
  )
}
