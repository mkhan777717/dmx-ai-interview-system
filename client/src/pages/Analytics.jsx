import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { FaSpinner, FaChartPie, FaChartLine, FaBullseye } from 'react-icons/fa'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import GradientButton from '../components/ui/GradientButton'
import { useTheme } from '../context/ThemeContext'

const COLORS = ['#4E9C6E', '#7C6FEA', '#3B82F6', '#10B981', '#F0993D', '#EC4899']

export default function Analytics() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const { isDark } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(ServerUrl + '/api/v2/interview/history', { withCredentials: true })
        setInterviews(result.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    getMyInterviews()
  }, [])

  const completed = interviews.filter(i => i.status === 'completed')

  const trendData = completed.map(i => ({
    date: new Date(i.createdAt || i.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: i.finalScore ?? i.final_score ?? 0,
  })).reverse()

  const roleCounts = completed.reduce((acc, curr) => {
    const role = curr.role || curr.predicted_role || 'Technical'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})
  const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }))

  const buckets = { '8.0–10 (Excellent)': 0, '6.5–7.9 (Good)': 0, '5.0–6.4 (Average)': 0, '0.0–4.9 (Needs Work)': 0 }
  completed.forEach(i => {
    const s = i.finalScore ?? i.final_score ?? 0
    if (s >= 8.0) buckets['8.0–10 (Excellent)']++
    else if (s >= 6.5) buckets['6.5–7.9 (Good)']++
    else if (s >= 5.0) buckets['5.0–6.4 (Average)']++
    else buckets['0.0–4.9 (Needs Work)']++
  })
  const distributionData = Object.entries(buckets).map(([name, count]) => ({ name, count }))

  const avgScore = completed.length > 0
    ? (completed.reduce((sum, i) => sum + (i.finalScore ?? i.final_score ?? 0), 0) / completed.length).toFixed(1)
    : '0.0'
  const highestScore = completed.length > 0
    ? Math.max(...completed.map(i => i.finalScore ?? i.final_score ?? 0)).toFixed(1)
    : '0.0'

  return (
    <V2Layout title="Performance Analytics" subtitle="Deep insights into your interview performance, skill breakdown, and progress">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
            <FaSpinner className="animate-spin text-3xl mb-3" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium">Analyzing performance metrics...</p>
          </div>
        ) : completed.length === 0 ? (
          <div
            className="p-12 rounded-3xl text-center flex flex-col items-center justify-center border shadow-sm"
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
              <FaChartPie size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1 font-display" style={{ color: 'var(--text-primary)' }}>Not enough data</h3>
            <p className="text-xs max-w-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Complete at least one mock interview to unlock full analytics, trend graphs, and domain distribution reports.
            </p>
            <GradientButton
              onClick={() => navigate('/v2/interview')}
              size="sm"
            >
              Start Practice Session
            </GradientButton>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                className="rounded-3xl p-6 flex items-center gap-4 border shadow-sm transition-all hover:border-[var(--accent)]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border shrink-0"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.12)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                    color: 'var(--accent)',
                  }}
                >
                  <FaChartLine />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 font-display" style={{ color: 'var(--text-muted)' }}>Average Score</p>
                  <h3 className="text-2xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>{avgScore} / 10</h3>
                </div>
              </div>

              <div
                className="rounded-3xl p-6 flex items-center gap-4 border shadow-sm transition-all hover:border-[var(--accent)]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border shrink-0"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.12)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                    color: 'var(--accent)',
                  }}
                >
                  <FaBullseye />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 font-display" style={{ color: 'var(--text-muted)' }}>Highest Score</p>
                  <h3 className="text-2xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>{highestScore} / 10</h3>
                </div>
              </div>

              <div
                className="rounded-3xl p-6 flex items-center gap-4 border shadow-sm transition-all hover:border-[var(--accent)]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border shrink-0"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.12)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                    color: 'var(--accent)',
                  }}
                >
                  <FaChartPie />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 font-display" style={{ color: 'var(--text-muted)' }}>Completed Sessions</p>
                  <h3 className="text-2xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>{completed.length}</h3>
                </div>
              </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score History */}
              <div
                className="rounded-3xl p-6 border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <h3 className="font-bold text-base mb-4 font-display" style={{ color: 'var(--text-primary)' }}>Score History (Chronological)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4E9C6E" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4E9C6E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          color: isDark ? '#FFFFFF' : '#0A0A0A',
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#4E9C6E" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Score Distribution */}
              <div
                className="rounded-3xl p-6 border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <h3 className="font-bold text-base mb-4 font-display" style={{ color: 'var(--text-primary)' }}>Score Range Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          color: isDark ? '#FFFFFF' : '#0A0A0A',
                        }}
                      />
                      <Bar dataKey="count" fill="#4E9C6E" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Roles Breakdown */}
            <div
              className="rounded-3xl p-6 border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <h3 className="font-bold text-base mb-4 font-display" style={{ color: 'var(--text-primary)' }}>Interviews by Job Domain</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                        {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          color: isDark ? '#FFFFFF' : '#0A0A0A',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {roleData.map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs p-3 rounded-2xl border"
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                      </div>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>{r.value} session(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </V2Layout>
  )
}
