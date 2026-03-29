'use client'

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { buildThrashingCurve, isThrashingWarning } from '@/lib/memory/thrashing'
import { memoryTheme } from '@/lib/memory/theme'

export function Phase5() {
  const [maxDegree, setMaxDegree] = useState(40)
  const [workingSetPages, setWorkingSetPages] = useState(1)
  const [memoryFrames, setMemoryFrames] = useState(20)

  const model = useMemo(
    () => buildThrashingCurve(maxDegree, workingSetPages, memoryFrames),
    [maxDegree, workingSetPages, memoryFrames]
  )

  const chartData = model.points.map((p) => ({
    degree: p.degree,
    cpu: p.cpuUtilization,
    faults: p.pageFaultsPerSec,
  }))

  const warnPoint = model.points.find((p) => isThrashingWarning(p))
  const peakPoint = model.points.find((p) => p.degree === model.peakDegree) ?? model.points[0]

  return (
    <LabPhaseLayout
      phaseLabel="Phase 5"
      title="Thrashing: CPU utilization vs degree of multiprogramming"
      focus="Rise to optimal throughput, then collapse when paging dominates — same shape as the textbook graph."
      concept={
        <div className="space-y-3 text-zinc-300">
          <p>
            Imagine <strong className="text-zinc-100">N processes</strong>, each with its own page table in RAM. Initially each process
            keeps <strong className="text-zinc-100">one page</strong> resident (e.g. page 1). Degree of multiprogramming is high and the CPU
            stays busy — utilization <strong className="text-zinc-100">rises</strong> (increasing throughput).
          </p>
          <p>
            <strong className="text-zinc-100">Worst case:</strong> every process suddenly needs <strong className="text-zinc-100">another page</strong>{' '}
            (e.g. page 2). Total demand doubles while RAM is limited. The OS spends most time resolving page faults and swapping —{' '}
            <strong className="text-zinc-100">CPU utilization collapses</strong>. That downward region is{' '}
            <strong className="text-zinc-100">thrashing</strong>.
          </p>
          <p className="text-xs text-zinc-500">
            The curve below uses a simple model: demand = (degree × pages per process) vs fixed frames F. When demand &gt; F, thrashing dominates.
          </p>
        </div>
      }
      simulation={
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-zinc-500">
            Max degree on graph (x-axis)
            <input
              type="range"
              min={10}
              max={80}
              value={maxDegree}
              onChange={(e) => setMaxDegree(Number(e.target.value))}
              className="mt-1 block w-full accent-cyan-500"
            />
            <span className="text-zinc-400">{maxDegree}</span>
          </label>
          <label className="text-xs text-zinc-500">
            Working-set pages per process (1 = only P1 in RAM; 2 = P1+P2 needed → stricter limit)
            <input
              type="number"
              min={1}
              max={4}
              value={workingSetPages}
              onChange={(e) => setWorkingSetPages(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500">
            RAM frames (F)
            <input
              type="number"
              min={1}
              max={200}
              value={memoryFrames}
              onChange={(e) => setMemoryFrames(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <p className="md:col-span-3 text-xs text-zinc-500">
            Critical degree ≈ <span className="font-mono text-zinc-300">⌊F ÷ pages per process⌋</span> ={' '}
            <span className="font-mono text-cyan-300">{model.peakDegree}</span>
            {model.thrashingRange
              ? ' (beyond this, demand exceeds frames → thrashing on the graph).'
              : ' (raise max degree above this to see thrashing on the graph).'}{' '}
            <span className="text-zinc-600">|</span> F = {model.frames}
          </p>
        </div>
      }
      visual={
        <div className="space-y-4">
          {warnPoint ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              System is Thrashing — high fault pressure near degree {warnPoint.degree} (CPU {warnPoint.cpuUtilization}%, faults{' '}
              {warnPoint.pageFaultsPerSec}/s).
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
              Shaded region: thrashing zone (CPU drops while page faults spike).
            </div>
          )}
          <div className="h-80 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="degree"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  label={{ value: 'Degree of multiprogramming', position: 'insideBottom', offset: -2, fill: '#71717a', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  domain={[0, 100]}
                  label={{ value: 'CPU utilization %', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  label={{ value: 'Page faults / s (model)', angle: 90, position: 'insideRight', fill: '#71717a', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                  labelStyle={{ color: '#e4e4e7' }}
                />
                <Legend />
                {model.thrashingRange ? (
                  <ReferenceArea
                    x1={model.thrashingRange.from}
                    x2={model.thrashingRange.to}
                    yAxisId="left"
                    strokeOpacity={0}
                    fill={memoryTheme.thrashing.fill}
                    fillOpacity={0.14}
                    ifOverflow="extendDomain"
                  />
                ) : null}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cpu"
                  name="CPU utilization %"
                  stroke={memoryTheme.cpu.fill}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="faults"
                  name="Page faults / s"
                  stroke={memoryTheme.pageFault.fill}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 4"
                  isAnimationActive={false}
                />
                <ReferenceDot
                  yAxisId="left"
                  x={peakPoint.degree}
                  y={peakPoint.cpuUtilization}
                  r={5}
                  fill="#22d3ee"
                  stroke="#fff"
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200">
              Left rise ≈ increasing throughput
            </span>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              Peak ≈ optimal CPU ({peakPoint.cpuUtilization}% @ degree {peakPoint.degree})
            </span>
            <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-violet-200">
              Violet band = thrashing region
            </span>
          </div>
        </div>
      }
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- With one page per process, raising degree up to F keeps RAM sufficient and CPU utilization climbs.</li>
          <li>- When every process needs more pages than RAM can hold together, faults explode and CPU time is wasted on paging.</li>
          <li>- Set “pages per process” to 2 to mimic the “everyone now needs page 2” story — collapse happens earlier.</li>
        </ul>
      }
      footnote="Pedagogical model for the curve shape — not a hardware benchmark."
    />
  )
}
