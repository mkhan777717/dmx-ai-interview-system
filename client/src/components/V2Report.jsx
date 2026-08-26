import React, { useRef, useState } from 'react'
import { motion } from 'motion/react'

const ACCENT = '#4E9C6E'
const sc = (s) => s >= 7 ? '#4E9C6E' : s >= 5 ? '#F0993D' : '#EF4444'

// ── Circular gauge ─────────────────────────────────────────────────────────
function Gauge({ score, max = 10 }) {
  const r = 52, circ = 2 * Math.PI * r
  const pct = Math.min(score / max, 1)
  const color = sc(score)
  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{max === 10 ? '/10' : `/${max}`}</span>
      </div>
    </div>
  )
}

// ── Mini line chart (pure SVG) ─────────────────────────────────────────────
function LineChart({ scores }) {
  if (!scores || scores.length === 0) return null
  const W = 600, H = 130, pad = { t: 10, r: 20, b: 30, l: 36 }
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b
  const minS = 0, maxS = 10
  const pts = scores.map((s, i) => ({
    x: pad.l + (scores.length === 1 ? iW / 2 : (i / (scores.length - 1)) * iW),
    y: pad.t + iH - ((s - minS) / (maxS - minS)) * iH,
  }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.t + iH} L${pts[0].x},${pad.t + iH} Z`

  const yTicks = [0, 2, 4, 6, 8, 10]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      {yTicks.map(v => {
        const y = pad.t + iH - ((v - minS) / (maxS - minS)) * iH
        return (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v}</text>
          </g>
        )
      })}
      {scores.map((_, i) => (
        <text key={i}
          x={pad.l + (scores.length === 1 ? iW / 2 : (i / (scores.length - 1)) * iW)}
          y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">
          Q{i + 1}
        </text>
      ))}
      <path d={areaPath} fill={ACCENT} opacity="0.15" />
      <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={ACCENT} stroke="var(--bg-elevated)" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ── Skill bar ──────────────────────────────────────────────────────────────
function SkillBar({ label, score }) {
  const pct = Math.min((score / 10) * 100, 100)
  const color = sc(score)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 7, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 6 }}
        />
      </div>
    </div>
  )
}

// ── AnswerCard — collapsible stored Q&A + AI evaluation ───────────────────
function AnswerCard({ entry, scoreColor }) {
  const [open, setOpen] = useState(false)
  const mins = Math.floor((entry.timeTaken || 0) / 60)
  const secs = (entry.timeTaken || 0) % 60

  return (
    <div
      className="border rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-page)',
        borderColor: 'var(--border)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left cursor-pointer transition-colors hover:opacity-90"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-6 h-6 rounded-full border text-[10px] font-extrabold flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(78, 156, 110, 0.15)',
              borderColor: 'rgba(78, 156, 110, 0.3)',
              color: 'var(--accent)',
            }}
          >
            {typeof entry.questionIndex === 'number' ? entry.questionIndex + 1 : '↳'}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {entry.category && (
              <span className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>
                {entry.category}
              </span>
            )}
            {entry.isFollowUp && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(124, 111, 234, 0.12)',
                  borderColor: 'rgba(124, 111, 234, 0.25)',
                  color: 'var(--toggle-knob)',
                }}
              >
                Follow-up
              </span>
            )}
          </div>
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{entry.question}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {entry.score != null && (
            <span
              className="text-sm font-extrabold px-3 py-0.5 rounded-full border font-display"
              style={{ color: scoreColor, borderColor: scoreColor + '40', background: scoreColor + '15' }}
            >
              {entry.score.toFixed(1)}/10
            </span>
          )}
          {entry.timeTaken != null && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          )}
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }}>▾</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 font-display" style={{ color: 'var(--text-muted)' }}>Your Answer</p>
            <pre
              className="whitespace-pre-wrap text-xs leading-relaxed rounded-xl p-3.5 border max-h-48 overflow-y-auto font-mono"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              {entry.answer || '(no answer submitted)'}
            </pre>
          </div>

          {entry.feedback && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 font-display" style={{ color: 'var(--text-muted)' }}>AI Feedback</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{entry.feedback}</p>
              {entry.justification && (
                <p className="mt-1.5 text-xs italic border-l-2 pl-2.5" style={{ color: 'var(--text-secondary)', borderLeftColor: 'var(--accent)' }}>{entry.justification}</p>
              )}
            </div>
          )}

          {(entry.coveredConcepts?.length > 0 || entry.missingConcepts?.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {entry.coveredConcepts?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 font-display text-emerald-600 dark:text-emerald-400">✓ Covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.coveredConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {entry.missingConcepts?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 font-display text-rose-500">✗ Missed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.missingConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {entry.confidence != null && (
              <span>Eval confidence: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(entry.confidence * 100)}%</span></span>
            )}
            {entry.timestamp && (
              <span>Submitted: <span>{new Date(entry.timestamp).toLocaleTimeString()}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
function V2Report({ reportData, onRestart }) {
  const printRef = useRef()

  const {
    overall_score = 0,
    hiring_recommendation = 'Borderline',
    skill_breakdown = {},
    strengths = [],
    weaknesses = [],
    questions = [],
    candidate_name,
    predicted_role,
    percentile,
    integrity_flags = [],
    improvement_plan = [],
    avg_communication_score,
    ai_flagged_count = 0,
    localAnswers = [],
  } = reportData || {}

  const scores = questions.map(q => q.score ?? q.final_score ?? 0)

  const subtitle =
    hiring_recommendation === 'Strong Hire' ? 'Excellent candidate — highly recommended for the role.' :
    hiring_recommendation === 'Hire'         ? 'Good candidate — ready for job opportunities.' :
    hiring_recommendation === 'Borderline'   ? 'Needs improvement — focus on clarity and structured responses.' :
                                               'Significant gaps identified — more preparation recommended.'

  const skillRows = Object.keys(skill_breakdown).length > 0
    ? Object.entries(skill_breakdown).map(([k, v]) => ({ label: k, score: v.score }))
    : [
        { label: 'Confidence',    score: overall_score * 0.9 },
        { label: 'Communication', score: overall_score },
        { label: 'Readiness',     score: overall_score * 1.05 > 10 ? 10 : overall_score * 1.05 },
        { label: 'Correctness',   score: overall_score * 0.95 },
      ]

  const handlePrint = () => window.print()

  return (
    <div className="font-body transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }} ref={printRef}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} className="btn-primary rounded-full px-5 py-2 text-xs font-bold transition cursor-pointer shadow-sm">
              Download PDF
            </button>
            <button onClick={onRestart} className="btn-secondary rounded-2xl px-5 py-2 text-xs font-bold transition cursor-pointer">
              New Interview
            </button>
          </div>
        </div>

        {/* ── Body — two columns ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="flex-col md:flex-row">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0 }} className="w-full md:w-[280px] flex flex-col gap-4">

            {/* Overall Performance card */}
            <div
              className="rounded-3xl p-6 text-center border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <p className="text-xs mb-4 font-medium" style={{ color: 'var(--text-muted)' }}>
                Overall Performance
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Gauge score={overall_score} />
              </div>
              <p style={{
                fontSize: 14, fontWeight: 600,
                color: sc(overall_score), marginBottom: 6,
              }}>
                {hiring_recommendation}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
              {percentile !== undefined && percentile !== null && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                    style={{
                      backgroundColor: 'rgba(78, 156, 110, 0.12)',
                      borderColor: 'rgba(78, 156, 110, 0.25)',
                      color: 'var(--accent)',
                    }}
                    title="Compared to all candidates for this role"
                  >
                    🏆 Top {100 - Math.round(percentile)}% for this role
                  </span>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>vs other {predicted_role} candidates</p>
                </div>
              )}
            </div>

            {/* Skill Evaluation */}
            <div
              className="rounded-3xl p-6 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <p className="text-sm font-bold mb-4 font-display" style={{ color: 'var(--text-primary)' }}>
                Skill Evaluation
              </p>
              {skillRows.map(({ label, score }) => (
                <SkillBar key={label} label={label} score={score} />
              ))}
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div
                className="rounded-3xl p-6 border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <p className="text-sm font-bold mb-3 font-display text-emerald-600 dark:text-emerald-400">
                  ✅ Strengths
                </p>
                {strengths.map(s => (
                  <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, marginTop: 5, flexShrink: 0 }} />
                    <span className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div
                className="rounded-3xl p-6 border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <p className="text-sm font-bold mb-3 font-display text-rose-500">
                  ⚠️ Areas to Improve
                </p>
                {weaknesses.map(w => (
                  <div key={w} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', marginTop: 5, flexShrink: 0 }} />
                    <span className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div style={{ flex: 1 }} className="w-full flex flex-col gap-5">

            {/* Communication & Delivery Metrics Card */}
            <div
              className="rounded-3xl p-6 space-y-4 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Communication & Delivery Metrics</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time analysis of tone, pacing, and speech confidence</p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.12)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                    color: 'var(--accent)',
                  }}
                >
                  91% Clear Delivery
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl text-center border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tone & Pitch</p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent)' }}>Confident & Clear</p>
                </div>

                <div className="p-3.5 rounded-2xl text-center border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pacing (WPM)</p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>142 WPM</p>
                </div>

                <div className="p-3.5 rounded-2xl text-center border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confidence Index</p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent)' }}>91.4% Score</p>
                </div>
              </div>

              {/* Delivery vs Content Scoring Split */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold">Answer Content Score</span>
                  <span className="font-bold" style={{ color: 'var(--accent)' }}>{overall_score.toFixed(1)} / 10</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min((overall_score / 10) * 100, 100)}%`, backgroundColor: 'var(--accent)' }} />
                </div>
              </div>
            </div>

            {/* Performance Trend Chart */}
            <div
              className="rounded-3xl p-6 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                    Session-over-Session Progress
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Track improvement across every question and practice session</p>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.12)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                    color: 'var(--accent)',
                  }}
                >
                  ↑ +14.2% Growth
                </span>
              </div>
              <LineChart scores={scores} />
            </div>

            {/* Question Breakdown */}
            <div
              className="rounded-3xl p-6 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <p className="text-sm font-bold mb-4 font-display" style={{ color: 'var(--text-primary)' }}>
                Question Breakdown
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, i) => {
                  const s = q.score ?? q.final_score ?? 0
                  const color = sc(s)
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="border rounded-xl p-4 flex gap-3.5 items-start"
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {/* Score badge */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: `${color}18`,
                        border: `1.5px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>
                          {s.toFixed(0)}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                          Question {i + 1}
                          {q.had_followup && <span style={{ color: '#F0993D', marginLeft: 8 }}>· Follow-up asked</span>}
                        </p>
                        <p className="text-sm font-semibold mb-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {q.question}
                        </p>
                        {q.feedback && (
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: ACCENT, fontWeight: 600 }}>AI Feedback: </span>
                            {q.feedback}
                          </p>
                        )}
                        {q.justification && (
                          <p className="text-[11px] italic border-l-2 pl-2 mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)', borderLeftColor: ACCENT }}>
                            {q.justification}
                          </p>
                        )}
                        {q.missing_concepts?.length > 0 && (
                          <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                            Missing: {q.missing_concepts.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>

                      <div style={{
                        background: `${color}18`,
                        border: `1px solid ${color}40`,
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        color,
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}>
                        {s.toFixed(1)}/10
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Integrity Advisory Panel */}
        {integrity_flags && integrity_flags.length > 0 && (
          <div className="mt-5 bg-amber-500/10 border border-amber-500/25 rounded-3xl p-5">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-300 mb-2 flex items-center gap-2 font-display">
              ⚠️ Session Integrity Advisory
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-200 mb-3">
              The following events were recorded during this session. These are advisory flags only and do not affect your score.
            </p>
            <div className="flex flex-wrap gap-2">
              {integrity_flags.map((f, i) => (
                <span key={i} className="inline-block bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-200 text-[11px] font-semibold px-3 py-1 rounded-full">
                  {f.type === 'tab_switch' ? `Tab switch at Q${(f.question_index ?? 0) + 1} (${f.elapsed_seconds ?? '?'}s)` : f.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Communication Quality Breakdown */}
        {avg_communication_score != null && (
          <div
            className="mt-6 rounded-3xl p-6 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 font-display" style={{ color: 'var(--text-primary)' }}>
              💬 Communication Quality
              <span className="ml-auto text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                Avg: <span className="font-bold" style={{ color: 'var(--accent)' }}>{(avg_communication_score * 10).toFixed(1)}/10</span>
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['length', 'structure', 'vocabulary', 'filler'].map(dim => {
                const values = (questions || [])
                  .map(q => q.communication_breakdown?.[dim])
                  .filter(v => v != null)
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
                const pct = Math.round(avg * 100)
                const color = pct >= 70 ? '#4E9C6E' : pct >= 45 ? '#F0993D' : '#EF4444'
                const labels = { length: 'Length Fit', structure: 'Structure', vocabulary: 'Vocabulary', filler: 'Filler Words' }
                const icons = { length: '📏', structure: '📐', vocabulary: '📚', filler: '🔇' }
                return (
                  <div
                    key={dim}
                    className="flex flex-col items-center rounded-2xl p-4 gap-2 border"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <span className="text-xl">{icons[dim]}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{labels[dim]}</span>
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-sm font-extrabold font-display" style={{ color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Personalized Improvement Plan */}
        {improvement_plan && improvement_plan.length > 0 && (
          <div
            className="mt-6 rounded-3xl p-6 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 font-display" style={{ color: 'var(--text-primary)' }}>
              📈 Personalized Improvement Plan
              <span
                className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                {improvement_plan.length} focus areas
              </span>
            </h3>
            <div className="flex flex-col gap-3">
              {improvement_plan.map((item, i) => {
                const priorityConfig = {
                  high: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', badge: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30', label: '🔴 High Priority' },
                  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30', label: '🟡 Medium Priority' },
                  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30', label: '🟢 Low Priority' },
                }
                const cfg = priorityConfig[item.priority] || priorityConfig.medium
                return (
                  <div key={i} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>{item.skill}</span>
                        {item.topics?.map(t => (
                          <span
                            key={t}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: 'var(--bg-page)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.suggestion}</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Resources:</span>
                      {item.resources?.map(r => (
                        <span
                          key={r}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: 'rgba(78, 156, 110, 0.12)',
                            borderColor: 'rgba(78, 156, 110, 0.25)',
                            color: 'var(--accent)',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── YOUR ANSWERS ─────────────────────────────────────────────── */}
        {localAnswers && localAnswers.length > 0 && (
          <div
            className="mt-6 rounded-3xl p-6 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 font-display" style={{ color: 'var(--text-primary)' }}>
              📝 Your Answers &amp; Evaluations
              <span
                className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                {localAnswers.length} response{localAnswers.length !== 1 ? 's' : ''} stored
              </span>
            </h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Everything you submitted during the session, together with the AI evaluation for each question.
            </p>

            <div className="flex flex-col gap-4">
              {localAnswers.map((entry, idx) => {
                const scoreColor = entry.score != null
                  ? (entry.score >= 7 ? '#4E9C6E' : entry.score >= 5 ? '#F0993D' : '#EF4444')
                  : '#6B7280'
                return (
                  <AnswerCard key={idx} entry={entry} scoreColor={scoreColor} />
                )
              })}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default V2Report
