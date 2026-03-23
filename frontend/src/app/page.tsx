'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Binary,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Activity,
  History,
  LayoutDashboard,
  Loader2,
  Settings,
  Hash,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  calculateCRC,
  calculateHamming,
  verifyCRC,
  verifyHamming,
  type AlgorithmStep,
  type HammingCheckResult,
} from '@/lib/algorithms'

// ─── Semantic bit coloring ────────────────────────────────────────────────────
function getBitColors(
  i: number,
  step: AlgorithmStep,
  bit: string,
  isHighlighted: boolean
): { bg: string; border: string; color: string } {
  // '?' = un-computed parity slot → always amber tint
  if (bit === '?') {
    return isHighlighted
      ? { bg: '#78350f', border: '#f59e0b', color: '#fff' }
      : { bg: '#1c1000', border: '#3d2000', color: '#d97706' }
  }

  const { phase, dataLength } = step
  const inCRCZone = dataLength !== undefined && i >= dataLength

  // Hamming PARITY step: distinguish the parity bit itself vs covered positions
  if (phase === 'PARITY' && isHighlighted) {
    const isParityBitCell = i === (step.highlight?.[0] ?? -1)
    return isParityBitCell
      ? { bg: '#3b0764', border: '#a855f7', color: '#fff' }  // purple = the parity bit
      : { bg: '#1e1b4b', border: '#6366f1', color: '#fff' }  // indigo = covered positions
  }

  if (isHighlighted) {
    if (phase === 'REMAINDER')
      return { bg: '#064e3b', border: '#10b981', color: '#fff' }
    if (phase === 'FINAL') {
      return inCRCZone
        ? { bg: '#064e3b', border: '#10b981', color: '#fff' }
        : { bg: '#3730a3', border: '#818cf8', color: '#fff' }
    }
    if (phase === 'SETUP' && inCRCZone)
      return { bg: '#78350f', border: '#f59e0b', color: '#fff' }
    if (phase === 'SETUP_H')
      return { bg: '#3730a3', border: '#818cf8', color: '#fff' }
    return { bg: '#4f46e5', border: '#818cf8', color: '#fff' }
  }

  // Non-highlighted
  if (inCRCZone) {
    if (phase === 'REMAINDER' || phase === 'FINAL')
      return { bg: '#022c22', border: '#065f46', color: '#34d399' }
    if (phase === 'SETUP')
      return { bg: '#1c1400', border: '#2d2000', color: '#d97706' }
  }
  return { bg: '#09090b', border: '#27272a', color: '#52525b' }
}

// ─── Phase badge style ────────────────────────────────────────────────────────
function phaseBadgeClass(phase: string) {
  switch (phase) {
    case 'XOR':        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
    case 'XOR_RESULT': return 'bg-violet-500/15 text-violet-400 border-violet-500/30'
    case 'SHIFT':      return 'bg-zinc-800 text-zinc-500 border-zinc-700'
    case 'SETUP':      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'SETUP_H':    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'REMAINDER':  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'FINAL':      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'PARITY':     return 'bg-violet-500/15 text-violet-400 border-violet-500/30'
    case 'DONE':       return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    default:           return 'bg-zinc-800 text-zinc-500 border-zinc-700'
  }
}

// ─── Hamming parameter helper ─────────────────────────────────────────────────
function hammingParams(k: number): { r: number; n: number } {
  if (k <= 0) return { r: 0, n: 0 }
  let r = 1
  while ((1 << r) < k + r + 1) r++
  return { r, n: k + r }
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<'dashboard' | 'simulation' | 'history' | 'settings'>('dashboard')
  const [inputData, setInputData] = useState('1011')
  const [generator, setGenerator] = useState('1101')
  const [method, setMethod] = useState<'CRC' | 'Hamming'>('CRC')
  const [errorInjection, setErrorInjection] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [autoRun, setAutoRun] = useState(false)
  const [autoNext, setAutoNext] = useState(false)
  const [vizSpeed, setVizSpeed] = useState(1.0)

  // ── Error Lab (Live Simulation view) ──────────────────────────────────────
  const [labCW, setLabCW] = useState('')
  const [labMethod, setLabMethod] = useState<'CRC' | 'Hamming'>('CRC')
  const [labGenerator, setLabGenerator] = useState('1101')
  const [labFlipped, setLabFlipped] = useState<Set<number>>(new Set())
  const [labResult, setLabResult] = useState<any>(null)

  const crcBits = Math.max(0, generator.length - 1)
  const { r: hR, n: hN } = hammingParams(inputData.length)

  const handleSimulate = async () => {
    if (!inputData) return
    if (method === 'CRC' && (generator.length < 2 || !generator.startsWith('1'))) return
    if (method === 'Hamming' && (inputData.length < 1 || inputData.length > 11)) return

    setIsLoading(true)
    setIsSimulating(false)
    setSimulationData(null)
    setCurrentStep(0)

    await new Promise(r => setTimeout(r, 500))

    try {
      let finalCode: string
      let steps: AlgorithmStep[]
      let remainder: string | null = null

      if (method === 'CRC') {
        const r = calculateCRC(inputData, generator)
        finalCode = r.finalCode
        steps = r.steps
        remainder = r.remainder
      } else {
        const r = calculateHamming(inputData)
        finalCode = r.finalCode
        steps = r.steps
      }

      const entry = {
        id: Date.now(),
        data: inputData,
        method,
        generator: method === 'CRC' ? generator : null,
        result: finalCode,
        remainder,
        time: new Date().toLocaleTimeString(),
      }

      setSimulationData({
        final_code: finalCode,
        remainder,
        steps,
        error_injected: errorInjection,
        method,
        generator: method === 'CRC' ? generator : null,
        is_valid: true,
        timestamp: new Date().toISOString(),
      })

      try {
        const stored = JSON.parse(localStorage.getItem('error_vis_history') || '[]')
        localStorage.setItem(
          'error_vis_history',
          JSON.stringify([entry, ...stored.slice(0, 9)])
        )
      } catch { /* ignore */ }

      setIsSimulating(true)
    } catch (err) {
      console.error('Simulation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoRun && inputData) {
      const t = setTimeout(handleSimulate, 500)
      return () => clearTimeout(t)
    }
  }, [inputData, method, errorInjection, generator])

  const steps = useMemo(() => simulationData?.steps ?? [], [simulationData])

  useEffect(() => {
    if (autoNext && isSimulating && steps.length > 0 && currentStep < steps.length - 1) {
      const t = setTimeout(() => setCurrentStep(s => s + 1), 2000 / vizSpeed)
      return () => clearTimeout(t)
    }
    if (autoNext && currentStep >= steps.length - 1) setAutoNext(false)
  }, [autoNext, isSimulating, currentStep, steps.length, vizSpeed])

  const step: AlgorithmStep | undefined = steps[currentStep]

  // Auto-populate lab when switching to simulation view
  useEffect(() => {
    if (view === 'simulation' && simulationData?.final_code) {
      setLabCW(simulationData.final_code)
      setLabMethod(simulationData.method ?? 'CRC')
      if (simulationData.generator) setLabGenerator(simulationData.generator)
      setLabFlipped(new Set())
      setLabResult(null)
    }
  }, [view])

  const flipLabBit = (i: number) => {
    const bits = labCW.split('')
    bits[i] = bits[i] === '0' ? '1' : '0'
    setLabCW(bits.join(''))
    setLabFlipped(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
    setLabResult(null)
  }

  const runLabCheck = () => {
    if (!labCW) return
    if (labMethod === 'CRC') {
      if (labCW.length < labGenerator.length) return
      setLabResult({ type: 'CRC', ...verifyCRC(labCW, labGenerator) })
    } else {
      setLabResult({ type: 'Hamming', ...verifyHamming(labCW) } as HammingCheckResult & { type: string })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-zinc-800/60 bg-[#0a0a0b]/85 backdrop-blur-xl z-50 flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Binary className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight leading-none">ErrorVis</h1>
              <p className="text-zinc-500 text-[11px] mt-0.5">CRC & Hamming Visualizer</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard"      active={view === 'dashboard'}  onClick={() => setView('dashboard')} />
            <NavItem icon={Activity}        label="Live Simulation" active={view === 'simulation'} onClick={() => setView('simulation')} />
            <NavItem icon={History}         label="History"         active={view === 'history'}    onClick={() => setView('history')} />
            <NavItem icon={Settings}        label="Settings"        active={view === 'settings'}   onClick={() => setView('settings')} />
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <div className={cn(
            "px-4 py-3 rounded-xl border text-center transition-all",
            isSimulating
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-zinc-900/50 border-zinc-800/50"
          )}>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Status</p>
            <p className={cn("text-xs font-bold", isSimulating ? "text-emerald-400" : "text-zinc-600")}>
              {isSimulating ? '● Ready' : '○ Idle'}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 p-8 relative z-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Visualizer Dashboard
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Real-time bit manipulation & error correction analysis</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setIsSimulating(false); setSimulationData(null) }}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900/80 transition-all text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-200"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={handleSimulate}
              disabled={isLoading || !inputData || (method === 'CRC' && (generator.length < 2 || !generator.startsWith('1')))}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 font-semibold min-w-[160px] justify-center text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isLoading ? 'Processing…' : 'Run Simulation'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* ═══════════════ DASHBOARD VIEW ═══════════════ */}
          {view === 'dashboard' ? (
            <>
              {/* Left column */}
              <section className="col-span-4 space-y-5">

                {/* Input Config */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                  <SectionLabel dot="bg-indigo-500" label="Input Config" />
                  <div className="space-y-4">
                    {/* Data input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                        Binary Data
                      </label>
                      <input
                        type="text"
                        value={inputData}
                        onChange={e => setInputData(e.target.value.replace(/[^01]/g, ''))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-mono text-lg tracking-widest text-indigo-300 placeholder:text-zinc-700"
                        placeholder="e.g. 1011"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1.5 flex gap-2 flex-wrap">
                        <span>{inputData.length} bits</span>
                        {method === 'Hamming' && inputData.length > 0 && (
                          <span className="text-zinc-500">→ Hamming({hN},{inputData.length})</span>
                        )}
                        {method === 'Hamming' && (inputData.length < 1 || inputData.length > 11) && (
                          <span className="text-amber-500">Use 1–11 data bits</span>
                        )}
                      </p>
                    </div>

                    {/* Generator (CRC only) */}
                    {method === 'CRC' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> Generator Polynomial
                        </label>
                        <input
                          type="text"
                          value={generator}
                          onChange={e => setGenerator(e.target.value.replace(/[^01]/g, ''))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all font-mono text-lg tracking-widest text-violet-300 placeholder:text-zinc-700"
                          placeholder="e.g. 1101"
                        />
                        <p className="text-[10px] mt-1.5 flex gap-2">
                          <span className="text-zinc-600">{generator.length} bits → appends {crcBits} zeros</span>
                          {generator.length > 0 && !generator.startsWith('1') && (
                            <span className="text-rose-500">must start with 1</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Method selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                        Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['CRC', 'Hamming'].map(m => (
                          <button
                            key={m}
                            onClick={() => setMethod(m as 'CRC' | 'Hamming')}
                            className={cn(
                              'py-2.5 rounded-xl border text-sm font-semibold transition-all',
                              method === m
                                ? 'bg-indigo-600/15 border-indigo-500/70 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error injection toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={cn('w-4 h-4', errorInjection ? 'text-amber-500' : 'text-zinc-600')} />
                        <span className="text-sm text-zinc-300">Inject Error</span>
                      </div>
                      <button
                        onClick={() => setErrorInjection(v => !v)}
                        className={cn('w-10 h-5 rounded-full relative transition-all', errorInjection ? 'bg-amber-500' : 'bg-zinc-800')}
                      >
                        <motion.div
                          animate={{ x: errorInjection ? 22 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis Stats */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                  <SectionLabel dot="bg-emerald-500" label="Analysis" />
                  <div className="space-y-3">
                    <StatItem label="Algorithm"  value={method} />
                    <StatItem label="Data Bits"  value={`${inputData.length}`} />
                    {method === 'CRC' ? (
                      <>
                        <StatItem label="Generator"      value={generator || '—'} mono />
                        <StatItem label="CRC Bits"       value={`${crcBits}`} />
                        <StatItem label="Encoded Length" value={`${inputData.length + crcBits} bits`} />
                        <StatItem
                          label="Overhead"
                          value={inputData.length > 0 && crcBits > 0
                            ? `${((crcBits / inputData.length) * 100).toFixed(0)}%`
                            : '—'}
                        />
                      </>
                    ) : (
                      <>
                        <StatItem label="Parity Bits"    value={inputData.length > 0 ? `${hR}` : '—'} />
                        <StatItem label="Encoded Length" value={inputData.length > 0 ? `${hN} bits` : '—'} />
                        <StatItem label="Code Rate"      value={inputData.length > 0 ? `${inputData.length}/${hN}` : '—'} />
                        <StatItem label="Error Correct"  value="1 bit" />
                        <StatItem label="Error Detect"   value="2 bits" />
                      </>
                    )}
                  </div>
                </div>

                {/* Generator presets (CRC only) */}
                {method === 'CRC' && (
                  <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                    <SectionLabel dot="bg-violet-500" label="Common Generators" />
                    <div className="space-y-1">
                      {[
                        { label: 'CRC-4   — 1101',     gen: '1101' },
                        { label: 'CRC-5   — 11001',    gen: '11001' },
                        { label: 'CRC-8   — 10000111', gen: '10000111' },
                      ].map(p => (
                        <button
                          key={p.gen}
                          onClick={() => setGenerator(p.gen)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono transition-all border',
                            generator === p.gen
                              ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                              : 'border-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Right column — Simulation viewer */}
              <section className="col-span-8 flex flex-col gap-5">

                {/* Step visualizer */}
                <div className="flex-1 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden min-h-[480px]">
                  {/* Status pill */}
                  <div className="absolute top-4 right-4">
                    <div className={cn(
                      'flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-full border',
                      isSimulating
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-600'
                    )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700')} />
                      {isSimulating ? `Step ${currentStep + 1} / ${steps.length}` : 'Awaiting Input'}
                    </div>
                  </div>

                  {!isSimulating ? (
                    <div className="h-full flex flex-col items-center justify-center text-center pt-8">
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4 opacity-30">
                        {isLoading
                          ? <Loader2 className="w-8 h-8 animate-spin" />
                          : <Cpu className="w-8 h-8" />
                        }
                      </div>
                      <p className="text-sm text-zinc-600 max-w-xs">
                        {isLoading
                          ? 'Running algorithm…'
                          : 'Configure input above and press "Run Simulation" to begin step-by-step visualization.'}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ duration: 0.2 }}
                            className="text-center w-full"
                          >
                            {/* Phase badge */}
                            <div className="flex items-center justify-center mb-3">
                              <span className={cn(
                                'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                                phaseBadgeClass(step?.phase ?? '')
                              )}>
                                {step?.phase?.replace('_', ' ') ?? '—'}
                              </span>
                            </div>

                            <h4 className="text-xl font-bold text-white mb-5">{step?.title}</h4>

                            {/* FINAL step: CRC data/CRC legend */}
                            {step?.phase === 'FINAL' && step?.dataLength !== undefined && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center gap-6 mb-4"
                              >
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                                  Data ({step.dataLength} bits)
                                </span>
                                <span className="w-px h-3 bg-zinc-700" />
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                                  CRC ({step.bits.length - step.dataLength} bits)
                                </span>
                              </motion.div>
                            )}

                            {/* FINAL step: Hamming P/D legend */}
                            {step?.phase === 'FINAL' && step?.positionLabels && !step?.dataLength && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center gap-6 mb-4"
                              >
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
                                  Parity ({step.positionLabels.filter(l => l.startsWith('P')).length} bits)
                                </span>
                                <span className="w-px h-3 bg-zinc-700" />
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                                  Data ({step.positionLabels.filter(l => l.startsWith('D')).length} bits)
                                </span>
                              </motion.div>
                            )}

                            {/* Main bit display */}
                            <div className="flex gap-2 justify-center flex-wrap max-w-3xl mx-auto px-4 mb-5">
                              {(step?.bits ?? '').split('').map((bit, i) => {
                                const highlighted = step?.highlight?.includes(i) ?? false
                                const colors = getBitColors(i, step!, bit, highlighted)
                                const isFirst = highlighted && i === (step?.highlight?.[0] ?? -1)
                                const label = step?.positionLabels?.[i]
                                const isPLabel = label?.startsWith('P')

                                return (
                                  <div key={`${currentStep}-${i}`} className="flex flex-col items-center gap-1">
                                    <motion.div
                                      initial={{ scale: 0.75, opacity: 0 }}
                                      animate={{
                                        scale: highlighted ? 1.18 : 1,
                                        opacity: 1,
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.color,
                                        y: highlighted ? -5 : 0,
                                        boxShadow: highlighted
                                          ? `0 8px 24px ${colors.border}50`
                                          : 'none',
                                      }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 22,
                                        delay: i * 0.015,
                                      }}
                                      style={{ width: 40, height: 52, borderWidth: 2 }}
                                      className="rounded-xl flex flex-col items-center justify-center font-mono font-bold relative"
                                    >
                                      {isFirst && step?.operation && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="absolute -top-6 text-[9px] font-bold bg-zinc-950 border border-indigo-500/40 px-2 py-0.5 rounded-full whitespace-nowrap text-indigo-400 z-10"
                                        >
                                          {step.operation}
                                        </motion.div>
                                      )}
                                      <span className="text-lg">{bit}</span>
                                      {!label && (
                                        <span className="text-[7px] opacity-20 font-mono absolute bottom-0.5">{i}</span>
                                      )}
                                    </motion.div>
                                    {/* Position label for Hamming */}
                                    {label && (
                                      <span className={cn(
                                        'text-[9px] font-mono font-bold leading-none transition-colors',
                                        highlighted
                                          ? (isPLabel ? 'text-violet-400' : 'text-indigo-400')
                                          : (isPLabel ? 'text-violet-600/50' : 'text-zinc-600')
                                      )}>
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* XOR Operation Panel */}
                            {step?.phase === 'XOR' && step.xorWindow && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-xs mx-auto mb-5 bg-zinc-950 border border-indigo-500/20 rounded-2xl p-5"
                              >
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 mb-4 text-center">
                                  ⊕ XOR Operation
                                </p>
                                <div className="space-y-2.5">
                                  {/* Window row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 text-[10px] text-zinc-500 font-mono text-right shrink-0">Window</span>
                                    <div className="flex gap-1">
                                      {step.xorWindow.split('').map((b, i) => (
                                        <div key={i} className="w-8 h-9 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center text-sm font-mono font-bold text-zinc-200">
                                          {b}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Generator row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 text-[10px] text-indigo-400 font-mono text-right shrink-0">⊕ Gen</span>
                                    <div className="flex gap-1">
                                      {step.xorGenerator!.split('').map((b, i) => (
                                        <div key={i} className="w-8 h-9 rounded-lg border border-indigo-700/60 bg-indigo-950 flex items-center justify-center text-sm font-mono font-bold text-indigo-300">
                                          {b}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="flex gap-1 pl-[76px]">
                                    {step.xorGenerator!.split('').map((_, i) => (
                                      <div key={i} className="w-8 h-px bg-zinc-600" />
                                    ))}
                                  </div>

                                  {/* Result row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 text-[10px] text-emerald-400 font-mono text-right shrink-0">= Result</span>
                                    <div className="flex gap-1">
                                      {step.xorResult!.split('').map((b, i) => (
                                        <div key={i} className="w-8 h-9 rounded-lg border border-emerald-700/60 bg-emerald-950 flex items-center justify-center text-sm font-mono font-bold text-emerald-300">
                                          {b}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Hamming Parity Computation Panel */}
                            {step?.phase === 'PARITY' && step.hammingParityInfo && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-md mx-auto mb-5 bg-zinc-950 border border-violet-500/20 rounded-2xl p-5"
                              >
                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60 mb-4 text-center">
                                  P{step.hammingParityInfo.parityBit} — Parity Computation
                                </p>

                                {/* XOR terms */}
                                <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                                  {step.hammingParityInfo.xorTerms.map((term, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-mono font-bold text-zinc-200 whitespace-nowrap">
                                        {term}
                                      </div>
                                      {idx < step.hammingParityInfo!.xorTerms.length - 1 && (
                                        <span className="text-zinc-500 font-bold">⊕</span>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Separator */}
                                <div className="flex items-center gap-3 justify-center mb-3">
                                  <div className="flex-1 h-px bg-zinc-800 max-w-[80px]" />
                                  <span className="text-[10px] text-violet-500/60 font-mono uppercase">P{step.hammingParityInfo.parityBit}</span>
                                  <div className="flex-1 h-px bg-zinc-800 max-w-[80px]" />
                                </div>

                                {/* Result */}
                                <div className="flex justify-center">
                                  <div className="w-14 h-14 rounded-2xl border-2 border-violet-600 bg-violet-950 flex items-center justify-center text-3xl font-mono font-bold text-violet-200">
                                    {step.hammingParityInfo.result}
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Description box */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-zinc-950/60 border border-zinc-800/70 p-4 rounded-xl max-w-lg mx-auto"
                            >
                              <div className="flex items-start gap-3 text-left">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0 mt-0.5">
                                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">{step?.description}</p>
                              </div>
                            </motion.div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Step navigation */}
                      <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-5">
                        <div className="flex gap-1 overflow-hidden max-w-[65%]">
                          {steps.map((_: AlgorithmStep, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentStep(idx)}
                              className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                idx === currentStep ? 'w-8 bg-indigo-500' : 'w-2',
                                idx < currentStep ? 'bg-indigo-800 hover:bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-600',
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(s => s - 1)}
                            className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <button
                            disabled={currentStep === steps.length - 1}
                            onClick={() => setCurrentStep(s => s + 1)}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result cards */}
                <div className={cn('grid gap-5', method === 'CRC' && simulationData ? 'grid-cols-3' : 'grid-cols-2')}>
                  <ResultCard
                    title="Status"
                    content={simulationData ? (simulationData.is_valid ? 'Valid' : 'Error') : 'Ready'}
                    icon={simulationData?.is_valid ? CheckCircle2 : (simulationData ? XCircle : Activity)}
                    color={simulationData ? (simulationData.is_valid ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-500'}
                  />
                  {method === 'CRC' && simulationData ? (
                    <>
                      <ResultCard
                        title="CRC Remainder"
                        content={simulationData.remainder ?? '—'}
                        icon={Hash}
                        color="text-violet-400"
                      />
                      <ResultCard
                        title="Codeword"
                        content={simulationData.final_code ?? '—'}
                        icon={Binary}
                        color="text-emerald-400"
                      />
                    </>
                  ) : (
                    <ResultCard
                      title="Integrity"
                      content={simulationData?.error_injected
                        ? (simulationData.method === 'Hamming' ? 'CORRECTED' : 'DETECTED')
                        : (simulationData ? 'VERIFIED' : '—')}
                      icon={Activity}
                      color="text-indigo-400"
                    />
                  )}
                </div>
              </section>
            </>

          /* ═══════════════ SIMULATION VIEW ═══════════════ */
          ) : view === 'simulation' ? (
            <section className="col-span-12">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <Activity className="w-5 h-5 text-rose-400" />
                  </div>
                  Error Detection & Correction Lab
                </h3>
                <p className="text-zinc-500 text-sm mt-1 ml-14">
                  Load a codeword, flip bits to simulate transmission errors, then run the check
                </p>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* ─ Left: Controls ─ */}
                <div className="col-span-4 space-y-5">
                  {/* Config card */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                    <SectionLabel dot="bg-rose-500" label="Lab Config" />
                    <div className="space-y-4">
                      {/* Method */}
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Algorithm</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['CRC', 'Hamming'] as const).map(m => (
                            <button key={m} onClick={() => { setLabMethod(m); setLabResult(null) }}
                              className={cn('py-2.5 rounded-xl border text-sm font-semibold transition-all',
                                labMethod === m
                                  ? 'bg-rose-600/15 border-rose-500/70 text-rose-300'
                                  : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
                              )}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Generator (CRC) */}
                      {labMethod === 'CRC' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> Generator
                          </label>
                          <input type="text" value={labGenerator}
                            onChange={e => { setLabGenerator(e.target.value.replace(/[^01]/g, '')); setLabResult(null) }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-mono text-base tracking-widest text-violet-300"
                            placeholder="e.g. 1101"
                          />
                        </div>
                      )}

                      {/* Codeword input */}
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Codeword</label>
                        <textarea
                          value={labCW}
                          onChange={e => { setLabCW(e.target.value.replace(/[^01]/g, '')); setLabFlipped(new Set()); setLabResult(null) }}
                          rows={2}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-mono text-base tracking-widest text-emerald-300 resize-none placeholder:text-zinc-700"
                          placeholder="Paste or type a binary codeword…"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">{labCW.length} bits</p>
                      </div>

                      {/* Load from dashboard */}
                      {simulationData?.final_code && (
                        <button
                          onClick={() => {
                            setLabCW(simulationData.final_code)
                            setLabMethod(simulationData.method ?? 'CRC')
                            if (simulationData.generator) setLabGenerator(simulationData.generator)
                            setLabFlipped(new Set())
                            setLabResult(null)
                          }}
                          className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-400 text-sm hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
                        >
                          <Binary className="w-4 h-4" />
                          Load from Dashboard ({simulationData.final_code.length} bits)
                        </button>
                      )}

                      {/* Run check */}
                      <button
                        onClick={runLabCheck}
                        disabled={!labCW || (labMethod === 'CRC' && labCW.length < labGenerator.length)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                      >
                        <Play className="w-4 h-4" /> Run Error Check
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  {labCW && (
                    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                      <SectionLabel dot="bg-zinc-500" label="Transmission Stats" />
                      <div className="space-y-3">
                        <StatItem label="Codeword Length" value={`${labCW.length} bits`} />
                        <StatItem label="Errors Injected"
                          value={labFlipped.size === 0 ? 'None' : `${labFlipped.size} bit${labFlipped.size > 1 ? 's' : ''}`}
                        />
                        {labFlipped.size > 0 && (
                          <StatItem label="At Positions"
                            value={[...labFlipped].sort((a,b)=>a-b).map(i => i+1).join(', ')}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─ Right: Bit flipper + Results ─ */}
                <div className="col-span-8 space-y-5">
                  {/* Interactive bit flipper */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h4 className="font-bold text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Bit Flipper
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Click any bit to simulate a transmission error</p>
                      </div>
                      {labFlipped.size > 0 && (
                        <button
                          onClick={() => {
                            // Restore original: re-flip all flipped bits
                            const bits = labCW.split('')
                            labFlipped.forEach(i => { bits[i] = bits[i] === '0' ? '1' : '0' })
                            setLabCW(bits.join(''))
                            setLabFlipped(new Set())
                            setLabResult(null)
                          }}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                    </div>

                    {labCW ? (
                      <div className="flex flex-wrap gap-2">
                        {labCW.split('').map((bit, i) => {
                          const isFlipped = labFlipped.has(i)
                          return (
                            <motion.button
                              key={i}
                              onClick={() => flipLabBit(i)}
                              whileTap={{ scale: 0.88 }}
                              animate={{
                                backgroundColor: isFlipped ? 'rgba(159,18,57,0.3)' : 'rgba(9,9,11,0.8)',
                                borderColor: isFlipped ? '#f43f5e' : '#3f3f46',
                                color: isFlipped ? '#fda4af' : '#a1a1aa',
                                boxShadow: isFlipped ? '0 0 16px rgba(244,63,94,0.35)' : 'none',
                                y: isFlipped ? -3 : 0,
                              }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              style={{ width: 44, height: 56, borderWidth: 2 }}
                              className="rounded-xl flex flex-col items-center justify-center font-mono font-bold relative"
                            >
                              {isFlipped && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute -top-5 text-[8px] font-bold text-rose-400 bg-zinc-950 border border-rose-500/30 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                >
                                  flipped
                                </motion.div>
                              )}
                              <span className="text-lg">{bit}</span>
                              <span className="text-[7px] opacity-30 font-mono absolute bottom-0.5">{i + 1}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-28 border-2 border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-600 text-sm">Load or type a codeword to begin</p>
                      </div>
                    )}
                  </div>

                  {/* Results panel */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md min-h-[200px]">
                    <SectionLabel dot={labResult ? (labResult.isValid ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-zinc-600'} label="Analysis Results" />

                    {!labResult ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
                          <Activity className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-zinc-500">Press "Run Error Check" to analyze the codeword</p>
                      </div>
                    ) : labResult.type === 'CRC' ? (
                      <AnimatePresence mode="wait">
                        <motion.div key="crc-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          {/* Verdict banner */}
                          <div className={cn(
                            'flex items-center gap-4 p-4 rounded-2xl border mb-6',
                            labResult.isValid
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-rose-500/5 border-rose-500/20'
                          )}>
                            {labResult.isValid
                              ? <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                              : <XCircle className="w-8 h-8 text-rose-400 shrink-0" />}
                            <div>
                              <p className={cn('text-lg font-bold', labResult.isValid ? 'text-emerald-400' : 'text-rose-400')}>
                                {labResult.isValid ? 'No Error Detected' : 'Error Detected!'}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {labResult.isValid
                                  ? 'CRC remainder is all zeros — codeword is intact.'
                                  : 'CRC remainder is non-zero — codeword has been corrupted. CRC cannot identify the exact bit.'}
                              </p>
                            </div>
                          </div>

                          {/* Remainder display */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                              Check Remainder ({labGenerator.length - 1} bits)
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                {labResult.remainder.split('').map((b: string, i: number) => (
                                  <div key={i}
                                    className={cn(
                                      'w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-mono font-bold',
                                      labResult.isValid
                                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                                        : 'bg-rose-950 border-rose-700 text-rose-300'
                                    )}>
                                    {b}
                                  </div>
                                ))}
                              </div>
                              <div className={cn('text-2xl font-bold', labResult.isValid ? 'text-emerald-400' : 'text-rose-400')}>
                                {labResult.isValid ? '= 0 ✓' : '≠ 0 ✗'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div key="hamming-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                          {/* Verdict banner */}
                          <div className={cn(
                            'flex items-center gap-4 p-4 rounded-2xl border',
                            labResult.isValid
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-rose-500/5 border-rose-500/20'
                          )}>
                            {labResult.isValid
                              ? <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                              : <XCircle className="w-8 h-8 text-rose-400 shrink-0" />}
                            <div>
                              <p className={cn('text-lg font-bold', labResult.isValid ? 'text-emerald-400' : 'text-rose-400')}>
                                {labResult.isValid ? 'No Error — Codeword Intact' : `Error at Bit ${labResult.errorPos} — Corrected!`}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {labResult.isValid
                                  ? 'All parity checks pass. Syndrome = 0.'
                                  : `Syndrome = ${labResult.syndromeStr} (${labResult.syndrome}) → bit ${labResult.errorPos} flipped. Hamming corrects it automatically.`}
                              </p>
                            </div>
                          </div>

                          {/* Parity check table */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Parity Checks</p>
                            <div className="space-y-2">
                              {labResult.parityChecks.map((chk: any) => (
                                <div key={chk.parityBit}
                                  className={cn(
                                    'flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm',
                                    chk.pass
                                      ? 'border-emerald-500/15 bg-emerald-500/5'
                                      : 'border-rose-500/20 bg-rose-500/5'
                                  )}>
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 font-mono font-bold text-violet-400">P{chk.parityBit}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      covers [{chk.coveredPositions.join(', ')}]
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={cn('font-mono font-bold text-sm', chk.pass ? 'text-emerald-400' : 'text-rose-400')}>
                                      XOR = {chk.xorValue}
                                    </span>
                                    {chk.pass
                                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      : <XCircle className="w-4 h-4 text-rose-500" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Syndrome + correction */}
                          {!labResult.isValid && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Syndrome</p>
                                <p className="font-mono text-lg font-bold text-rose-300">
                                  {labResult.syndromeStr}₂ = {labResult.syndrome}
                                </p>
                                <p className="text-[10px] text-zinc-600 mt-1">→ Error at bit position {labResult.errorPos}</p>
                              </div>
                              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/20">
                                <p className="text-[10px] text-emerald-600 uppercase font-bold mb-2">Corrected Codeword</p>
                                <p className="font-mono text-sm font-bold text-emerald-300 break-all leading-relaxed">
                                  {labResult.corrected.split('').map((b: string, i: number) => (
                                    <span key={i} className={i === labResult.errorPos - 1 ? 'text-emerald-300 underline decoration-emerald-500 underline-offset-2' : 'text-zinc-400'}>
                                      {b}
                                    </span>
                                  ))}
                                </p>
                                <p className="text-[10px] text-zinc-600 mt-1">bit {labResult.errorPos} auto-corrected ↑</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </section>

          /* ═══════════════ HISTORY VIEW ═══════════════ */
          ) : view === 'history' ? (
            <section className="col-span-12">
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <History className="w-5 h-5 text-indigo-400" /> Simulation History
                  </h3>
                  <button
                    onClick={() => { localStorage.removeItem('error_vis_history'); window.location.reload() }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-3">
                  {typeof window !== 'undefined' && (() => {
                    const items = JSON.parse(localStorage.getItem('error_vis_history') || '[]')
                    if (!items.length) return (
                      <div className="text-zinc-600 italic text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center">
                          <History className="w-5 h-5 text-zinc-700" />
                        </div>
                        No simulations recorded yet.
                      </div>
                    )
                    return items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between group hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-sm text-indigo-400">
                            {item.method[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold font-mono">
                              {item.data}
                              {item.generator && <span className="text-zinc-600 mx-1.5">÷ {item.generator}</span>}
                              <span className="text-zinc-600 mx-1.5">→</span>
                              {item.result}
                              {item.remainder && (
                                <span className="ml-2 text-[10px] font-medium text-emerald-500/70 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                  CRC: {item.remainder}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                              {item.method} • {item.time}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setInputData(item.data)
                            setMethod(item.method)
                            if (item.generator) setGenerator(item.generator)
                            setView('dashboard')
                          }}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Re-run
                        </button>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </section>

          /* ═══════════════ SETTINGS VIEW ═══════════════ */
          ) : (
            <section className="col-span-12">
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-zinc-800/80">
                    <Settings className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold">Preferences & Settings</h3>
                </div>

                <div className="space-y-0 max-w-2xl divide-y divide-zinc-800/50">
                  <SettingRow
                    title="Auto-run Simulation"
                    desc="Trigger encoding automatically when input changes"
                  >
                    <Toggle active={autoRun} onChange={() => setAutoRun(v => !v)} color="bg-indigo-600" />
                  </SettingRow>

                  <SettingRow
                    title="Auto-playback Steps"
                    desc="Advance steps automatically every 2 seconds"
                  >
                    <Toggle active={autoNext} onChange={() => setAutoNext(v => !v)} color="bg-emerald-600" />
                  </SettingRow>

                  <SettingRow
                    title="Visualization Speed"
                    desc="Playback rate multiplier for auto-advance"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="0.5" max="3.0" step="0.5"
                        value={vizSpeed}
                        onChange={e => setVizSpeed(parseFloat(e.target.value))}
                        className="w-28 accent-indigo-500"
                      />
                      <span className="w-12 text-center font-mono text-indigo-400 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-lg text-sm">
                        {vizSpeed.toFixed(1)}×
                      </span>
                    </div>
                  </SettingRow>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex gap-3 max-w-2xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/50 leading-relaxed">
                    Settings persist for the current session only. Full persistence via localStorage is coming in v1.1.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionLabel({ dot, label }: { dot: string; label: string }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-5 flex items-center gap-2">
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </h3>
  )
}

function NavItem({ icon: Icon, label, active = false, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 group text-sm',
        active ? 'bg-indigo-600/10 text-indigo-300' : 'text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-300'
      )}
    >
      <Icon className={cn('w-4 h-4', active ? 'text-indigo-400' : 'group-hover:text-zinc-300')} />
      <span className="font-medium">{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />}
    </button>
  )
}

function StatItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={cn('text-sm', mono ? 'font-mono text-violet-400 tracking-wider' : 'font-semibold text-indigo-300')}>
        {value}
      </span>
    </div>
  )
}

function ResultCard({ title, content, icon: Icon, color }: {
  title: string; content: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex items-center gap-4">
      <div className={cn('p-2.5 rounded-xl bg-zinc-950 border border-zinc-800', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{title}</p>
        <p className="text-base font-bold font-mono truncate text-zinc-100 mt-0.5">{content}</p>
      </div>
    </div>
  )
}

function Toggle({ active, onChange, color }: { active: boolean; onChange: () => void; color: string }) {
  return (
    <button
      onClick={onChange}
      className={cn('w-12 h-6 rounded-full relative transition-all duration-300', active ? color : 'bg-zinc-800')}
    >
      <motion.div
        animate={{ x: active ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
      />
    </button>
  )
}

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-8 py-6">
      <div>
        <p className="font-semibold text-sm text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="flex justify-end items-center">{children}</div>
    </div>
  )
}
