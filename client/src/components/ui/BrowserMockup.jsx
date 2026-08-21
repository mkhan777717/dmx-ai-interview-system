import React from 'react'

export function BrowserMockup({
  children,
  url = 'app.interviewiq.ai/v2/live-interview',
  badge = 'Live AI Room',
  className = '',
}) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden ${className}`}>
      {/* Browser Chrome Header */}
      <div className="px-5 py-3.5 border-b border-white/8 bg-slate-900/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* URL Bar */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-1 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 font-mono flex-1 max-w-sm truncate">
          <span className="text-emerald-400 text-[10px]">🔒</span>
          <span>{url}</span>
        </div>

        {/* Live Badge */}
        {badge && (
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
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
