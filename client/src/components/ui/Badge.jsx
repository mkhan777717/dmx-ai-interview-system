import React from 'react'

export function Badge({ children, variant = 'accent', className = '', icon: Icon }) {
  const variants = {
    accent: 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]',
    green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300',
    indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300',
    rose: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300',
    glass: 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md transition-colors ${variants[variant] || variants.accent} ${className}`}
    >
      {Icon && <Icon className="shrink-0 text-current" size={12} />}
      <span>{children}</span>
    </span>
  )
}

export default Badge
