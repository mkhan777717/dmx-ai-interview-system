import React from 'react'

export function Badge({ children, variant = 'cyan', className = '', icon: Icon }) {
  const variants = {
    cyan: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
    blue: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
    indigo: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
    glass: 'bg-white/5 border-white/10 text-slate-300',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md ${variants[variant] || variants.cyan} ${className}`}
    >
      {Icon && <Icon className="shrink-0" size={12} />}
      <span>{children}</span>
    </span>
  )
}

export default Badge
