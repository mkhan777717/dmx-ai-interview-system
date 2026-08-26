import React from 'react'

export default function BrandLogo({ size = 'md', showText = true, animated = true, className = '' }) {
  const sizeMap = {
    sm: { box: 'w-7 h-7 rounded-lg p-0.5', img: 'w-4 h-4', text: 'text-base', badge: 'text-[8px] px-1.5' },
    md: { box: 'w-9 h-9 rounded-xl p-1', img: 'w-5 h-5', text: 'text-lg', badge: 'text-[9px] px-2' },
    lg: { box: 'w-12 h-12 rounded-2xl p-1.5', img: 'w-7 h-7', text: 'text-2xl', badge: 'text-[10px] px-2.5' },
    xl: { box: 'w-16 h-16 rounded-3xl p-2', img: 'w-9 h-9', text: 'text-3xl', badge: 'text-xs px-3' },
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Frame with Green Ambient Glow and Boundary Highlight */}
      <div className={`relative ${s.box} flex items-center justify-center transition-all duration-300 logo-badge ${animated ? 'logo-glow-pulse' : ''}`}>
        {/* Soft background radial tint */}
        <div
          className="absolute inset-0 rounded-[inherit] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(78, 156, 110, 0.8) 0%, transparent 70%)',
          }}
        />
        <img
          src="/logo.png"
          alt="InterviewIQ Logo"
          className="w-full h-full object-contain aspect-square drop-shadow-[0_0_8px_rgba(78,156,110,0.5)] transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`${s.text} font-extrabold font-display tracking-tight flex items-center gap-0.5`} style={{ color: 'var(--text-primary)' }}>
            Interview<span style={{ color: 'var(--accent)' }}>IQ</span>
          </span>
          <span
            className={`${s.badge} font-bold tracking-widest py-0.5 rounded-full uppercase border shadow-xs`}
            style={{
              backgroundColor: 'rgba(78, 156, 110, 0.12)',
              borderColor: 'rgba(78, 156, 110, 0.35)',
              color: 'var(--accent)',
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  )
}
