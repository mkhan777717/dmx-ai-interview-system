import React, { useRef } from 'react'
import { motion } from 'motion/react'

const GREEN = '#10b981'
const sc = (s) => s >= 7 ? GREEN : s >= 5 ? '#f59e0b' : '#ef4444'

// ── Circular gauge ─────────────────────────────────────────────────────────
function Gauge({ score, max = 10 }) {
  const r = 52, circ = 2 * Math.PI * r
  const pct = Math.min(score / max, 1)
  const color = sc(score)
  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
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
        <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{max === 10 ? '/10' : `/${max}`}</span>
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

  // Y axis ticks
  const yTicks = [0, 2, 4, 6, 8, 10]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      {/* Grid lines */}
      {yTicks.map(v => {
        const y = pad.t + iH - ((v - minS) / (maxS - minS)) * iH
        return (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
          </g>
        )
      })}
      {/* X labels */}
      {scores.map((_, i) => (
        <text key={i}
          x={pad.l + (scores.length === 1 ? iW / 2 : (i / (scores.length - 1)) * iW)}
          y={H - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">
          Q{i + 1}
        </text>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={GREEN} opacity="0.12" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={GREEN} stroke="#fff" strokeWidth="2" />
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
        <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 7, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
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
  } = reportData

  const scores = questions.map(q => q.score ?? q.final_score ?? 0)

  // Hiring label → subtitle
  const subtitle =
    hiring_recommendation === 'Strong Hire' ? 'Excellent candidate — highly recommended for the role.' :
    hiring_recommendation === 'Hire'         ? 'Good candidate — ready for job opportunities.' :
    hiring_recommendation === 'Borderline'   ? 'Needs improvement — focus on clarity and structured responses.' :
                                               'Significant gaps identified — more preparation recommended.'

  // Build skill rows for left panel
  // Use skill_breakdown if available, else derive from scores
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
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }} ref={printRef}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} style={{
              background: GREEN, color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 18px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}>
              Download PDF
            </button>
            <button onClick={onRestart} style={{
              background: '#fff', color: '#374151', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '8px 18px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}>
              New Interview
            </button>
          </div>
        </div>

        {/* ── Body — two columns ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Overall Performance card */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #e5e7eb', padding: '24px 20px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, fontWeight: 500 }}>
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
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                {subtitle}
              </p>
            </div>

            {/* Skill Evaluation */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #e5e7eb', padding: '20px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                Skill Evaluation
              </p>
              {skillRows.map(({ label, score }) => (
                <SkillBar key={label} label={label} score={score} />
              ))}
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #e5e7eb', padding: '20px',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                  ✅ Strengths
                </p>
                {strengths.map(s => (
                  <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #e5e7eb', padding: '20px',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                  ⚠️ Areas to Improve
                </p>
                {weaknesses.map(w => (
                  <div key={w} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Performance Trend chart */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #e5e7eb', padding: '20px 20px 12px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Performance Trend
              </p>
              <LineChart scores={scores} />
            </div>

            {/* Question Breakdown */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #e5e7eb', padding: '20px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
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
                      style={{
                        border: '1px solid #f3f4f6',
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                      }}>
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
                        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
                          Question {i + 1}
                          {q.had_followup && <span style={{ color: '#f59e0b', marginLeft: 8 }}>· Follow-up asked</span>}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6, lineHeight: 1.45 }}>
                          {q.question}
                        </p>
                        {q.feedback && (
                          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                            <span style={{ color: GREEN, fontWeight: 600 }}>AI Feedback: </span>
                            {q.feedback}
                          </p>
                        )}
                        {q.missing_concepts?.length > 0 && (
                          <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                            Missing: {q.missing_concepts.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Score pill right */}
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
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff; }
          button { display: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}

export default V2Report
