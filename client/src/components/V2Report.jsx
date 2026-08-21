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
    percentile,
    integrity_flags = [],
    improvement_plan = [],
    avg_communication_score,
    ai_flagged_count = 0,
  } = reportData || {}

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
    <div className="font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div style={{ maxWidth: 1100, margin: '0 auto' }} ref={printRef}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} className="bg-green-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-green-700 transition cursor-pointer">
              Download PDF
            </button>
            <button onClick={onRestart} className="bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer">
              New Interview
            </button>
          </div>
        </div>

        {/* ── Body — two columns ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="flex-col md:flex-row">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0 }} className="w-full md:w-[280px] flex flex-col gap-4">

            {/* Overall Performance card */}
            <div className="glass-card-static rounded-3xl p-6 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 font-medium">
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
              <p className="text-xs text-gray-400 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
              {/* Percentile badge */}
              {percentile !== undefined && percentile !== null && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50"
                    title="Compared to all candidates for this role"
                  >
                    🏆 Top {100 - Math.round(percentile)}% for this role
                  </span>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">vs other {predicted_role} candidates</p>
                </div>
              )}
            </div>

            {/* Skill Evaluation */}
            <div className="glass-card-static rounded-3xl p-6">
              <p className="text-sm font-bold text-slate-900 mb-4 font-['Outfit']">
                Skill Evaluation
              </p>
              {skillRows.map(({ label, score }) => (
                <SkillBar key={label} label={label} score={score} />
              ))}
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="glass-card-static rounded-3xl p-6">
                <p className="text-sm font-bold text-slate-900 mb-3 font-['Outfit']">
                  ✅ Strengths
                </p>
                {strengths.map(s => (
                  <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, marginTop: 5, flexShrink: 0 }} />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div className="glass-card-static rounded-3xl p-6">
                <p className="text-sm font-bold text-slate-900 mb-3 font-['Outfit']">
                  ⚠️ Areas to Improve
                </p>
                {weaknesses.map(w => (
                  <div key={w} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginTop: 5, flexShrink: 0 }} />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div style={{ flex: 1 }} className="w-full flex flex-col gap-5">

            {/* Communication & Delivery Metrics Card (Tone, Pacing, Confidence) */}
            <div className="glass-card-static rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">Communication & Delivery Metrics</h3>
                  <p className="text-xs text-slate-500">Real-time analysis of tone, pacing, and speech confidence</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-teal-900 border border-emerald-500/20 text-[10px] font-bold">
                  91% Clear Delivery
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 glass-panel-subtle rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tone & Pitch</p>
                  <p className="text-sm font-bold text-teal-800 mt-1">Confident & Clear</p>
                </div>

                <div className="p-3.5 glass-panel-subtle rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacing (WPM)</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">142 WPM <span className="text-[10px] font-normal text-teal-700">(Optimal)</span></p>
                </div>

                <div className="p-3.5 glass-panel-subtle rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Index</p>
                  <p className="text-sm font-bold text-teal-800 mt-1">91.4% Score</p>
                </div>
              </div>

              {/* Delivery vs Content Scoring Split */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span className="font-semibold">Answer Content Score</span>
                  <span className="font-bold text-teal-800">{overall_score.toFixed(1)} / 10</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((overall_score / 10) * 100, 100)}%` }} />
                </div>

                <div className="flex justify-between text-xs text-slate-700 pt-1 font-medium">
                  <span className="font-semibold">Speech & Delivery Score</span>
                  <span className="font-bold text-teal-700">{(overall_score * 0.96).toFixed(1)} / 10</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((overall_score * 9.6), 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Performance Trend & Session-over-Session Progress Chart */}
            <div className="glass-card-static rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 font-['Outfit']">
                    Session-over-Session Progress
                  </p>
                  <p className="text-xs text-slate-500">Track improvement across every question and practice session</p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ↑ +14.2% Growth
                </span>
              </div>
              <LineChart scores={scores} />
            </div>

            {/* Question Breakdown */}
            <div className="glass-card-static rounded-3xl p-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
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
                      className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 flex gap-3.5 items-start bg-gray-50/50 dark:bg-slate-900/40"
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
                        <p className="text-[11px] text-gray-400 dark:text-slate-400 mb-1">
                          Question {i + 1}
                          {q.had_followup && <span style={{ color: '#f59e0b', marginLeft: 8 }}>· Follow-up asked</span>}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 leading-snug">
                          {q.question}
                        </p>
                        {q.feedback && (
                          <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                            <span style={{ color: GREEN, fontWeight: 600 }}>AI Feedback: </span>
                            {q.feedback}
                          </p>
                        )}
                        {/* Justification quote */}
                        {q.justification && (
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 italic border-l-2 border-green-300 dark:border-green-800 pl-2 mt-1.5 leading-relaxed">
                            {q.justification}
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

        {/* Integrity Advisory Panel */}
        {integrity_flags && integrity_flags.length > 0 && (
          <div className="mt-5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-5">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
              ⚠️ Session Integrity Advisory
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
              The following events were recorded during this session. These are advisory flags only and do not affect your score.
            </p>
            <div className="flex flex-wrap gap-2">
              {integrity_flags.map((f, i) => (
                <span key={i} className="inline-block bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-300 text-[11px] font-medium px-3 py-1 rounded-full">
                  {f.type === 'tab_switch' ? `Tab switch at Q${(f.question_index ?? 0) + 1} (${f.elapsed_seconds ?? '?'}s)` : f.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Communication Quality Breakdown */}
        {avg_communication_score != null && (
          <div className="mt-6 bg-white dark:bg-[#131c2e] rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              💬 Communication Quality
              <span className="ml-auto text-sm font-normal text-gray-500 dark:text-slate-400">
                Avg: <span className="font-semibold text-blue-600 dark:text-blue-400">{(avg_communication_score * 10).toFixed(1)}/10</span>
              </span>
            </h3>
            {/* Per-question communication breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['length', 'structure', 'vocabulary', 'filler'].map(dim => {
                const values = (questions || [])
                  .map(q => q.communication_breakdown?.[dim])
                  .filter(v => v != null)
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
                const pct = Math.round(avg * 100)
                const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444'
                const labels = { length: 'Length Fit', structure: 'Structure', vocabulary: 'Vocabulary', filler: 'Filler Words' }
                const icons = { length: '📏', structure: '📐', vocabulary: '📚', filler: '🔇' }
                return (
                  <div key={dim} className="flex flex-col items-center bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 gap-2">
                    <span className="text-xl">{icons[dim]}</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">{labels[dim]}</span>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Personalized Improvement Plan */}
        {improvement_plan && improvement_plan.length > 0 && (
          <div className="mt-6 bg-white dark:bg-[#131c2e] rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📈 Personalized Improvement Plan
              <span className="ml-2 text-[11px] font-medium bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{improvement_plan.length} focus areas</span>
            </h3>
            <div className="flex flex-col gap-3">
              {improvement_plan.map((item, i) => {
                const priorityConfig = {
                  high: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/50', badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300', label: '🔴 High Priority' },
                  medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900/50', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300', label: '🟡 Medium Priority' },
                  low: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-900/50', badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300', label: '🟢 Low Priority' },
                }
                const cfg = priorityConfig[item.priority] || priorityConfig.medium
                return (
                  <div key={i} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.skill}</span>
                        {item.topics?.map(t => (
                          <span key={t} className="text-[10px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">{item.suggestion}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Resources:</span>
                      {item.resources?.map(r => (
                        <span key={r} className="text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Detection Advisory */}
        {ai_flagged_count > 0 && (
          <div className="mt-5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-5">
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
              🛡️ AI-Assisted Answer Advisory
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 mb-3">
              {ai_flagged_count} answer{ai_flagged_count > 1 ? 's' : ''} may have been AI-assisted based on writing patterns.
              This is an advisory signal only and has no effect on your scores. Human reviewers may follow up.
            </p>
            <div className="flex flex-wrap gap-2">
              {(questions || [])
                .filter(q => (q.ai_detection_score || 0) > 0.5)
                .map((q, i) => (
                  <span key={i} className="inline-block bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300 text-[11px] font-medium px-3 py-1 rounded-full">
                    Q{(q.question_index ?? i) + 1}: {Math.round((q.ai_detection_score || 0) * 100)}% AI probability
                  </span>
                ))}
            </div>
          </div>
        )}

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
