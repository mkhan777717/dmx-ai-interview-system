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
            // Ease out expo
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
    <div ref={ref} className="glass-card-static rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
      <div className="relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl lg:text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {prefix}
            {decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}
            {suffix}
          </span>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}

export default StatCounter
