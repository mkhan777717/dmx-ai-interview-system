import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import V2Layout from '../components/V2Layout'
import {
  BsStars, BsArrowRight
} from 'react-icons/bs'
import {
  FaCalendarCheck, FaChartLine, FaRegClock,
} from 'react-icons/fa'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useNavigate } from 'react-router-dom'
import GradientButton from '../components/ui/GradientButton'
import Badge from '../components/ui/Badge'
import { useTheme } from '../context/ThemeContext'

const COLORS = ['#4E9C6E', '#7C6FEA', '#3B82F6', '#10B981', '#F0993D']

export default function Dashboard() {
  const { userData } = useSelector((state) => state.user)
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

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

  const totalScore = completed.reduce((acc, curr) => acc + (curr.finalScore || curr.final_score || 0), 0)
  const avgScore = completed.length > 0 ? Math.round((totalScore / completed.length) * 10) : 0

  const totalMins = completed.length * 25
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const recentInterviews = [...completed].reverse().slice(0, 5)

  const roleCounts = {}
  completed.forEach(i => {
    const r = i.role || i.predicted_role || 'Technical'
    roleCounts[r] = (roleCounts[r] || 0) + 1
  })
  const roleData = Object.keys(roleCounts).map(key => ({ name: key, value: roleCounts[key] }))
    .sort((a, b) => b.value - a.value).slice(0, 5)

  const trendMap = {}
  completed.forEach(i => {
    const d = new Date(i.createdAt || i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!trendMap[d]) trendMap[d] = { count: 0, total: 0 }
    trendMap[d].count += 1
    trendMap[d].total += (i.finalScore || i.final_score || 0) * 10
  })
  const scoreTrendData = Object.keys(trendMap).map(key => ({
    name: key,
    score: Math.round(trendMap[key].total / trendMap[key].count),
  })).slice(-7)

  const headerLeft = (
    <div>
      <h1 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--text-primary)' }}>
        Welcome back, <span className="text-[var(--accent)] font-semibold">{userData?.name?.split(' ')[0] || 'User'}</span>! 👋
      </h1>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Here is your practice performance summary for today.</p>
    </div>
  )

  const headerRight = (
    <div className="flex items-center gap-3">
      <GradientButton
        onClick={() => navigate('/v2/interview')}
        size="sm"
        icon={BsStars}
      >
        Start Practice Session
      </GradientButton>
    </div>
  )

  return (
    <V2Layout headerLeft={headerLeft} headerRight={headerRight}>
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">

        {/* ── TOP STAT CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Completed */}
          <div
            className="rounded-3xl p-5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>Completed Sessions</span>
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <FaCalendarCheck size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>{completed.length}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                +12% this week
              </span>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Recorded full evaluations</p>
          </div>

          {/* Card 2: Avg Score */}
          <div
            className="rounded-3xl p-5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>Average Score</span>
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <FaChartLine size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>{avgScore > 0 ? avgScore : '—'}%</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                {avgScore >= 75 ? 'Ready for Offer' : 'Keep Practicing'}
              </span>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Across all technical rounds</p>
          </div>

          {/* Card 3: Practice Hours */}
          <div
            className="rounded-3xl p-5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>Time in Studio</span>
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <FaRegClock size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>{hours}h {mins}m</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                Active Streak
              </span>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Real-time speech & code</p>
          </div>

          {/* Card 4: Top Skill Tier */}
          <div
            className="rounded-3xl p-5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>Top Role Readiness</span>
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'rgba(78, 156, 110, 0.12)',
                  borderColor: 'rgba(78, 156, 110, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <BsStars size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-display tracking-tight truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
                {roleData[0]?.name || 'Full-Stack'}
              </span>
            </div>
            <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--accent)' }}>Tier 1 Target Alignment</p>
          </div>
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Performance Trend Area Chart */}
          <div
            className="lg:col-span-2 rounded-3xl p-6 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Score Progression Over Time</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Historical average scores across completed interview sessions</p>
              </div>
              <Badge variant="accent">7 Sessions</Badge>
            </div>

            <div className="h-64 w-full">
              {scoreTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4E9C6E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4E9C6E" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#FFFFFF' : '#0A0A0A',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4E9C6E"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Complete your first interview session to render progression trend.
                </div>
              )}
            </div>
          </div>

          {/* Role Distribution Pie Chart */}
          <div
            className="rounded-3xl p-6 flex flex-col justify-between border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Target Domains</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sessions grouped by job family</p>
                </div>
              </div>

              <div className="h-44 w-full relative">
                {roleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#16161A' : '#FFFFFF',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: isDark ? '#FFFFFF' : '#0A0A0A',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No domain data yet
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              {roleData.slice(0, 3).map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium truncate max-w-[130px]" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: 'var(--text-muted)' }}>{r.value} session{r.value > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RECENT SESSIONS TABLE ────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-6 border shadow-sm"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Recent Practice Sessions</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Click any session to open the full diagnostic scorecard</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-bold transition flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-full border hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
            >
              <span>View All History</span>
              <BsArrowRight size={11} />
            </button>
          </div>

          {recentInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b font-bold uppercase tracking-wider text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <th className="pb-3 px-3">Role & Track</th>
                    <th className="pb-3 px-3">Mode</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Score</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {recentInterviews.map((item, idx) => {
                    const reportId = item.id || item._id
                    const roleName = item.role || item.predicted_role || 'Technical Interview'
                    const score = (item.finalScore ?? item.final_score ?? 0) * 10

                    return (
                      <tr
                        key={idx}
                        onClick={() => navigate(`/report/${reportId}`)}
                        className="transition-colors cursor-pointer group hover:bg-[var(--accent)]/5"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                              style={{
                                backgroundColor: 'rgba(78, 156, 110, 0.12)',
                                borderColor: 'rgba(78, 156, 110, 0.25)',
                                color: 'var(--accent)',
                              }}
                            >
                              {roleName.charAt(0)}
                            </div>
                            <span className="font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>
                              {roleName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className="px-2.5 py-1 rounded-md font-semibold text-[11px] border"
                            style={{
                              backgroundColor: 'var(--bg-page)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {item.mode || item.interview_mode || 'Technical'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
                            {Math.round(score)} / 100
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: 'rgba(78, 156, 110, 0.12)',
                              borderColor: 'rgba(78, 156, 110, 0.25)',
                              color: 'var(--accent)',
                            }}
                          >
                            Completed
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-bold text-xs transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }}>
                            View Report →
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
              <p>No practice sessions completed yet. Start your first session to begin tracking performance!</p>
            </div>
          )}
        </div>

      </div>
    </V2Layout>
  )
}
