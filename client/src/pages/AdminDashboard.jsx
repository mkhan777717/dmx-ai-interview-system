import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { motion, AnimatePresence } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'
import {
  FaSpinner, FaUsers, FaChartBar,
  FaSearch, FaTimes, FaEdit, FaSave,
  FaRobot, FaUserEdit, FaTrophy,
} from 'react-icons/fa'
import { BsClipboardData } from 'react-icons/bs'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import { useTheme } from '../context/ThemeContext'

const COLORS = ['#4E9C6E', '#7C6FEA', '#3B82F6', '#F0993D', '#EF4444', '#EC4899']

const RECOMMENDATION_CONFIG = {
  'Strong Hire': { bg: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30', dot: '#4E9C6E' },
  'Hire':        { bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30', dot: '#3B82F6' },
  'Borderline':  { bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30', dot: '#F0993D' },
  'Reject':      { bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30', dot: '#EF4444' },
  'Pending':     { bg: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]', dot: '#6B7280' },
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
  const { isDark } = useTheme()

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
      <div className="space-y-6 max-w-[1400px] mx-auto w-full font-body">

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'pipeline', icon: <FaUsers size={13} />, label: 'Candidate Pipeline' },
            { id: 'analytics', icon: <FaChartBar size={13} />, label: 'Recruiter Analytics' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                tab === t.id
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30 shadow-xs'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: tab === t.id ? 'rgba(78, 156, 110, 0.12)' : 'var(--bg-elevated)',
                borderColor: tab === t.id ? 'var(--accent)' : 'var(--border)',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── PIPELINE TAB ── */}
        {tab === 'pipeline' && (
          <div className="space-y-4">

            {/* Filter Bar */}
            <div
              className="rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
                <div className="relative w-full">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search candidate name, email, or role..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border glass-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs cursor-pointer font-medium border glass-input"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>

                <span
                  className="text-xs font-semibold px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {pagination.total} total interviews
                </span>
              </div>
            </div>

            {/* Candidate Table */}
            <div
              className="rounded-3xl overflow-hidden border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
                  <FaSpinner className="animate-spin text-2xl mr-2" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm">Loading candidates...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: 'var(--text-muted)' }}>
                  <BsClipboardData className="text-4xl opacity-40" />
                  <p className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>No candidate interviews found</p>
                  <p className="text-xs">Try adjusting your search filter or status.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        <th className="pb-3 px-6 pt-4">Candidate</th>
                        <th className="pb-3 px-6 pt-4">Role</th>
                        <th className="pb-3 px-6 pt-4">Status</th>
                        <th className="pb-3 px-6 pt-4">Score</th>
                        <th className="pb-3 px-6 pt-4">Recommendation</th>
                        <th className="pb-3 px-6 pt-4">Flags</th>
                        <th className="pb-3 px-6 pt-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border)' }}>
                      {filtered.map(i => {
                        const rec = i.hiring_recommendation || 'Pending'
                        const cfg = RECOMMENDATION_CONFIG[rec] || RECOMMENDATION_CONFIG.Pending
                        const flagCount = (i.integrity_flags || []).length

                        return (
                          <tr
                            key={i.id}
                            className="transition-colors hover:bg-[var(--accent)]/5 cursor-pointer"
                            onClick={() => setDetailId(i.id)}
                          >
                            <td className="py-4 px-6">
                              <p className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>{i.candidate_name || 'Anonymous Candidate'}</p>
                              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{i.candidate_email || 'No email registered'}</p>
                            </td>
                            <td className="py-4 px-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {i.predicted_role || 'General SWE'}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                                style={{
                                  backgroundColor: i.status === 'completed' ? 'rgba(78, 156, 110, 0.12)' : 'rgba(240, 153, 61, 0.12)',
                                  borderColor: i.status === 'completed' ? 'rgba(78, 156, 110, 0.25)' : 'rgba(240, 153, 61, 0.25)',
                                  color: i.status === 'completed' ? 'var(--accent)' : '#F0993D',
                                }}
                              >
                                {i.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-extrabold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
                                {i.final_score != null ? `${i.final_score.toFixed(1)}/10` : '—'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg}`}>
                                {rec}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {flagCount > 0 ? (
                                <span className="text-amber-500 font-bold text-xs">⚠️ {flagCount}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailId(i.id) }}
                                className="px-3 py-1 text-xs font-bold transition rounded-lg border hover:border-[var(--accent)]"
                                style={{
                                  backgroundColor: 'var(--bg-page)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--accent)',
                                }}
                              >
                                Review
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
              <div className="flex items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
                <FaSpinner className="animate-spin text-2xl mr-2" style={{ color: 'var(--accent)' }} />
                <span className="text-sm">Calculating recruiter analytics...</span>
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Histogram */}
                <div
                  className="rounded-3xl p-6 border shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <h3 className="font-bold text-base mb-4 font-display" style={{ color: 'var(--text-primary)' }}>Candidate Score Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.score_distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="range" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: isDark ? '#FFFFFF' : '#0A0A0A',
                          }}
                        />
                        <Bar dataKey="count" fill="#4E9C6E" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recommendation Breakdown */}
                <div
                  className="rounded-3xl p-6 border shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <h3 className="font-bold text-base mb-4 font-display" style={{ color: 'var(--text-primary)' }}>Hiring Recommendations Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.recommendation_breakdown || []}
                          dataKey="count"
                          nameKey="recommendation"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                        >
                          {(analytics.recommendation_breakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: isDark ? '#FFFFFF' : '#0A0A0A',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No recruiter analytics available.</p>
            )}
          </div>
        )}

      </div>
    </V2Layout>
  )
}
