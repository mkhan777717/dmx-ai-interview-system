import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { motion, AnimatePresence } from 'motion/react'
import {
  FaCalendarAlt, FaCheckCircle, FaSpinner,
  FaClock, FaStop, FaExclamationTriangle,
} from 'react-icons/fa'
import { BsArrowRight, BsClipboardData } from 'react-icons/bs'
import V2Layout from '../components/V2Layout'

function fmtDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(null)
  const navigate = useNavigate()

  const fetchHistory = async () => {
    try {
      const result = await axios.get(ServerUrl + '/api/v2/interview/history', { withCredentials: true })
      setInterviews(result.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const handleEndInterview = async (interviewId, e) => {
    e.stopPropagation()
    if (!window.confirm('End this interview session? A partial report will be generated.')) return
    setEnding(interviewId)
    try {
      await axios.post(
        `${ServerUrl}/api/v2/interview/finish`,
        { interview_id: interviewId, integrity_flags: [] },
        { withCredentials: true },
      )
      await fetchHistory()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to end interview.')
    } finally {
      setEnding(null)
    }
  }

  const completed = interviews.filter(i => i.status === 'completed')
  const inProgress = interviews.filter(i => i.status === 'in_progress')

  return (
    <V2Layout
      title="My Interview Reports"
      subtitle="Review your past mock interviews and detailed AI feedback reports"
    >
      <div className="p-4 lg:p-6 max-w-5xl mx-auto w-full space-y-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
            <FaSpinner className="animate-spin text-3xl mb-3" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div
            className="p-12 rounded-3xl text-center flex flex-col items-center border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <BsClipboardData size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 font-display" style={{ color: 'var(--text-primary)' }}>No interviews yet</h3>
            <p className="text-xs max-w-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Complete your first AI mock interview to receive detailed rubric feedback, communication metrics, and progress tracking.
            </p>
            <button
              onClick={() => navigate('/v2/interview')}
              className="px-6 py-3 btn-primary font-bold text-xs rounded-full transition cursor-pointer shadow-md"
            >
              Start Interview Now
            </button>
          </div>
        ) : (
          <>
            {/* ── In Progress ──────────────────────────────────────────── */}
            {inProgress.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-xs font-bold uppercase tracking-widest font-display text-amber-600 dark:text-amber-300">
                    In Progress — {inProgress.length}
                  </h2>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {inProgress.map((item) => {
                      const id = item.id || item._id
                      const role = item.predicted_role || item.role || 'Technical Interview'
                      const isEnding = ending === id
                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="rounded-3xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-lg shrink-0 text-amber-600 dark:text-amber-300"
                              style={{
                                backgroundColor: 'rgba(240, 153, 61, 0.12)',
                                borderColor: 'rgba(240, 153, 61, 0.3)',
                              }}
                            >
                              {role.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>{role}</h3>
                              <div className="flex flex-wrap items-center gap-2.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                <span className="flex items-center gap-1.5">
                                  <FaCalendarAlt size={10} />
                                  {fmtDate(item.createdAt || item.created_at)}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1.5">
                                  <FaClock size={10} />
                                  {fmtTime(item.createdAt || item.created_at)}
                                </span>
                                <span>·</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {item.mode || item.interview_mode || 'Technical'} Mode
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              In Progress
                            </span>
                            <button
                              onClick={(e) => handleEndInterview(id, e)}
                              disabled={isEnding}
                              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              {isEnding
                                ? <FaSpinner className="animate-spin" size={11} />
                                : <FaStop size={10} />
                              }
                              End Interview
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* ── Completed ────────────────────────────────────────────── */}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FaCheckCircle style={{ color: 'var(--accent)' }} size={13} />
                  <h2 className="text-xs font-bold uppercase tracking-widest font-display" style={{ color: 'var(--accent)' }}>
                    Completed Reports — {completed.length}
                  </h2>
                </div>
                <div className="space-y-3">
                  {completed.map((item, index) => {
                    const id = item.id || item._id
                    const role = item.predicted_role || item.role || 'Technical Interview'
                    const score = item.finalScore ?? item.final_score ?? null
                    const flagCount = (item.integrity_flags || []).length

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => navigate(`/report/${id}`)}
                        className="rounded-3xl p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group border shadow-sm transition-all hover:border-[var(--accent)]"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {/* Left */}
                        <div className="flex items-center gap-4">
                          <div
                            className="w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform"
                            style={{
                              backgroundColor: 'rgba(78, 156, 110, 0.12)',
                              borderColor: 'rgba(78, 156, 110, 0.25)',
                              color: 'var(--accent)',
                            }}
                          >
                            {role.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold transition-colors group-hover:text-[var(--accent)] font-display" style={{ color: 'var(--text-primary)' }}>
                              {role}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              <span className="flex items-center gap-1.5">
                                <FaCalendarAlt size={10} />
                                {fmtDate(item.createdAt || item.created_at)}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1.5">
                                <FaClock size={10} />
                                {fmtTime(item.createdAt || item.created_at)}
                              </span>
                              <span>·</span>
                              <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                                {item.mode || item.interview_mode || 'Technical'} Mode
                              </span>
                              {item.rubric_id && item.rubric_id !== 'auto' && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[10px]">{item.rubric_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          {/* Integrity flags */}
                          {flagCount > 0 && (
                            <span className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                              <FaExclamationTriangle size={9} /> {flagCount}
                            </span>
                          )}

                          {/* Percentile */}
                          {item.percentile != null && (
                            <span className="hidden sm:block text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              Top <span className="font-bold" style={{ color: 'var(--accent)' }}>{Math.round(item.percentile)}%</span>
                            </span>
                          )}

                          {/* Score */}
                          <div className="text-right">
                            <p className="text-base font-extrabold font-display" style={{ color: score != null && score >= 7 ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {score != null ? `${score.toFixed(1)}/10` : '—'}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</p>
                          </div>

                          {/* Status badge */}
                          <span
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5"
                            style={{
                              backgroundColor: 'rgba(78, 156, 110, 0.12)',
                              borderColor: 'rgba(78, 156, 110, 0.25)',
                              color: 'var(--accent)',
                            }}
                          >
                            <FaCheckCircle size={9} /> Completed
                          </span>

                          {/* View report */}
                          <div
                            className="w-8 h-8 rounded-full border flex items-center justify-center transition-all group-hover:border-[var(--accent)]"
                            style={{
                              backgroundColor: 'var(--bg-page)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <BsArrowRight size={14} className="group-hover:text-[var(--accent)]" />
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </V2Layout>
  )
}
