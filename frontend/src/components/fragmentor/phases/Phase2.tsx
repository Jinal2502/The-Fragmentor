'use client'

import { useState } from 'react'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { memoryTheme } from '@/lib/memory/theme'
import { cn } from '@/lib/utils'

type FitType = 'first-fit' | 'next-fit' | 'best-fit' | 'worst-fit'
type PartitionState = 'hole' | 'occupied'

type Partition = {
  id: number
  sizeKb: number
  state: PartitionState
  pid?: string
  usedKb?: number
}

const FITS: FitType[] = ['first-fit', 'next-fit', 'best-fit', 'worst-fit']

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildInitialRam(): Partition[] {
  const parts: Partition[] = Array.from({ length: 20 }, (_, i) => {
    const sizeKb = randomInt(10, 25)
    const hole = Math.random() < 0.5
    return {
      id: i,
      sizeKb,
      state: hole ? 'hole' : 'occupied',
      pid: hole ? undefined : `SYS${i + 1}`,
      usedKb: hole ? undefined : sizeKb,
    }
  })

  // Ensure there are at least a few holes
  const holes = parts.filter((p) => p.state === 'hole').length
  if (holes < 4) {
    for (let i = 0; i < 4; i++) {
      parts[i].state = 'hole'
      parts[i].pid = undefined
      parts[i].usedKb = undefined
    }
  }
  return parts
}

function choosePartitionIndex(
  partitions: Partition[],
  reqKb: number,
  fit: FitType,
  nextCursor: number
): number {
  const candidates = partitions
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.state === 'hole' && p.sizeKb >= reqKb)

  if (candidates.length === 0) return -1

  if (fit === 'first-fit') return candidates[0].idx

  if (fit === 'next-fit') {
    const ordered = [...candidates].sort((a, b) => a.idx - b.idx)
    const afterCursor = ordered.find((x) => x.idx >= nextCursor)
    return (afterCursor ?? ordered[0]).idx
  }

  if (fit === 'best-fit') {
    candidates.sort((a, b) => a.p.sizeKb - b.p.sizeKb || a.idx - b.idx)
    return candidates[0].idx
  }

  // worst-fit
  candidates.sort((a, b) => b.p.sizeKb - a.p.sizeKb || a.idx - b.idx)
  return candidates[0].idx
}

export function Phase2() {
  const [fit, setFit] = useState<FitType>('first-fit')
  const [partitions, setPartitions] = useState<Partition[]>(() => buildInitialRam())
  const [pid, setPid] = useState('P1')
  const [sizeKb, setSizeKb] = useState(15)
  const [nextCursor, setNextCursor] = useState(0)
  const [message, setMessage] = useState('Enter process and size, select fit, then allocate.')

  function allocate() {
    const reqKb = Math.max(1, sizeKb)
    const idx = choosePartitionIndex(partitions, reqKb, fit, nextCursor)
    if (idx === -1) {
      setMessage(`Allocation failed: no hole can fit ${reqKb}KB`)
      return
    }

    const chosen = partitions[idx]
    const next = partitions.map((p, i) =>
      i === idx
        ? { ...p, state: 'occupied' as const, pid, usedKb: reqKb }
        : p
    )
    setPartitions(next)
    setMessage(
      `${fit} placed ${pid} (${reqKb}KB) in partition #${idx + 1} (${chosen.sizeKb}KB)`
    )
    if (fit === 'next-fit') {
      setNextCursor((idx + 1) % partitions.length)
    }
  }

  function resetRam() {
    setPartitions(buildInitialRam())
    setNextCursor(0)
    setMessage('RAM reset with random occupied partitions and holes.')
  }

  return (
    <LabPhaseLayout
      phaseLabel="Phase 2"
      title="Memory allocation strategies"
      focus="First fit, next fit, best fit, worst fit — and why worst fit can keep useful reusable holes."
      concept={
        <div className="space-y-3">
          <ul className="space-y-1 text-zinc-400">
            <li>- <strong className="text-zinc-200">First fit:</strong> first hole that works.</li>
            <li>- <strong className="text-zinc-200">Next fit:</strong> search starts from last allocation point.</li>
            <li>- <strong className="text-zinc-200">Best fit:</strong> smallest suitable hole (often creates tiny unusable pieces).</li>
            <li>- <strong className="text-zinc-200">Worst fit:</strong> largest hole, leaves larger reusable remainder.</li>
          </ul>
          <p>Why worst fit can be good: the leftover hole is often still big enough for future processes, unlike best fit leftovers.</p>
        </div>
      }
      simulation={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FITS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFit(s)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs capitalize ring-1',
                  fit === s ? 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
                )}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              placeholder="Process name (e.g. P1)"
            />
            <input
              type="number"
              min={1}
              value={sizeKb}
              onChange={(e) => setSizeKb(Number(e.target.value) || 1)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              placeholder="Size KB"
            />
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-xs text-zinc-400">
              Next-fit cursor: partition #{nextCursor + 1}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={allocate}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Allocate to RAM
            </button>
            <button
              type="button"
              onClick={resetRam}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Randomize RAM
            </button>
          </div>
          <p className="text-sm text-cyan-200/90">{message}</p>
          {fit === 'worst-fit' ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Notice: worst fit usually leaves medium/large holes, which can be reused by next requests.
            </p>
          ) : null}
        </div>
      }
      visual={<RamView partitions={partitions} />}
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- Same inputs, different strategy, different fragmentation result.</li>
          <li>- Best fit often increases tiny fragments over time.</li>
          <li>- Worst fit can maintain reusable holes better in many cases.</li>
        </ul>
      }
    />
  )
}

function RamView({ partitions }: { partitions: Partition[] }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-4">
        {partitions.map((p) => {
          const isHole = p.state === 'hole'
          const waste = !isHole ? p.sizeKb - (p.usedKb ?? 0) : 0
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-lg border p-2 text-xs',
                isHole ? memoryTheme.free.bg : memoryTheme.allocated.bg
              )}
            >
              <p className="font-mono text-zinc-300">#{p.id + 1} • {p.sizeKb}KB</p>
              {isHole ? (
                <p className="mt-1 text-zinc-500">HOLE</p>
              ) : (
                <>
                  <p className="mt-1 font-mono text-emerald-300">{p.pid}</p>
                  <p className="text-[11px] text-amber-300">used {p.usedKb}KB {waste > 0 ? `| waste ${waste}KB` : ''}</p>
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-zinc-500">
        RAM has 20 partitions. Each partition size is random between 10KB and 25KB.
      </p>
    </div>
  )
}
