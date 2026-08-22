import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { motion, AnimatePresence } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  FaSpinner, FaUsers, FaChartBar,
  FaExclamationTriangle, FaSearch, FaTimes, FaEdit, FaSave,
  FaRobot, FaUserEdit, FaTrophy, FaListOl,
} from 'react-icons/fa'
import { BsClipboardData, BsGraphUp, BsShieldCheck } from 'react-icons/bs'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import Badge from '../components/ui/Badge'

const COLORS = ['#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']

const RECOMMENDATION_CONFIG = {
  'Strong Hire': { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', dot: '#06b6d4' },
  'Hire':        { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       dot: '#3b82f6' },
  'Borderline':  { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',    dot: '#f59e0b' },
  'Reject':      { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',          dot: '#ef4444' },
  'Pending':     { bg: 'bg-white/5 text-slate-400 border-white/10',       dot: '#94a3b8' },
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
    try {
      const res = await axios.get(`${ServerUrl}/api/admin/interviews/${id}`, { withCredentials: true })
      setDetail(res.data)
      setOverrideScore(res.data.final_score != null ? String(res.data.final_score) : '')
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'pipeline') loadInterviews(1)
    if (tab === 'analytics') loadAnalytics()
  }, [tab, statusFilter])

  useEffect(() => {
    if (detailId) loadDetail(detailId)
  }, [detailId])

  const handleOverride = async (interviewId) => {
    const scoreNum = parseFloat(overrideScore)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) return alert('Score must be 0–10')
    if (!overrideReason.trim()) return alert('Please provide a reason for the score override.')
    setOverriding(true)
    try {
      await axios.patch(`${ServerUrl}/api/admin/interviews/${interviewId}/score`, {
        final_score: scoreNum,
        reason: overrideReason,
      }, { withCredentials: true })
      setOverrideOpen(null)
      loadDetail(interviewId)
      loadInterviews(pagination.page)
    } catch (e) {
      alert(e.response?.data?.detail || 'Override failed')
    } finally {
      setOverriding(false)
    }
  }

  const filtered = interviews.filter(i => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (i.candidate_name && i.candidate_name.toLowerCase().includes(q)) ||
      (i.candidate_email && i.candidate_email.toLowerCase().includes(q)) ||
      (i.predicted_role && i.predicted_role.toLowerCase().includes(q))
    )
  })

  return (
    <V2Layout
      title="Candidate Pipeline & Telemetry"
      subtitle="Recruiter candidate review, rubric adjustments, and session audit logs."
    >
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/8 pb-3">
          {[
            { id: 'pipeline', icon: <FaUsers size={13} />, label: 'Candidate Pipeline' },
            { id: 'analytics', icon: <FaChartBar size={13} />, label: 'Recruiter Analytics' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                  : 'glass-pill text-slate-400 hover:text-white'
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
            <div className="glass-card-static rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
                <div className="relative w-full">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search candidate name, email, or role..."
                    className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl glass-input text-xs text-white cursor-pointer font-medium"
                >
                  <option value="" className="bg-slate-900">All Statuses</option>
                  <option value="completed" className="bg-slate-900">Completed</option>
                  <option value="in_progress" className="bg-slate-900">In Progress</option>
                </select>

                <span className="text-xs text-slate-400 font-semibold px-3 py-2 glass-panel-subtle rounded-xl">
                  {pagination.total} total interviews
                </span>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="glass-card-static rounded-3xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                  <FaSpinner className="animate-spin text-2xl text-cyan-400 mr-2" />
                  <span className="text-sm">Loading candidates...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                  <BsClipboardData className="text-4xl text-slate-500 opacity-40" />
                  <p className="text-sm font-bold text-white font-['Outfit']">No candidate interviews found</p>
                  <p className="text-xs text-slate-400">Try adjusting your search filter or status.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 px-6">Candidate</th>
                        <th className="pb-3 px-6">Role</th>
                        <th className="pb-3 px-6">Status</th>
                        <th className="pb-3 px-6">Score</th>
                        <th className="pb-3 px-6">Recommendation</th>
                        <th className="pb-3 px-6">Flags</th>
                        <th className="pb-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filtered.map(i => {
                        const rec = i.hiring_recommendation || 'Pending'
                        const cfg = RECOMMENDATION_CONFIG[rec] || RECOMMENDATION_CONFIG.Pending
                        const flagCount = (i.integrity_flags || []).length
                        const score = i.final_score != null ? i.final_score : 0

                        return (
                          <tr key={i.id} className="hover:bg-white/3 transition group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-white text-xs font-['Outfit'] group-hover:text-cyan-300 transition-colors">{i.candidate_name || 'Candidate'}</div>
                              {i.candidate_email && <div className="text-[11px] text-slate-400">{i.candidate_email}</div>}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-300 text-xs">
                              {i.predicted_role || 'Technical Interview'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                i.status === 'completed'
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              }`}>
                                {i.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-xs">
                              <span className={score >= 7 ? 'text-cyan-400' : score >= 5 ? 'text-amber-400' : 'text-rose-400'}>
                                {i.final_score != null ? `${i.final_score.toFixed(1)} / 10` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg}`}>
                                {rec}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {flagCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <FaExclamationTriangle size={9} /> {flagCount} Flag(s)
                                </span>
                              ) : (
                                <span className="text-cyan-400 text-[11px] font-semibold">✓ Clean</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => { setDetailId(i.id); setDetail(null) }}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 font-bold text-xs transition cursor-pointer"
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
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-400">
                <FaSpinner className="animate-spin text-2xl text-cyan-400 mr-2" />
                <span className="text-sm">Loading analytics...</span>
              </div>
            ) : !analytics ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <BsGraphUp className="text-4xl text-slate-600" />
                <p className="text-sm font-bold text-white font-['Outfit']">No analytics data yet</p>
                <p className="text-xs">Complete some interviews to see recruiter analytics.</p>
              </div>
            ) : (
              <>
                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Completed Interviews', value: analytics.summary?.total_completed ?? 0, icon: FaUsers, color: 'cyan' },
                    { label: 'Avg Candidate Score', value: analytics.summary?.avg_score != null ? `${analytics.summary.avg_score}/10` : '—', icon: FaTrophy, color: 'indigo' },
                    { label: 'AI-Flagged Answers', value: analytics.summary?.ai_flagged_answers ?? 0, icon: FaRobot, color: 'amber' },
                    { label: 'Human Overrides', value: analytics.summary?.total_human_overrides ?? 0, icon: FaUserEdit, color: 'rose' },
                  ].map(({ label, value, icon: Icon, color }) => {
                    const colors = {
                      cyan:   { bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   border: 'border-cyan-500/20',   val: 'text-cyan-300' },
                      indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20', val: 'text-indigo-300' },
                      amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20',  val: 'text-amber-300' },
                      rose:   { bg: 'bg-rose-500/10',   icon: 'text-rose-400',   border: 'border-rose-500/20',   val: 'text-rose-300' },
                    }
                    const c = colors[color]
                    return (
                      <div key={label} className="glass-card-static rounded-3xl p-5 flex items-center gap-4 group hover:border-cyan-500/25 transition-all">
                        <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center ${c.icon} border ${c.border} shrink-0`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                          <p className={`text-2xl font-extrabold font-['Outfit'] ${c.val}`}>{value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Score Distribution + Role Distribution ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Score Distribution */}
                  <div className="glass-card-static rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <BsGraphUp className="text-cyan-400" size={16} />
                      <h3 className="font-bold text-white font-['Outfit']">Score Distribution</h3>
                      <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {analytics.summary?.total_completed ?? 0} candidates
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={analytics.score_distribution || []}
                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                          itemStyle={{ color: '#06b6d4' }}
                          cursor={{ fill: 'rgba(6,182,212,0.05)' }}
                        />
                        <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>
                          {(analytics.score_distribution || []).map((entry, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Role Distribution */}
                  <div className="glass-card-static rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <FaUsers className="text-indigo-400" size={15} />
                      <h3 className="font-bold text-white font-['Outfit']">Interviews by Role</h3>
                      <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {(analytics.role_distribution || []).length} roles
                      </span>
                    </div>
                    {(analytics.role_distribution || []).length === 0 ? (
                      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={(analytics.role_distribution || []).slice(0, 8)}
                          layout="vertical"
                          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis
                            type="category" dataKey="role"
                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                            axisLine={false} tickLine={false} width={120}
                          />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                            labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                            itemStyle={{ color: '#818cf8' }}
                            cursor={{ fill: 'rgba(129,140,248,0.05)' }}
                          />
                          <Bar dataKey="count" name="Interviews" radius={[0, 6, 6, 0]}>
                            {(analytics.role_distribution || []).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ── Per-Question Performance Table ── */}
                {(analytics.question_analytics || []).length > 0 && (
                  <div className="glass-card-static rounded-3xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                      <FaListOl className="text-cyan-400" size={14} />
                      <h3 className="font-bold text-white font-['Outfit']">Per-Question Performance</h3>
                      <span className="ml-auto text-[10px] font-bold text-slate-400">{analytics.question_analytics.length} questions</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-5 pb-3 pt-3 text-left">#</th>
                            <th className="px-5 pb-3 pt-3 text-left">Question</th>
                            <th className="px-5 pb-3 pt-3 text-center">Attempts</th>
                            <th className="px-5 pb-3 pt-3 text-center">Avg Score</th>
                            <th className="px-5 pb-3 pt-3 text-left w-48">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {analytics.question_analytics.map((q) => {
                            const passColor = q.pass_rate >= 60 ? '#06b6d4' : q.pass_rate >= 40 ? '#f59e0b' : '#ef4444'
                            const scoreColor = q.avg_score >= 7 ? '#06b6d4' : q.avg_score >= 5 ? '#f59e0b' : '#ef4444'
                            return (
                              <tr key={q.question_index} className="hover:bg-white/3 transition">
                                <td className="px-5 py-3.5">
                                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-[10px] font-extrabold flex items-center justify-center">
                                    {q.question_index}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 max-w-xs">
                                  <p className="text-slate-200 font-medium leading-snug line-clamp-2">{q.question_text}</p>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="font-bold text-slate-300">{q.attempts}</span>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="font-extrabold font-['Outfit']" style={{ color: scoreColor }}>
                                    {q.avg_score.toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${q.pass_rate}%`, background: passColor }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold w-9 text-right" style={{ color: passColor }}>
                                      {q.pass_rate}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Drop-off Funnel + AI & Override Summary ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Drop-off Funnel */}
                  {(analytics.drop_off_funnel || []).length > 0 && (
                    <div className="glass-card-static rounded-3xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <FaChartBar className="text-indigo-400" size={14} />
                        <h3 className="font-bold text-white font-['Outfit']">Answer Volume by Question</h3>
                        <span className="ml-auto text-xs text-slate-400">Drop-off funnel</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.drop_off_funnel} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis
                            dataKey="question_index" tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false} tickLine={false} label={{ value: 'Q #', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 9 }}
                          />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                            labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                            itemStyle={{ color: '#818cf8' }}
                            cursor={{ fill: 'rgba(129,140,248,0.05)' }}
                          />
                          <Bar dataKey="count" name="Responses" fill="#818cf8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* AI Detection + Override Summary */}
                  <div className="glass-card-static rounded-3xl p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                      <BsShieldCheck className="text-cyan-400" size={16} />
                      <h3 className="font-bold text-white font-['Outfit']">Integrity Summary</h3>
                    </div>

                    {/* AI Detection rate */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <FaRobot className="text-amber-400" size={11} /> AI-Assisted Answers
                        </span>
                        <span className="font-extrabold text-amber-300">
                          {analytics.summary?.ai_flagged_answers ?? 0}
                          <span className="text-slate-400 font-medium text-[10px] ml-1">
                            / {analytics.summary?.total_answers ?? 0} answers
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{
                            width: analytics.summary?.total_answers > 0
                              ? `${Math.min(((analytics.summary.ai_flagged_answers || 0) / analytics.summary.total_answers) * 100, 100)}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Flagged when AI detection probability &gt; 50%
                      </p>
                    </div>

                    {/* Human Override rate */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <FaUserEdit className="text-rose-400" size={11} /> Recruiter Overrides
                        </span>
                        <span className="font-extrabold text-rose-300">
                          {analytics.summary?.total_human_overrides ?? 0}
                          <span className="text-slate-400 font-medium text-[10px] ml-1">overrides applied</span>
                        </span>
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-400 rounded-full transition-all duration-700"
                          style={{
                            width: analytics.summary?.total_completed > 0
                              ? `${Math.min(((analytics.summary.total_human_overrides || 0) / analytics.summary.total_completed) * 100, 100)}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Score adjustments made by recruiters after AI evaluation
                      </p>
                    </div>

                    {/* Pass/fail summary */}
                    <div className="pt-2 border-t border-white/8">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Recommendation Breakdown</p>
                      <div className="space-y-2">
                        {(analytics.score_distribution || []).map((bucket) => {
                          const total = (analytics.score_distribution || []).reduce((s, b) => s + b.count, 0)
                          const pct = total > 0 ? Math.round((bucket.count / total) * 100) : 0
                          const color = bucket.label.includes('Excellent') ? '#06b6d4'
                            : bucket.label.includes('Good') ? '#3b82f6'
                            : bucket.label.includes('Average') ? '#f59e0b'
                            : '#ef4444'
                          return (
                            <div key={bucket.label} className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-slate-300 w-36 shrink-0">{bucket.label}</span>
                              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{bucket.count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── DETAIL MODAL ── */}
        <AnimatePresence>
          {detailId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-slate-950/90 rounded-3xl p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto relative"
              >
                <button
                  onClick={() => setDetailId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 transition cursor-pointer"
                >
                  <FaTimes size={15} />
                </button>

                {detailLoading || !detail ? (
                  <div className="flex items-center justify-center py-20 text-slate-400">
                    <FaSpinner className="animate-spin text-2xl text-cyan-400 mr-2" />
                    <span>Loading details...</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-bold text-xl text-white font-['Outfit']">{detail.candidate_name || 'Candidate Review'}</h3>
                      <p className="text-xs text-slate-400">{detail.predicted_role} · {detail.candidate_email}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="glass-panel-subtle p-3 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Final Score</p>
                        <p className="text-xl font-extrabold text-cyan-300 font-['Outfit'] mt-1">{detail.final_score != null ? `${detail.final_score.toFixed(1)}/10` : '—'}</p>
                      </div>
                      <div className="glass-panel-subtle p-3 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Recommendation</p>
                        <p className="text-xs font-bold text-white mt-2">{detail.hiring_recommendation || 'Pending'}</p>
                      </div>
                      <div className="glass-panel-subtle p-3 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Questions</p>
                        <p className="text-xl font-extrabold text-white font-['Outfit'] mt-1">{detail.questions?.length || 0}</p>
                      </div>
                      <div className="glass-panel-subtle p-3 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Integrity Flags</p>
                        <p className="text-xl font-extrabold text-amber-400 font-['Outfit'] mt-1">{(detail.integrity_flags || []).length}</p>
                      </div>
                    </div>

                    {/* Questions & Feedback */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-sm text-white font-['Outfit']">Questions & Candidate Responses</h4>
                      {detail.questions?.map((q, idx) => (
                        <div key={idx} className="glass-panel-subtle p-4 rounded-2xl text-xs space-y-1.5">
                          <div className="flex justify-between items-center font-bold text-white">
                            <span>Q{idx + 1}: {q.question}</span>
                            <span className="text-cyan-400 font-extrabold">{q.final_score != null ? `${q.final_score.toFixed(1)}/10` : '—'}</span>
                          </div>
                          {q.feedback && <p className="text-slate-300 text-[11px] leading-relaxed"><strong className="text-cyan-300">Feedback:</strong> {q.feedback}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/8 flex justify-end">
                      <SecondaryButton onClick={() => setDetailId(null)} size="sm">
                        Close Review
                      </SecondaryButton>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </V2Layout>
  )
}
