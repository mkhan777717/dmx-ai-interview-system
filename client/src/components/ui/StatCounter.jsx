import React, { useEffect, useState, useRef } from 'react'

export function StatCounter({ value, suffix = '', prefix = '', label, subtitle, duration = 1500, decimals = 0 }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const end = typeof value === 'number' ? value : parseFloat(value) || 0
          const startTime = performance.now()

          const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            const currentVal = start + (end - start) * easeProgress
            setCount(currentVal)

            if (progress < 1) {
              requestAnimationFrame(updateCount)
            } else {
              setCount(end)
            }
          }

          requestAnimationFrame(updateCount)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration, hasAnimated])

  return (
    <div
      ref={ref}
      className="rounded-3xl p-6 relative overflow-hidden border shadow-sm transition-all duration-300 hover:border-[var(--accent)]"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-15" style={{ backgroundColor: 'var(--accent)' }} />
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 font-display" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl lg:text-4xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
            {prefix}
            {decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}
            {suffix}
          </span>
        </div>
        {subtitle && <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
    </div>
  )
}

export default StatCounter
