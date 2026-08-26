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
                  ? 'border-[var(--accent)] shadow-md'
                  : 'hover:border-[var(--accent)]/40'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(78, 156, 110, 0.12)' : 'var(--bg-elevated)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-page)',
                    color: isActive ? 'var(--accent-text-on)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  0{idx + 1}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </div>
              <div>
                <p
                  className="text-sm font-bold font-display"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {step.title}
                </p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
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
          className="rounded-3xl p-6 sm:p-8 lg:p-10 border relative overflow-hidden shadow-lg"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: 'var(--accent)' }} />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.3)',
                  color: 'var(--accent)',
                }}
              >
                <span>Phase {activeStep + 1} of {steps.length}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {current.heading || current.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {current.description}
              </p>
              {current.bullets && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {current.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
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
                <div
                  className="w-full p-6 rounded-2xl border flex flex-col gap-3 font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                    <span>⚡ AI ENGINE STREAM</span>
                    <span>READY</span>
                  </div>
                  <div
                    className="p-3 border rounded-xl text-xs"
                    style={{
                      backgroundColor: 'rgba(78, 156, 110, 0.08)',
                      borderColor: 'rgba(78, 156, 110, 0.2)',
                      color: 'var(--accent)',
                    }}
                  >
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
