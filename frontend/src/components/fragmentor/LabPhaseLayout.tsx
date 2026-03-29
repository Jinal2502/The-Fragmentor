'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, FlaskConical, Eye, Lightbulb, Target } from 'lucide-react'

const sectionIcon = {
  concept: BookOpen,
  simulation: FlaskConical,
  visual: Eye,
  observations: Lightbulb,
} as const

const sectionTitle = {
  concept: 'Concept',
  simulation: 'Try it',
  visual: 'Visual',
  observations: 'Takeaway',
} as const

export function LabPhaseLayout({
  phaseLabel,
  title,
  focus,
  concept,
  simulation,
  visual,
  observations,
  footnote,
}: {
  phaseLabel: string
  title: string
  focus: string
  concept: ReactNode
  simulation: ReactNode
  visual: ReactNode
  observations: ReactNode
  footnote?: string
}) {
  const sections = [
    { key: 'concept' as const, body: concept },
    { key: 'simulation' as const, body: simulation },
    { key: 'visual' as const, body: visual },
    { key: 'observations' as const, body: observations },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{phaseLabel}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{title}</h2>
        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.07] px-4 py-3 text-[15px] leading-relaxed text-cyan-50/95">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400/90" aria-hidden />
          <p>{focus}</p>
        </div>
      </header>

      <div className="space-y-6">
        {sections.map(({ key, body }, i) => {
          const Icon = sectionIcon[key]
          return (
            <motion.section
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-zinc-700/50 bg-zinc-900/35 p-5 sm:p-6"
            >
              <div className="mb-4 flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
                <Icon className="h-5 w-5 shrink-0 text-cyan-500" aria-hidden />
                <h3 className="text-base font-semibold text-zinc-200">{sectionTitle[key]}</h3>
              </div>
              <div className="text-[15px] leading-relaxed text-zinc-300 [&_p+p]:mt-3 [&_ul]:mt-2 [&_li]:my-1">{body}</div>
            </motion.section>
          )
        })}
      </div>

      {footnote ? (
        <p className="border-t border-zinc-800/80 pt-4 text-xs leading-relaxed text-zinc-500">{footnote}</p>
      ) : null}
    </div>
  )
}
