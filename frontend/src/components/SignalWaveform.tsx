'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SignalWaveformProps {
  data: string
  label: string
  color?: string
  clock?: boolean
}

export function SignalWaveform({ data, label, color = "stroke-indigo-500", clock = false }: SignalWaveformProps) {
  const bits = data.split('')
  const stepWidth = 40
  const height = 40
  const padding = 20

  const generatePath = () => {
    let path = `M 0 ${bits[0] === '1' ? 0 : height}`
    bits.forEach((bit, i) => {
      const x = i * stepWidth
      const y = bit === '1' ? 0 : height
      // Vertical transition
      path += ` L ${x} ${y}`
      // Horizontal stay
      path += ` L ${x + stepWidth} ${y}`
    })
    return path
  }

  const generateClockPath = () => {
    let path = `M 0 ${height}`
    for (let i = 0; i < bits.length; i++) {
      const x = i * stepWidth
      path += ` L ${x} 0 L ${x + stepWidth/2} 0 L ${x + stepWidth/2} ${height} L ${x + stepWidth} ${height}`
    }
    return path
  }

  return (
    <div className="flex items-center gap-4 py-2 border-b border-zinc-800 last:border-0">
      <div className="w-24 text-xs font-mono text-zinc-500 uppercase truncate">{label}</div>
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <svg 
          width={bits.length * stepWidth} 
          height={height + 10} 
          viewBox={`0 -5 ${bits.length * stepWidth} ${height + 10}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {bits.map((_, i) => (
            <line 
              key={i} 
              x1={i * stepWidth} 
              y1={-5} 
              x2={i * stepWidth} 
              y2={height + 5} 
              className="stroke-zinc-800/50" 
              strokeDasharray="2,2" 
            />
          ))}
          
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            d={clock ? generateClockPath() : generatePath()}
            fill="none"
            className={cn("stroke-2", color)}
            strokeLinejoin="step-after"
          />

          {/* Labels for bits */}
          {!clock && bits.map((bit, i) => (
            <text
              key={i}
              x={i * stepWidth + stepWidth/2}
              y={height/2 + 5}
              textAnchor="middle"
              className="fill-zinc-600 text-[10px] font-mono pointer-events-none"
            >
              {bit}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
