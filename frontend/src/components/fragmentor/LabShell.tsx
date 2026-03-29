'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { getPhaseById, phaseList, PhaseNav, type PhaseId } from './PhaseNav'
import { Phase0 } from './phases/Phase0'
import { Phase1 } from './phases/Phase1'
import { Phase2 } from './phases/Phase2'
import { Phase3 } from './phases/Phase3'
import { Phase4 } from './phases/Phase4'
import { Phase5 } from './phases/Phase5'
import { Phase6 } from './phases/Phase6'

function PhaseContent({ phase }: { phase: PhaseId }) {
  switch (phase) {
    case 0:
      return <Phase0 />
    case 1:
      return <Phase1 />
    case 2:
      return <Phase2 />
    case 3:
      return <Phase3 />
    case 4:
      return <Phase4 />
    case 5:
      return <Phase5 />
    case 6:
      return <Phase6 />
    default:
      return null
  }
}

export function LabShell() {
  const [phase, setPhase] = useState<PhaseId>(0)
  const phases = phaseList()
  const current = getPhaseById(phase)
  const phaseIndex = phase
  const lastIndex = phases.length - 1
  const progressPercent = Math.round((phaseIndex / lastIndex) * 100)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-500/20 ring-1 ring-white/10">
              <Layers className="h-5 w-5 text-cyan-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">The Fragmentor</h1>
              <p className="text-xs text-zinc-500 sm:text-sm">Memory lab — step through each topic, then take the quiz</p>
            </div>
          </div>
          <div className="w-full max-w-xs sm:w-56">
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
              <span>
                Step {phaseIndex + 1}/{phases.length}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">
          <aside className="w-full shrink-0 lg:w-[min(100%,15rem)] lg:max-w-[15rem]">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Syllabus</p>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/35 p-2 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <PhaseNav active={phase} onChange={setPhase} />
            </div>
            <p className="mt-3 hidden text-[11px] leading-relaxed text-zinc-600 lg:block">
              Now: <span className="text-zinc-400">{current.fullName}</span>
            </p>
          </aside>

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <PhaseContent phase={phase} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
