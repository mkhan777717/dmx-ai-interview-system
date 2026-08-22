import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { motion, AnimatePresence } from 'motion/react'
import {
  FaHistory, FaCalendarAlt, FaCheckCircle, FaSpinner,
  FaClock, FaStop, FaChartBar, FaExclamationTriangle,
} from 'react-icons/fa'
import { BsArrowRight, BsClipboardData } from 'react-icons/bs'
import V2Layout from '../components/V2Layout'

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function scoreColor(score) {
  if (score == null) return 'text-slate-400'
  if (score >= 7) return 'text-cyan-300'
  if (score >= 5) return 'text-amber-300'
  return 'text-rose-300'
}

function scoreBg(score) {
  if (score == null) return 'bg-white/5 text-slate-400 border-white/10'
  if (score >= 7) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  if (score >= 5) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
}

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading]       = useState(true)
  const [ending, setEnding]         = useState(null)   // interview id being ended
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

  const completed   = interviews.filter(i => i.status === 'completed')
  const inProgress  = interviews.filter(i => i.status === 'in_progress')

  return (
    <V2Layout
      title="My Interview Reports"
      subtitle="Review your past mock interviews and detailed AI feedback reports"
    >
      <div className="p-4 lg:p-6 max-w-5xl mx-auto w-full space-y-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FaSpinner className="animate-spin text-3xl mb-3 text-cyan-400" />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="glass-card-static p-12 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <BsClipboardData size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">No interviews yet</h3>
            <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
              Complete your first AI mock interview to receive detailed rubric feedback, communication metrics, and progress tracking.
            </p>
            <button
              onClick={() => navigate('/v2/interview')}
              className="px-6 py-3 btn-gradient font-bold text-xs rounded-2xl transition cursor-pointer shadow-md"
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
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-xs font-extrabold text-amber-300 uppercase tracking-widest font-mono">
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
                          className="glass-card-static rounded-3xl p-5 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                              {role.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white font-['Outfit']">{role}</h3>
                              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1.5">
                                  <FaCalendarAlt size={10} className="text-slate-500" />
                                  {fmtDate(item.createdAt || item.created_at)}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="flex items-center gap-1.5">
                                  <FaClock size={10} className="text-slate-500" />
                                  {fmtTime(item.createdAt || item.created_at)}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="text-amber-400 font-bold">
                                  {item.mode || item.interview_mode || 'Technical'} Mode
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              In Progress
                            </span>
                            <button
                              onClick={(e) => handleEndInterview(id, e)}
                              disabled={isEnding}
                              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer disabled:opacity-50"
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
                  <FaCheckCircle className="text-cyan-400" size={13} />
                  <h2 className="text-xs font-extrabold text-cyan-300 uppercase tracking-widest font-mono">
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
                        className="glass-card-static rounded-3xl p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group border border-white/8 hover:border-cyan-500/30 transition-all"
                      >
                        {/* Left */}
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/25 text-cyan-300 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
                            {role.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-['Outfit']">
                              {role}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1.5">
                                <FaCalendarAlt size={10} className="text-slate-500" />
                                {fmtDate(item.createdAt || item.created_at)}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="flex items-center gap-1.5">
                                <FaClock size={10} className="text-slate-500" />
                                {fmtTime(item.createdAt || item.created_at)}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="text-cyan-400 font-semibold">
                                {item.mode || item.interview_mode || 'Technical'} Mode
                              </span>
                              {item.rubric_id && item.rubric_id !== 'auto' && (
                                <>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-slate-400 font-mono text-[10px]">{item.rubric_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          {/* Integrity flags */}
                          {flagCount > 0 && (
                            <span className="hidden sm:flex items-center gap-1 text-amber-300 text-[10px] font-bold">
                              <FaExclamationTriangle size={9} /> {flagCount}
                            </span>
                          )}

                          {/* Percentile */}
                          {item.percentile != null && (
                            <span className="hidden sm:block text-[10px] text-slate-400 font-mono">
                              Top <span className="text-indigo-300 font-bold">{Math.round(item.percentile)}%</span>
                            </span>
                          )}

                          {/* Score */}
                          <div className="text-right">
                            <p className={`text-base font-extrabold font-['Outfit'] ${scoreColor(score)}`}>
                              {score != null ? `${score.toFixed(1)}/10` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</p>
                          </div>

                          {/* Status badge */}
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex items-center gap-1.5">
                            <FaCheckCircle size={9} /> Completed
                          </span>

                          {/* View report */}
                          <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/30 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 transition-all">
                            <BsArrowRight size={14} />
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
