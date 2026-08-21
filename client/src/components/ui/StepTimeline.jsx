import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export function StepTimeline({ steps = [] }) {
  const [activeStep, setActiveStep] = useState(0)
  const current = steps[activeStep] || steps[0]

  return (
    <div className="w-full space-y-8">
      {/* Horizontal Clickable Step Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep
          return (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-500/15 to-indigo-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'glass-card border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isActive ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm' : 'bg-white/5 text-slate-400'
                }`}>
                  0{idx + 1}
                </span>
                {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
              </div>
              <div>
                <p className={`text-sm font-bold font-['Outfit'] ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {step.shortDesc || step.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail Panel with Smooth Crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="glass-card-static rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-bold text-cyan-300">
                <span>Phase {activeStep + 1} of {steps.length}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                {current.heading || current.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {current.description}
              </p>
              {current.bullets && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {current.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex justify-center">
              {current.previewContent ? (
                current.previewContent
              ) : (
                <div className="w-full p-6 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col gap-3 font-mono text-xs text-slate-300">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-cyan-400">
                    <span>⚡ AI ENGINE STREAM</span>
                    <span>READY</span>
                  </div>
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-cyan-200 text-xs">
                    {current.codeSnippet || `> Processing step ${activeStep + 1}: ${current.title}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default StepTimeline
