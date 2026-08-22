import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import V2Layout from '../components/V2Layout'
import { motion } from 'motion/react'
import {
  BsSearch, BsChevronDown,
  BsThreeDots, BsArrowRight, BsStars,
} from 'react-icons/bs'
import {
  FaCalendarAlt, FaCalendarCheck, FaChartLine, FaRegClock,
} from 'react-icons/fa'
import { HiOutlineLightBulb } from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useNavigate } from 'react-router-dom'
import GradientButton from '../components/ui/GradientButton'
import Badge from '../components/ui/Badge'
import GlassCard from '../components/ui/GlassCard'

const COLORS = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981', '#f59e0b']

export default function Dashboard() {
  const { userData } = useSelector((state) => state.user)
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

  let exc = 0, good = 0, avg = 0, needs = 0
  completed.forEach(i => {
    const score = (i.finalScore || i.final_score || 0) * 10
    if (score >= 80) exc++
    else if (score >= 60) good++
    else if (score >= 40) avg++
    else needs++
  })

  const headerLeft = (
    <div>
      <h1 className="text-xl font-bold text-white flex items-center gap-2 font-['Outfit']">
        Welcome back, <span className="font-calligraphy italic font-normal text-cyan-400">{userData?.name?.split(' ')[0] || 'User'}</span>! 👋
      </h1>
      <p className="text-slate-400 text-xs mt-0.5">Here is your practice performance summary for today.</p>
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
          <div className="glass-card-static rounded-3xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Completed Sessions</span>
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <FaCalendarCheck size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">{completed.length}</span>
              <span className="text-xs text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                +12% this week
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Recorded full evaluations</p>
          </div>

          {/* Card 2: Avg Score */}
          <div className="glass-card-static rounded-3xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Average Score</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <FaChartLine size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">{avgScore > 0 ? avgScore : '—'}%</span>
              <span className="text-xs text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {avgScore >= 75 ? 'Ready for Offer' : 'Keep Practicing'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Across all technical rounds</p>
          </div>

          {/* Card 3: Practice Hours */}
          <div className="glass-card-static rounded-3xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Time in Studio</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <FaRegClock size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">{hours}h {mins}m</span>
              <span className="text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Active Streak
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Real-time speech & code</p>
          </div>

          {/* Card 4: Top Skill Tier */}
          <div className="glass-card-static rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Top Role Readiness</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <BsStars size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white font-['Outfit'] tracking-tight truncate max-w-[160px]">
                {roleData[0]?.name || 'Full-Stack'}
              </span>
            </div>
            <p className="text-xs text-emerald-400 mt-2 font-semibold">Tier 1 Target Alignment</p>
          </div>
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Performance Trend Area Chart */}
          <div className="lg:col-span-2 glass-card-static rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">Score Progression Over Time</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical average scores across completed interview sessions</p>
              </div>
              <Badge variant="cyan">7 Sessions</Badge>
            </div>

            <div className="h-64 w-full">
              {scoreTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b1120',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                  Complete your first interview session to render progression trend.
                </div>
              )}
            </div>
          </div>

          {/* Role Distribution Pie Chart */}
          <div className="glass-card-static rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">Target Domains</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sessions grouped by job family</p>
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
                          backgroundColor: '#0b1120',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No domain data yet
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/8">
              {roleData.slice(0, 3).map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">{r.name}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold">{r.value} session{r.value > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RECENT SESSIONS TABLE ────────────────────────────────────────── */}
        <div className="glass-card-static rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">Recent Practice Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click any session to open the full diagnostic scorecard</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition flex items-center gap-1.5 cursor-pointer glass-pill px-3 py-1.5 rounded-full"
            >
              <span>View All History</span>
              <BsArrowRight size={11} />
            </button>
          </div>

          {recentInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/8 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Role & Track</th>
                    <th className="pb-3 px-3">Mode</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Score</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {recentInterviews.map((item, idx) => {
                    const reportId = item.id || item._id
                    const roleName = item.role || item.predicted_role || 'Technical Interview'
                    const score = (item.finalScore ?? item.final_score ?? 0) * 10

                    return (
                      <tr
                        key={idx}
                        onClick={() => navigate(`/report/${reportId}`)}
                        className="hover:bg-slate-100/60 dark:hover:bg-white/3 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-500/30">
                              {roleName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                              {roleName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200 dark:border-white/5">
                            {item.mode || item.interview_mode || 'Technical'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                            {Math.round(score)} / 100
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                            Completed
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors font-bold text-xs">
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
            <div className="text-center py-12 text-slate-400 text-xs">
              <p>No practice sessions completed yet. Start your first session to begin tracking performance!</p>
            </div>
          )}
        </div>

      </div>
    </V2Layout>
  )
}
