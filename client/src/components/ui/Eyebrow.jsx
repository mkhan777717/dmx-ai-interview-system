import React from 'react'

export function Eyebrow({ children, className = '', icon: Icon }) {
  return (
    <div className={`inline-flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--accent)] ${className}`}>
      {Icon && <Icon className="shrink-0 text-current" size={13} />}
      <span>{children}</span>
    </div>
  )
}

export default Eyebrow
