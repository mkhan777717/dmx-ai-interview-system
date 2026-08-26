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
            className="rounded-2xl border transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: isOpen ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
              borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
              boxShadow: isOpen ? '0 4px 20px -4px rgba(78, 156, 110, 0.15)' : 'none',
            }}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
            >
              <span
                className="text-base font-bold font-display transition-colors"
                style={{
                  color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                {item.question}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                style={{
                  backgroundColor: isOpen ? 'rgba(78, 156, 110, 0.15)' : 'var(--bg-page)',
                  color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <HiChevronDown size={15} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
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
