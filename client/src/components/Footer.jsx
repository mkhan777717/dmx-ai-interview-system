import React from 'react'

function Footer() {
  return (
    <footer className="flex justify-center px-4 pb-12 pt-8" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div
        className="w-full max-w-6xl rounded-3xl border py-8 px-6 text-center transition-colors"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex justify-center items-center gap-3 mb-3">
          <div
            className="border p-1.5 rounded-xl w-8 h-8 flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: 'var(--bg-page)',
              borderColor: 'var(--border)',
            }}
          >
            <img src="/logo.png" alt="InterviewIQ Logo" className="w-full h-full object-contain aspect-square" />
          </div>
          <h2 className="font-bold font-display text-base" style={{ color: 'var(--text-primary)' }}>
            Interview<span className="text-[var(--accent)]">IQ</span>.AI
          </h2>
        </div>
        <p className="text-sm max-w-xl mx-auto font-body" style={{ color: 'var(--text-secondary)' }}>
          AI-powered interview preparation platform designed to improve communication skills, technical depth, and professional confidence.
        </p>
        <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs max-w-xl mx-auto" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>© {new Date().getFullYear()} InterviewIQ. All rights reserved.</p>
          <p className="mt-1 sm:mt-0">Crafted with precision for modern candidates</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
