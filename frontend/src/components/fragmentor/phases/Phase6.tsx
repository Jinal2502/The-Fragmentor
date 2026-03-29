'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  FINAL_QUIZ_PASS_THRESHOLD,
  FINAL_QUIZ_QUESTIONS,
  FINAL_QUIZ_TOTAL,
  hasPassed,
  scoreQuiz,
} from '@/lib/memory/finalQuiz'
import { cn } from '@/lib/utils'

const labels = ['A', 'B', 'C', 'D'] as const

export function Phase6() {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array.from({ length: FINAL_QUIZ_TOTAL }, () => null)
  )
  const [submitted, setSubmitted] = useState(false)

  const score = submitted ? scoreQuiz(answers) : null
  const passed = score !== null ? hasPassed(score) : null
  const allAnswered = answers.every((a) => a !== null)

  function setAnswer(qIndex: number, optionIndex: number) {
    if (submitted) return
    setAnswers((prev) => {
      const next = [...prev]
      next[qIndex] = optionIndex
      return next
    })
  }

  function handleSubmit() {
    if (!allAnswered) return
    setSubmitted(true)
  }

  function handleRetry() {
    setAnswers(Array.from({ length: FINAL_QUIZ_TOTAL }, () => null))
    setSubmitted(false)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Phase 6 · Final test</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100">Memory management — MCQ</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {FINAL_QUIZ_TOTAL} questions. Pass if you answer at least{' '}
          <strong className="text-cyan-400">{FINAL_QUIZ_PASS_THRESHOLD}</strong> correctly.
        </p>
      </header>

      <div className="space-y-6">
        {FINAL_QUIZ_QUESTIONS.map((q, qIndex) => (
          <motion.section
            key={q.id}
            layout
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5"
          >
            <p className="text-sm font-medium text-zinc-200">
              {qIndex + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oIndex) => {
                const selected = answers[qIndex] === oIndex
                const showResult = submitted
                const isCorrect = oIndex === q.correctIndex
                return (
                  <button
                    key={oIndex}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswer(qIndex, oIndex)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                      !submitted && selected && 'border-cyan-500/50 bg-cyan-500/10 text-zinc-100',
                      !submitted && !selected && 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700',
                      showResult &&
                        isCorrect &&
                        'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
                      showResult &&
                        selected &&
                        !isCorrect &&
                        'border-rose-500/50 bg-rose-500/10 text-rose-300'
                    )}
                  >
                    <span className="font-mono text-xs text-zinc-500">{labels[oIndex]})</span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
            {submitted ? (
              <p className="mt-3 border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">{q.explanation}</p>
            ) : null}
          </motion.section>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors',
              allAnswered ? 'bg-cyan-600 hover:bg-cyan-500' : 'cursor-not-allowed bg-zinc-700 text-zinc-400'
            )}
          >
            Submit and evaluate
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            Retake test
          </button>
        )}
        {!allAnswered && !submitted ? (
          <span className="text-xs text-zinc-500">Answer all questions to submit.</span>
        ) : null}
      </div>

      {submitted && score !== null && passed !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl border p-6',
            passed
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-rose-500/40 bg-rose-500/10'
          )}
        >
          <div className="flex items-start gap-3">
            {passed ? (
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-400" aria-hidden />
            ) : (
              <XCircle className="h-8 w-8 shrink-0 text-rose-400" aria-hidden />
            )}
            <div>
              <p className={cn('text-lg font-semibold', passed ? 'text-emerald-200' : 'text-rose-200')}>
                {passed ? 'Passed' : 'Not passed'}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                Score: <span className="font-mono font-semibold">{score}</span> / {FINAL_QUIZ_TOTAL} (need{' '}
                {FINAL_QUIZ_PASS_THRESHOLD}+ to pass)
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {passed
                  ? 'You have demonstrated core understanding of memory management concepts.'
                  : 'Review the explanations above and retake the test when ready.'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
