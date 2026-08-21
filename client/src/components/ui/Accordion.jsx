import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HiChevronDown } from 'react-icons/hi2'

export function Accordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(0)

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <div className="w-full space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? 'bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                : 'glass-card border-white/5 hover:border-white/15'
            }`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
            >
              <span className={`text-base font-bold font-['Outfit'] transition-colors ${
                isOpen ? 'text-cyan-300' : 'text-white'
              }`}>
                {item.question}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isOpen ? 'rotate-180 bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
              }`}>
                <HiChevronDown size={16} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
