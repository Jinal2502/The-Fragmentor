'use client'

import { useMemo, useState } from 'react'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { buildInvertedComparison, lookupInverted } from '@/lib/memory/invertedPageTable'
import { cn } from '@/lib/utils'

export function Phase4() {
  const [view, setView] = useState<'before' | 'after'>('before')
  const [processCount, setProcessCount] = useState(100)
  const [pagesEach, setPagesEach] = useState(64)
  const [frames, setFrames] = useState(256)
  const [entriesPerFrame, setEntriesPerFrame] = useState(32)
  const [lookupPid, setLookupPid] = useState('P1')
  const [lookupPage, setLookupPage] = useState(1)

  const pids = useMemo(
    () => Array.from({ length: processCount }, (_, i) => `P${i + 1}`),
    [processCount]
  )

  const model = useMemo(
    () => buildInvertedComparison(pids, pagesEach, frames),
    [pids, pagesEach, frames]
  )

  const hit = lookupInverted(model.ipt, lookupPid, lookupPage)
  const normalTableFrames = Math.ceil(model.conventionalEntryCount / Math.max(1, entriesPerFrame))
  const invertedTableFrames = Math.ceil(model.invertedEntryCount / Math.max(1, entriesPerFrame))
  const normalLeftFrames = Math.max(0, frames - normalTableFrames)
  const invertedLeftFrames = Math.max(0, frames - invertedTableFrames)

  return (
    <LabPhaseLayout
      phaseLabel="Phase 4"
      title="Inverted Page Table: clean before vs after"
      focus="Problem: 100 processes means 100 page tables in RAM. Solution: use one global inverted page table."
      concept={
        <div className="space-y-3">
          <p><strong className="text-zinc-100">Normal paging issue:</strong> every process has its own page table, and those tables live in main memory (RAM).</p>
          <p>If we have 100 processes, we keep 100 page tables. RAM is limited, so table overhead itself consumes many frames.</p>
          <p><strong className="text-zinc-100">Inverted paging:</strong> keep one global table. Entry format: <span className="font-mono">(PID, Page#) → Frame#</span>.</p>
          <p>Result: far less memory consumed by page-table metadata.</p>
        </div>
      }
      simulation={
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-zinc-500">
            Processes
            <input
              type="range"
              min={10}
              max={300}
              value={processCount}
              onChange={(e) => setProcessCount(Number(e.target.value))}
              className="mt-1 block w-full accent-cyan-500"
            />
            <span className="text-zinc-400">{processCount}</span>
          </label>
          <label className="text-xs text-zinc-500">
            Pages per process
            <input
              type="number"
              min={1}
              max={512}
              value={pagesEach}
              onChange={(e) => setPagesEach(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500">
            RAM frames
            <input
              type="number"
              min={1}
              max={2048}
              value={frames}
              onChange={(e) => setFrames(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Entries per frame (table density model)
            <input
              type="number"
              min={1}
              max={256}
              value={entriesPerFrame}
              onChange={(e) => setEntriesPerFrame(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
            />
          </label>

          <div className="md:col-span-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('before')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs ring-1',
                view === 'before' ? 'bg-rose-500/15 text-rose-200 ring-rose-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
              )}
            >
              Before: normal paging mess
            </button>
            <button
              type="button"
              onClick={() => setView('after')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs ring-1',
                view === 'after' ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/40' : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
              )}
            >
              After: one global IPT
            </button>
          </div>

          <div className="md:col-span-4 flex flex-wrap gap-2">
            <input
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs"
              placeholder="PID (e.g. P1)"
              value={lookupPid}
              onChange={(e) => setLookupPid(e.target.value)}
            />
            <input
              type="number"
              className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs"
              value={lookupPage}
              onChange={(e) => setLookupPage(Number(e.target.value))}
            />
            <span className="text-xs text-zinc-500">
              Global IPT lookup: {hit ? `${lookupPid},page ${lookupPage} -> frame ${hit.frame}` : 'not mapped'}
            </span>
          </div>
        </div>
      }
      visual={
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Normal entries (all process tables)" value={model.conventionalEntryCount} />
            <Stat label="IPT entries (one global table)" value={model.invertedEntryCount} />
            <Stat label="Normal table frames used" value={normalTableFrames} accent="text-rose-300" />
            <Stat label="IPT table frames used" value={invertedTableFrames} accent="text-emerald-300" />
          </div>

          {view === 'before' ? (
            <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <p className="text-sm text-rose-200">
                <strong>Issue:</strong> {processCount} processes means {processCount} separate page tables in RAM.
                With limited RAM, table overhead eats frames that should hold actual process pages.
              </p>
              <RamBar
                totalFrames={frames}
                tableFrames={normalTableFrames}
                label="RAM usage with normal paging"
                tone="rose"
              />
              <div className="grid gap-2 md:grid-cols-5">
                {Array.from({ length: Math.min(processCount, 10) }, (_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-[11px]">
                    <p className="font-mono text-zinc-200">P{i + 1}</p>
                    <p className="text-zinc-500">Own page table</p>
                  </div>
                ))}
                {processCount > 10 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-[11px] text-zinc-500">
                    + {processCount - 10} more tables
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-zinc-500">
                Frames left for actual process pages: <span className="font-mono text-zinc-300">{normalLeftFrames}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-sm text-emerald-200">
                <strong>Inverted paging:</strong> one global page table for the whole system.
                Each row stores PID + Page Number + Frame Number.
              </p>
              <RamBar
                totalFrames={frames}
                tableFrames={invertedTableFrames}
                label="RAM usage with inverted paging"
                tone="emerald"
              />
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-2 py-2">Frame</th>
                      <th className="px-2 py-2">PID</th>
                      <th className="px-2 py-2">Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.ipt.slice(0, 20).map((row) => (
                      <tr key={row.frame} className="border-t border-zinc-800/80">
                        <td className="px-2 py-1.5 font-mono">{row.frame}</td>
                        <td className="px-2 py-1.5 font-mono">{row.pid}</td>
                        <td className="px-2 py-1.5 font-mono">{row.page}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-500">
                Frames left for process data pages: <span className="font-mono text-zinc-300">{invertedLeftFrames}</span>
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Entry savings</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{model.entriesSaved}</p>
              <p className="text-xs text-zinc-500">Estimated bytes saved: {model.bytesSavedEstimate} B</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Key takeaway</p>
              <p className="mt-1 text-sm text-zinc-300">
                RAM is limited. One global inverted table keeps more RAM available for actual process pages.
              </p>
            </div>
          </div>
        </div>
      }
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- Normal paging: many processes create many page tables in RAM.</li>
          <li>- Inverted paging: one global table cuts table overhead significantly.</li>
          <li>- Trade-off: lookup needs matching by (PID, page), usually with hashing support.</li>
        </ul>
      }
    />
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold text-zinc-100', accent)}>{value}</p>
    </div>
  )
}

function RamBar({
  totalFrames,
  tableFrames,
  label,
  tone,
}: {
  totalFrames: number
  tableFrames: number
  label: string
  tone: 'rose' | 'emerald'
}) {
  const safeTotal = Math.max(1, totalFrames)
  const consumed = Math.min(tableFrames, safeTotal)
  const percent = (consumed / safeTotal) * 100
  const barClass = tone === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span className="font-mono">{consumed}/{safeTotal} frames for tables</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div className={cn('h-full', barClass)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
