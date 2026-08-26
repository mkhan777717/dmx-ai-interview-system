import React from 'react'

export function GlassCard({ children, className = '', hover = true, onClick, style }) {
  const base = hover ? 'glass-card' : 'glass-card-static'
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
        ...style,
      }}
      className={`${base} rounded-3xl p-6 relative overflow-hidden border ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default GlassCard
