import React from 'react'

export function BrowserMockup({
  children,
  badge = 'Live AI Room',
  className = '',
}) {
  return (
    <div
      className={`rounded-3xl border shadow-2xl overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Browser Chrome Header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-page)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* Live Badge */}
        {badge && (
          <div
            className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border text-[10px] font-bold"
            style={{
              backgroundColor: 'rgba(78, 156, 110, 0.12)',
              borderColor: 'rgba(78, 156, 110, 0.3)',
              color: 'var(--accent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
            <span>{badge}</span>
          </div>
        )}
      </div>

      {/* Browser Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  )
}

export default BrowserMockup
