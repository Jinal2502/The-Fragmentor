'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignalWaveform } from '@/components/SignalWaveform'
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
  LineChart,
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateCRC, calculateHamming } from '@/lib/algorithms'

export default function App() {
  const [view, setView] = useState<'dashboard' | 'simulation' | 'history' | 'settings'>('dashboard')
  const [inputData, setInputData] = useState('1011')
  const [method, setMethod] = useState<'CRC' | 'Hamming'>('CRC')
  const [errorInjection, setErrorInjection] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [autoRun, setAutoRun] = useState(false)
  const [autoNext, setAutoNext] = useState(false)
  const [vizSpeed, setVizSpeed] = useState(1.0)
  const [theme, setTheme] = useState<'dark' | 'glass'>('dark')

  const methods = ['CRC', 'Hamming']

  const handleSimulate = async () => {
    setIsLoading(true)
    setIsSimulating(false)
    setSimulationData(null)
    setCurrentStep(0)
    
    // Slight delay for effect
    await new Promise(r => setTimeout(r, 600))
    
    try {
      let result;
      if (method === 'CRC') {
        result = calculateCRC(inputData, "1101")
      } else {
        result = calculateHamming(inputData)
      }

      setSimulationData({
        final_code: result.finalCode,
        steps: result.steps, 
        error_injected: errorInjection,
        method: method,
        is_valid: !errorInjection,
        timestamp: new Date().toISOString()
      })

      // Save to local storage for history
      try {
        const historyData = localStorage.getItem('error_vis_history')
        const history = JSON.parse(historyData || '[]')
        const newHistory = [
          {
            id: Date.now(),
            data: inputData,
            method: method,
            result: result.finalCode,
            time: new Date().toLocaleTimeString()
          },
          ...history.slice(0, 9)
        ]
        localStorage.setItem('error_vis_history', JSON.stringify(newHistory))
      } catch (e) {
        console.warn('History storage failed')
      }

      setIsSimulating(true)
    } catch (error) {
      console.error('Simulation failed:', error)
      alert('Internal logic error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoRun && inputData) {
      const timer = setTimeout(() => {
        handleSimulate()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [inputData, method, errorInjection])

  const steps = useMemo(() => {
    if (!simulationData) return []
    return simulationData.steps || []
  }, [simulationData])

  useEffect(() => {
    if (autoNext && isSimulating && steps.length > 0) {
      if (currentStep < steps.length - 1) {
        const interval = 2000 / vizSpeed;
        const timer = setTimeout(() => {
          setCurrentStep(s => s + 1);
        }, interval);
        return () => clearTimeout(timer);
      } else {
        setAutoNext(false);
      }
    }
  }, [autoNext, isSimulating, currentStep, steps.length, vizSpeed]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-zinc-800/50 bg-[#0a0a0b]/50 backdrop-blur-xl z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Binary className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ErrorVis <span className="text-zinc-500 font-medium">v1.0</span></h1>
          </div>

          <nav className="space-y-2">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <NavItem icon={Activity} label="Live Simulation" active={view === 'simulation'} onClick={() => setView('simulation')} />
            <NavItem icon={History} label="History" active={view === 'history'} onClick={() => setView('history')} />
            <NavItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-1">Visualizer Dashboard</h2>
            <p className="text-zinc-500">Real-time bit manipulation & error correction analysis</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setIsSimulating(false)
                setSimulationData(null)
              }}
              className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button 
              onClick={handleSimulate}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 font-medium min-w-[160px] justify-center"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isLoading ? 'Processing...' : 'Run Simulation'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {view === 'dashboard' ? (
            <>
              {/* Controls Panel */}
              <section className="col-span-4 space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-6 font-mono">Input Config</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase">Binary Sequence</label>
                  <input 
                    type="text" 
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value.replace(/[^0-1]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg tracking-widest text-indigo-400"
                    placeholder="e.g. 1011"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase">Methodology</label>
                  <div className="grid grid-cols-2 gap-2">
                    {methods.map(m => (
                      <button
                        key={m}
                        onClick={() => setMethod(m as any)}
                        className={cn(
                          "py-2 rounded-lg border text-sm font-medium transition-all",
                          method === m 
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" 
                            : "border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={cn("w-4 h-4", errorInjection ? "text-amber-500" : "text-zinc-600")} />
                    <span className="text-sm text-zinc-300">Inject Random Error</span>
                  </div>
                  <button 
                    onClick={() => setErrorInjection(!errorInjection)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      errorInjection ? "bg-amber-500" : "bg-zinc-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: errorInjection ? 22 : 2 }}
                      className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4 font-mono">Stats</h3>
              <div className="space-y-4">
                <StatItem label="Block Size" value={`${inputData.length} bits`} />
                <StatItem label="Algorithm" value={method} />
                <StatItem label="Complexity" value={method === 'CRC' ? 'O(n)' : 'O(log n)'} />
              </div>
            </div>
          </section>

          {/* Simulation Viewer */}
          <section className="col-span-8 flex flex-col gap-6">
            <div className="flex-1 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden min-h-[400px]">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Live Visualizer
                </div>
              </div>

              {!isSimulating ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Activity className="w-8 h-8" />}
                  </div>
                  <p>{isLoading ? 'Contacting server...' : 'Configure input and press "Run Simulation" to start the visualization process.'}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {steps[currentStep]?.phase}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-indigo-100 mb-6">{steps[currentStep]?.title}</h4>
                        <div className="flex gap-2 justify-center mb-8 flex-wrap max-w-2xl px-4">
                          {(steps[currentStep]?.bits || '').split('').map((bit: string, i: number) => {
                            const isHighlighted = steps[currentStep]?.highlight?.includes(i);
                            const bitValue = steps[currentStep]?.bit_values?.[i];
                            
                            return (
                              <motion.div
                                key={`${currentStep}-${i}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ 
                                  scale: isHighlighted ? 1.25 : 1, 
                                  opacity: 1,
                                  backgroundColor: isHighlighted ? '#4f46e5' : '#09090b',
                                  borderColor: isHighlighted ? '#818cf8' : '#27272a',
                                  color: isHighlighted ? '#ffffff' : '#52525b',
                                  boxShadow: isHighlighted ? '0 0 25px rgba(79,70,229,0.5)' : 'none',
                                  y: isHighlighted ? -5 : 0
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={cn(
                                  "w-12 h-16 rounded-xl border-2 flex flex-col items-center justify-center text-2xl font-mono font-bold transition-all duration-300 transform relative",
                                  isHighlighted && "z-10"
                                )}
                              >
                                {isHighlighted && steps[currentStep]?.operation && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: -30 }}
                                    className="absolute -top-4 text-[10px] font-bold text-indigo-400 bg-zinc-900 border border-indigo-500/30 px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap"
                                  >
                                    {steps[currentStep].operation}
                                  </motion.div>
                                )}
                                <span>{bit}</span>
                                {bitValue !== undefined && (
                                  <span className="text-[9px] text-zinc-500 absolute bottom-1 font-mono">
                                    bit {i}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl max-w-md mx-auto mb-4"
                        >
                           <div className="flex items-center gap-3 text-left">
                              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <Activity className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-zinc-300">{steps[currentStep]?.title}</p>
                                <p className="text-[11px] text-zinc-500">{steps[currentStep]?.description}</p>
                              </div>
                           </div>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-6">
                    <div className="flex gap-1 overflow-hidden max-w-[70%]">
                       {steps.map((_: any, idx: number) => (
                         <div 
                          key={idx} 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            idx === currentStep ? "w-8 bg-indigo-500" : "w-2 bg-zinc-800",
                            idx < currentStep && "bg-indigo-900"
                          )} 
                         />
                       ))}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(s => s - 1)}
                        className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <button 
                        disabled={currentStep === steps.length - 1}
                        onClick={() => setCurrentStep(s => s + 1)}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
               <ResultCard 
                title="Status" 
                content={simulationData ? (simulationData.is_valid ? "Valid" : "Error Detected") : "Ready"} 
                icon={simulationData?.is_valid ? CheckCircle2 : (simulationData ? XCircle : Activity)} 
                color={simulationData ? (simulationData.is_valid ? "text-emerald-500" : "text-rose-500") : "text-zinc-500"} 
               />
               <ResultCard 
                title="Integrity" 
                content={simulationData?.error_injected ? (simulationData.method === 'Hamming' ? "CORRECTED" : "DETECTED") : "VERIFIED"} 
                icon={Activity} 
                color="text-indigo-400" 
               />
            </div>

          </section>
            </>
          ) : view === 'simulation' ? (
            <section className="col-span-12 space-y-6">
              <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-indigo-500" />
                    Digital Logic Analysis
                  </h3>
                  <div className="text-xs font-mono text-zinc-500 uppercase">Verilog Waveform Emulation</div>
                </div>
                
                <div className="space-y-6 bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50">
                  <SignalWaveform label="CLK" data="1010101010101010" clock color="stroke-zinc-700" />
                  <SignalWaveform label="DATA_IN" data={inputData.padEnd(16, '0')} color="stroke-indigo-500" />
                  {simulationData && (
                    <>
                      <SignalWaveform label="ENCODED" data={(simulationData.final_code || "").padEnd(16, '0')} color="stroke-emerald-500" />
                      <SignalWaveform label="ERROR_I" data={simulationData.error_injected ? "0000100000000000" : "0000000000000000"} color="stroke-rose-500" />
                    </>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Gate Delay</p>
                    <p className="text-lg font-mono tracking-tighter text-indigo-400">2.4ns <span className="text-xs text-zinc-600">avg</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Fan-out</p>
                    <p className="text-lg font-mono tracking-tighter text-indigo-400">4 <span className="text-xs text-zinc-600">cells</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Logic Level</p>
                    <p className="text-lg font-mono tracking-tighter text-indigo-400">LVCMOS 3.3V</p>
                  </div>
                </div>
              </div>
            </section>
          ) : view === 'history' ? (
            <section className="col-span-12">
               <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-bold flex items-center gap-3">
                     <History className="w-6 h-6 text-indigo-400" />
                     Simulation History
                   </h3>
                   <button 
                     onClick={() => {
                        localStorage.removeItem('error_vis_history')
                        window.location.reload()
                     }}
                     className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
                   >
                     Clear all
                   </button>
                 </div>
                 
                 <div className="space-y-4">
                    {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('error_vis_history') || '[]').length > 0 ? (
                      JSON.parse(localStorage.getItem('error_vis_history') || '[]').map((item: any) => (
                        <div key={item.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-indigo-400">
                               {item.method[0]}
                             </div>
                             <div>
                               <p className="text-sm font-semibold">{item.data} <span className="text-zinc-600 px-2">→</span> {item.result}</p>
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{item.method} • {item.time}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => {
                              setInputData(item.data)
                              setMethod(item.method)
                              setView('dashboard')
                            }}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            Re-run
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 italic text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center">
                          <History className="w-5 h-5 text-zinc-700" />
                        </div>
                        No recent simulations found in local storage.
                      </div>
                    )}
                 </div>
               </div>
            </section>
          ) : (
            <section className="col-span-12">
               <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                 <div className="flex items-center gap-3 mb-8">
                   <div className="p-2 rounded-lg bg-zinc-800">
                     <Settings className="w-5 h-5 text-indigo-400" />
                   </div>
                   <h3 className="text-xl font-bold">Preferences & Settings</h3>
                 </div>

                 <div className="space-y-8 max-w-2xl">
                    <div className="grid grid-cols-2 gap-8 py-6 border-b border-zinc-800/50">
                      <div>
                        <p className="font-semibold mb-1">Auto-run Simulation</p>
                        <p className="text-xs text-zinc-500 italic">Automatically trigger encoding when input sequence changes</p>
                      </div>
                      <div className="flex justify-end items-center">
                        <button 
                          onClick={() => setAutoRun(!autoRun)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            autoRun ? "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "bg-zinc-800"
                          )}
                        >
                          <motion.div 
                            animate={{ x: autoRun ? 26 : 2 }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-b border-zinc-800/50">
                      <div>
                        <p className="font-semibold mb-1">Auto-playback Simulation</p>
                        <p className="text-xs text-zinc-500 italic">Automatically advance steps every 2 seconds during simulations</p>
                      </div>
                      <div className="flex justify-end items-center">
                        <button 
                          onClick={() => setAutoNext(!autoNext)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            autoNext ? "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-zinc-800"
                          )}
                        >
                          <motion.div 
                            animate={{ x: autoNext ? 26 : 2 }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-b border-zinc-800/50">
                      <div>
                        <p className="font-semibold mb-1">Visualization Speed</p>
                        <p className="text-xs text-zinc-500 italic">Adjust playback rate for bit-by-bit animations</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.0" 
                          step="0.5"
                          value={vizSpeed}
                          onChange={(e) => setVizSpeed(parseFloat(e.target.value))}
                          className="flex-1 accent-indigo-500"
                        />
                        <span className="w-12 text-center font-mono text-indigo-400 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-sm">
                          {vizSpeed.toFixed(1)}x
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6">
                      <div>
                        <p className="font-semibold mb-1">UI Interface Mode</p>
                        <p className="text-xs text-zinc-500 italic">Toggle between deep dark and glassmorphism styles</p>
                      </div>
                      <div className="flex gap-2">
                         {['dark', 'glass'].map((t) => (
                           <button
                             key={t}
                             onClick={() => setTheme(t as any)}
                             className={cn(
                               "flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-all",
                               theme === t 
                                 ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20" 
                                 : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                             )}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                       <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                       <div className="text-xs text-amber-200/60 leading-relaxed">
                         Note: Some settings (like interface mode) are currently preview-only and will persist across the current session. Full local storage persistence is being implemented.
                       </div>
                    </div>
                 </div>
               </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-indigo-600/10 text-indigo-400" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "group-hover:text-zinc-300")} />
      <span className="font-medium">{label}</span>
      {active && <div className="ml-auto w-1 h-5 bg-indigo-500 rounded-full" />}
    </button>
  )
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="font-mono text-indigo-400">{value}</span>
    </div>
  )
}

function ResultCard({ title, content, icon: Icon, color }: { title: string, content: string, icon: any, color: string }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex items-center gap-4">
      <div className={cn("p-3 rounded-xl bg-zinc-950 border border-zinc-800", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase font-bold tracking-tight">{title}</p>
        <p className="text-xl font-bold">{content}</p>
      </div>
    </div>
  )
}
