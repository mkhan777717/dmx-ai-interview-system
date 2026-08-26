import React from 'react'
import { motion } from 'motion/react'
import { HiSun, HiMoon } from 'react-icons/hi2'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle({ className = '', size = 'md' }) {
  const { theme, isDark, toggleTheme } = useTheme()

  const dimensions = {
    sm: { width: 'w-13', height: 'h-7', knobSize: 'w-5 h-5', xOffset: 24, iconSize: 12 },
    md: { width: 'w-15', height: 'h-8', knobSize: 'w-6 h-6', xOffset: 28, iconSize: 14 },
  }

  const dim = dimensions[size] || dimensions.md

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          toggleTheme()
        }
      }}
      className={`relative inline-flex items-center justify-between p-1 rounded-full border transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${dim.width} ${dim.height} ${className}`}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Sun Icon (Left) */}
      <span
        className={`flex items-center justify-center z-10 transition-colors duration-200 pl-0.5 ${
          !isDark ? 'text-amber-500' : 'text-[var(--text-muted)] hover:text-amber-400'
        }`}
      >
        <HiSun size={dim.iconSize} />
      </span>

      {/* Moon Icon (Right) */}
      <span
        className={`flex items-center justify-center z-10 transition-colors duration-200 pr-0.5 ${
          isDark ? 'text-indigo-300' : 'text-[var(--text-muted)] hover:text-indigo-400'
        }`}
      >
        <HiMoon size={dim.iconSize} />
      </span>

      {/* Sliding Color-Shifting Circular Knob */}
      <motion.span
        layout
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 32,
        }}
        animate={{
          x: isDark ? dim.xOffset : 0,
        }}
        className={`absolute left-1 top-1 rounded-full shadow-md z-20 flex items-center justify-center ${dim.knobSize}`}
        style={{
          backgroundColor: 'var(--toggle-knob)',
          boxShadow: isDark
            ? '0 2px 8px rgba(124, 111, 234, 0.45)'
            : '0 2px 8px rgba(240, 153, 61, 0.45)',
        }}
      >
        {/* Subtle inner icon on knob */}
        {isDark ? (
          <HiMoon className="text-white text-[10px]" />
        ) : (
          <HiSun className="text-white text-[10px]" />
        )}
      </motion.span>
    </button>
  )
}

export default ThemeToggle
