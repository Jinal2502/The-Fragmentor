'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LabPhaseLayout } from '../LabPhaseLayout'
import { cn } from '@/lib/utils'

type PageEntry = {
  pageNo: number
  frameNo: number | null
  present: boolean
  read: boolean
  write: boolean
  execute: boolean
  reference: boolean
  cached: boolean
  dirty: boolean
}

function buildPageEntries(pageCount: number): PageEntry[] {
  return Array.from({ length: pageCount }, (_, i) => ({
    pageNo: i,
    frameNo: null,
    present: false,
    read: true,
    write: true,
    execute: false,
    reference: false,
    cached: true,
    dirty: false,
  }))
}

export function Phase3() {
  const [pageCount, setPageCount] = useState(4)
  const [frameCount, setFrameCount] = useState(8)
  const [selectedPage, setSelectedPage] = useState(0)
  const [selectedFrame, setSelectedFrame] = useState(0)
  const [entries, setEntries] = useState<PageEntry[]>(() => buildPageEntries(4))
  const [frames, setFrames] = useState<(number | null)[]>(() => Array.from({ length: 8 }, () => null))
  const [message, setMessage] = useState('Set pages and frames, then map a page to a frame.')

  function resetLayout(nextPageCount: number, nextFrameCount: number) {
    setPageCount(nextPageCount)
    setFrameCount(nextFrameCount)
    setEntries(buildPageEntries(nextPageCount))
    setFrames(Array.from({ length: nextFrameCount }, () => null))
    setSelectedPage(0)
    setSelectedFrame(0)
    setMessage('Layout reset: map pages of P1 into RAM frames.')
  }

  const selected = entries[selectedPage]
  const mappedCount = entries.filter((e) => e.present).length
  const freeFrames = frames.filter((x) => x === null).length

  function mapSelectedPage() {
    if (selectedPage >= entries.length || selectedFrame >= frames.length) return

    const nextEntries = entries.map((e) => ({ ...e }))
    const nextFrames = [...frames]

    const oldFrameOfPage = nextFrames.findIndex((p) => p === selectedPage)
    if (oldFrameOfPage !== -1) nextFrames[oldFrameOfPage] = null

    const existingPageInTarget = nextFrames[selectedFrame]
    if (existingPageInTarget !== null) {
      nextEntries[existingPageInTarget].frameNo = null
      nextEntries[existingPageInTarget].present = false
      nextEntries[existingPageInTarget].reference = false
    }

    nextFrames[selectedFrame] = selectedPage
    nextEntries[selectedPage].frameNo = selectedFrame
    nextEntries[selectedPage].present = true
    nextEntries[selectedPage].reference = true

    setFrames(nextFrames)
    setEntries(nextEntries)
    setMessage(`Mapped page ${selectedPage} to frame ${selectedFrame}.`)
  }

  function unmapSelectedPage() {
    const nextEntries = entries.map((e) => ({ ...e }))
    const nextFrames = [...frames]
    const frame = nextEntries[selectedPage]?.frameNo
    if (frame === null || frame === undefined) {
      setMessage(`Page ${selectedPage} is already absent.`)
      return
    }
    nextFrames[frame] = null
    nextEntries[selectedPage].frameNo = null
    nextEntries[selectedPage].present = false
    nextEntries[selectedPage].reference = false
    setFrames(nextFrames)
    setEntries(nextEntries)
    setMessage(`Unmapped page ${selectedPage} from frame ${frame}.`)
  }

  function toggleBit(
    key: 'read' | 'write' | 'execute' | 'reference' | 'cached' | 'dirty',
    value: boolean
  ) {
    setEntries((prev) =>
      prev.map((e, idx) => (idx === selectedPage ? { ...e, [key]: value } : e))
    )
  }

  const pageCards = useMemo(
    () =>
      entries.map((e) => (
        <motion.div
          key={e.pageNo}
          layout
          className={cn(
            'rounded-lg border p-2 text-xs',
            e.present ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-900/50'
          )}
        >
          <p className="font-mono text-zinc-200">P1-Page {e.pageNo}</p>
          <p className="text-zinc-500">{e.present ? `in Frame ${e.frameNo}` : 'absent'}</p>
        </motion.div>
      )),
    [entries]
  )

  return (
    <LabPhaseLayout
      phaseLabel="Phase 3"
      title="Paging visualizer: Process P1 → Pages, RAM → Frames"
      focus="Keep page size = frame size for simple and feasible one-to-one mapping."
      concept={
        <div className="space-y-3">
          <p>Single process <strong className="text-zinc-100">P1</strong> is divided into pages. RAM is divided into frames.</p>
          <p>
            We keep <strong className="text-zinc-100">size(page) = size(frame)</strong> so any page can fit exactly in any frame.
            This makes paging practical and address mapping simple.
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
            Rule used in this visualizer: one mapped page occupies one frame.
          </div>
        </div>
      }
      simulation={
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Pages in process P1
              <input
                type="number"
                min={1}
                max={16}
                value={pageCount}
                onChange={(e) => {
                  const nextPageCount = Math.max(1, Math.min(16, Number(e.target.value) || 1))
                  resetLayout(nextPageCount, frameCount)
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Frames in RAM
              <input
                type="number"
                min={1}
                max={20}
                value={frameCount}
                onChange={(e) => {
                  const nextFrameCount = Math.max(1, Math.min(20, Number(e.target.value) || 1))
                  resetLayout(pageCount, nextFrameCount)
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              />
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Select page
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              >
                {entries.map((e) => (
                  <option key={e.pageNo} value={e.pageNo}>
                    Page {e.pageNo}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Select frame
              <select
                value={selectedFrame}
                onChange={(e) => setSelectedFrame(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm"
              >
                {frames.map((_, i) => (
                  <option key={i} value={i}>
                    Frame {i}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={mapSelectedPage}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Add page to frame
            </button>
            <button
              onClick={unmapSelectedPage}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Remove selected page
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <SmallStat label="Mapped pages" value={`${mappedCount}/${pageCount}`} />
            <SmallStat label="Free frames" value={`${freeFrames}/${frameCount}`} />
            <SmallStat label="Page size" value="= frame size" />
            <SmallStat label="Selected entry" value={`P${selectedPage}`} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Selected page bits (optional but important)</p>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
              <BitToggle label="Read" checked={selected.read} onChange={(v) => toggleBit('read', v)} />
              <BitToggle label="Write" checked={selected.write} onChange={(v) => toggleBit('write', v)} />
              <BitToggle label="Execute" checked={selected.execute} onChange={(v) => toggleBit('execute', v)} />
              <BitToggle label="Reference" checked={selected.reference} onChange={(v) => toggleBit('reference', v)} />
              <BitToggle label="Caching" checked={selected.cached} onChange={(v) => toggleBit('cached', v)} />
              <BitToggle label="Dirty" checked={selected.dirty} onChange={(v) => toggleBit('dirty', v)} />
            </div>
          </div>
          <p className="text-xs text-cyan-300">{message}</p>
        </div>
      }
      visual={
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Process P1 pages</p>
              <div className="grid grid-cols-2 gap-2">{pageCards}</div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">RAM frames</p>
              <div className="grid grid-cols-2 gap-2">
                {frames.map((page, i) => (
                  <motion.div
                    key={i}
                    layout
                    className={cn(
                      'rounded-lg border p-2 text-xs',
                      page === null ? 'border-zinc-700 bg-zinc-900/50 text-zinc-500' : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    )}
                  >
                    <p className="font-mono">Frame {i}</p>
                    <p>{page === null ? 'empty' : `Page ${page}`}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <PageTable entries={entries} highlight={selectedPage} />

          <div className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400 md:grid-cols-2">
            <BitInfo name="Frame no. (mandatory)" desc="Which RAM frame currently stores this page." />
            <BitInfo name="Present / Absent" desc="1 means page is in RAM. 0 means page fault on access." />
            <BitInfo name="Protection (R/W/E)" desc="Permission bits: Read, Write, Execute." />
            <BitInfo name="Reference" desc="Set when page is accessed; useful for replacement policies." />
            <BitInfo name="Caching" desc="Hints whether page content can be cached." />
            <BitInfo name="Dirty" desc="1 means modified after load; must be written back before eviction." />
          </div>
        </div>
      }
      observations={
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>- Mapping a page sets present=1 and assigns frame number.</li>
          <li>- Unmapped page becomes absent and would cause page fault on use.</li>
          <li>- Equal page/frame size keeps mapping clean and feasible.</li>
        </ul>
      }
    />
  )
}

function PageTable({ entries, highlight }: { entries: PageEntry[]; highlight: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-2 py-2">Page</th>
            <th className="px-2 py-2">Frame</th>
            <th className="px-2 py-2">Present</th>
            <th className="px-2 py-2">R</th>
            <th className="px-2 py-2">W</th>
            <th className="px-2 py-2">E</th>
            <th className="px-2 py-2">Ref</th>
            <th className="px-2 py-2">Cache</th>
            <th className="px-2 py-2">Dirty</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.pageNo}
              className={cn(
                'border-t border-zinc-800/80',
                e.pageNo === highlight ? 'bg-cyan-500/10' : ''
              )}
            >
              <td className="px-2 py-1.5 font-mono text-zinc-200">{e.pageNo}</td>
              <td className="px-2 py-1.5 font-mono text-zinc-300">{e.frameNo ?? '—'}</td>
              <td className="px-2 py-1.5">{e.present ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.read ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.write ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.execute ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.reference ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.cached ? 1 : 0}</td>
              <td className="px-2 py-1.5">{e.dirty ? 1 : 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-zinc-200">{value}</p>
    </div>
  )
}

function BitInfo({ name, desc }: { name: string; desc: string }) {
  return (
    <div>
      <p className="font-semibold text-zinc-300">{name}</p>
      <p>{desc}</p>
    </div>
  )
}

function BitToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-cyan-500"
      />
      <span className="text-zinc-300">{label}</span>
    </label>
  )
}
