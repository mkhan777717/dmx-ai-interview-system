import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { motion, AnimatePresence } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  FaSpinner, FaUsers, FaChartBar,
  FaExclamationTriangle, FaSearch, FaTimes, FaEdit, FaSave,
} from 'react-icons/fa'
import { BsClipboardData } from 'react-icons/bs'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']

const RECOMMENDATION_CONFIG = {
  'Strong Hire': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: '#10b981' },
  'Hire':        { bg: 'bg-blue-50 text-blue-700 border-blue-100',       dot: '#3b82f6' },
  'Borderline':  { bg: 'bg-amber-50 text-amber-700 border-amber-100',    dot: '#f59e0b' },
  'Reject':      { bg: 'bg-red-50 text-red-700 border-red-100',          dot: '#ef4444' },
  'Pending':     { bg: 'bg-gray-50 text-gray-600 border-gray-100',       dot: '#9ca3af' },
}

export default function AdminDashboard() {
  const [tab, setTab]                   = useState('pipeline')
  const [interviews, setInterviews]     = useState([])
  const [analytics, setAnalytics]       = useState(null)
  const [loading, setLoading]           = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailId, setDetailId]         = useState(null)
  const [detail, setDetail]             = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(null)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overriding, setOverriding]     = useState(false)

  const loadInterviews = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: 15 })
      if (statusFilter) params.set('status', statusFilter)
      const res = await axios.get(`${ServerUrl}/api/admin/interviews?${params}`, { withCredentials: true })
      setInterviews(res.data.interviews || [])
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await axios.get(`${ServerUrl}/api/admin/analytics`, { withCredentials: true })
      setAnalytics(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadDetail = async (id) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await axios.get(`${ServerUrl}/api/admin/interviews/${id}`, { withCredentials: true })
      setDetail(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => { loadInterviews() }, [statusFilter])
  useEffect(() => { if (tab === 'analytics') loadAnalytics() }, [tab])
  useEffect(() => { if (detailId) loadDetail(detailId) }, [detailId])

  const filtered = interviews.filter(i =>
    !search || (i.candidate_name || '').toLowerCase().includes(search.toLowerCase())
      || (i.predicted_role || '').toLowerCase().includes(search.toLowerCase())
      || (i.candidate_email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleOverride = async () => {
    const score = parseFloat(overrideScore)
    if (isNaN(score) || score < 0 || score > 10 || !overrideReason.trim()) return
    setOverriding(true)
    try {
      await axios.patch(
        `${ServerUrl}/api/admin/answers/${overrideOpen}/override`,
        { new_score: score, reason: overrideReason },
        { withCredentials: true }
      )
      setOverrideOpen(null)
      setOverrideScore('')
      setOverrideReason('')
      if (detailId) loadDetail(detailId)
    } catch (e) {
      console.error(e)
    } finally {
      setOverriding(false)
    }
  }

  return (
    <V2Layout
      title="Candidate Pipeline"
      subtitle="Review candidate submissions, score evaluations, and recruiter analytics"
    >
      <div className="max-w-[1400px] mx-auto w-full p-6 lg:p-8 space-y-6">

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          {[
            { id: 'pipeline', icon: <FaUsers size={13} />, label: 'Candidate Pipeline' },
            { id: 'analytics', icon: <FaChartBar size={13} />, label: 'Recruiter Analytics' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                tab === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── PIPELINE TAB ── */}
        {tab === 'pipeline' && (
          <div className="space-y-4">

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
                <div className="relative w-full">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search candidate name, email, or role..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none cursor-pointer font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>

                <span className="text-xs text-gray-500 font-semibold px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  {pagination.total} total interviews
                </span>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <FaSpinner className="animate-spin text-2xl text-green-600 mr-2" />
                  <span className="text-sm">Loading candidates...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                  <BsClipboardData className="text-4xl text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">No candidate interviews found</p>
                  <p className="text-xs text-gray-400">Try adjusting your search filter or status.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <th className="px-6 py-3.5">Candidate</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Score</th>
                        <th className="px-6 py-3.5">Recommendation</th>
                        <th className="px-6 py-3.5">Flags</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map(i => {
                        const rec = i.hiring_recommendation || 'Pending'
                        const cfg = RECOMMENDATION_CONFIG[rec] || RECOMMENDATION_CONFIG.Pending
                        const flagCount = (i.integrity_flags || []).length
                        const score = i.final_score != null ? i.final_score : 0

                        return (
                          <tr key={i.id} className="hover:bg-gray-50/60 transition">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900 text-sm">{i.candidate_name || 'Candidate'}</div>
                              {i.candidate_email && <div className="text-xs text-gray-500">{i.candidate_email}</div>}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-700 text-sm">
                              {i.predicted_role || 'Technical Interview'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                i.status === 'completed'
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {i.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-sm">
                              <span className={score >= 7 ? 'text-green-600' : score >= 5 ? 'text-amber-600' : 'text-red-600'}>
                                {i.final_score != null ? `${i.final_score.toFixed(1)} / 10` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                                {rec}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {flagCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold">
                                  <FaExclamationTriangle size={10} /> {flagCount} Flag(s)
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs font-semibold">✓ Clean</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => { setDetailId(i.id); setDetail(null) }}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 font-semibold text-xs transition cursor-pointer"
                              >
                                Review →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => loadInterviews(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      p === pagination.page
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          analyticsLoading ? (
            <div className="flex justify-center py-20 text-gray-400">
              <FaSpinner className="animate-spin text-2xl text-green-600" />
            </div>
          ) : analytics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Completed', value: analytics.summary.total_completed, icon: '✅' },
                  { label: 'Avg Score', value: `${analytics.summary.avg_score}/10`, icon: '📊' },
                  { label: 'Total Answers', value: analytics.summary.total_answers, icon: '💬' },
                  { label: 'AI Flagged', value: analytics.summary.ai_flagged_answers, icon: '🛡️' },
                  { label: 'Human Overrides', value: analytics.summary.total_human_overrides, icon: '✏️' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                    <div className="text-xs text-gray-500 font-medium">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.score_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.score_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Role Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.role_distribution.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="role" type="category" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Candidate Review Modal ── */}
      <AnimatePresence>
        {detailId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-3xl w-full max-w-4xl border border-gray-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {detail?.candidate_name || 'Candidate Review'} — Session #{detailId}
                  </h2>
                  {detail && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {detail.predicted_role} · Overall Score: <span className="font-bold text-gray-900">{detail.final_score?.toFixed(1)} / 10</span>
                    </p>
                  )}
                </div>
                <button onClick={() => setDetailId(null)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer">
                  <FaTimes />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {detailLoading ? (
                  <div className="flex justify-center py-12 text-gray-400">
                    <FaSpinner className="animate-spin text-2xl text-green-600" />
                  </div>
                ) : detail ? (
                  <div className="space-y-4">
                    {(detail.answers || []).map((ans, i) => {
                      const score = ans.final_score != null ? ans.final_score : 0
                      const isOverriding = overrideOpen === ans.id
                      return (
                        <div key={ans.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                              Q{ans.question_index + 1}
                            </span>
                            <p className="text-sm font-bold text-gray-900 flex-1">{ans.question_text}</p>
                            <span className="text-base font-extrabold text-green-600 shrink-0">{score.toFixed(1)} / 10</span>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono leading-relaxed">
                            {ans.candidate_answer || '(No answer text)'}
                          </div>

                          {ans.feedback && (
                            <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-100">
                              <strong className="text-green-700">AI Feedback:</strong> {ans.feedback}
                            </p>
                          )}

                          {/* Override Button */}
                          <div className="pt-1 flex items-center justify-end">
                            <button
                              onClick={() => {
                                setOverrideOpen(isOverriding ? null : ans.id)
                                setOverrideScore(score.toFixed(1))
                                setOverrideReason('')
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-semibold cursor-pointer border border-amber-200"
                            >
                              <FaEdit size={11} /> Override Score
                            </button>
                          </div>

                          {/* Override Panel */}
                          {isOverriding && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                              <p className="font-bold text-amber-900">Score Override (Audit Logged)</p>
                              <div className="flex gap-2">
                                <input
                                  type="number" min="0" max="10" step="0.1"
                                  value={overrideScore}
                                  onChange={e => setOverrideScore(e.target.value)}
                                  placeholder="New score (0-10)"
                                  className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-gray-900"
                                />
                                <input
                                  value={overrideReason}
                                  onChange={e => setOverrideReason(e.target.value)}
                                  placeholder="Reason for score change..."
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-gray-900"
                                />
                                <button
                                  onClick={handleOverride}
                                  disabled={overriding || !overrideReason.trim()}
                                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  {overriding ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </V2Layout>
  )
}
