import React from 'react'

export default function BrandLogo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: { img: 'w-5 h-5', text: 'text-base font-bold' },
    md: { img: 'w-6 h-6', text: 'text-lg font-bold' },
    lg: { img: 'w-8 h-8', text: 'text-xl font-bold' },
    xl: { img: 'w-10 h-10', text: 'text-2xl font-bold' },
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="InterviewIQ Logo"
        className={`${s.img} object-contain transition-transform duration-200 group-hover:scale-105`}
      />
      {showText && (
        <span className={`${s.text} tracking-tight font-display`} style={{ color: 'var(--text-primary)' }}>
          interviewiq
        </span>
      )}
    </div>
  )
}
