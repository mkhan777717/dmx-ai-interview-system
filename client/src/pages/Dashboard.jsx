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

const COLORS = ['#0f766e', '#6366f1', '#f59e0b', '#8b5cf6', '#ef4444']

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
      <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-['Outfit']">
        Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
      </h1>
      <p className="text-slate-500 text-xs mt-0.5">Here is your practice performance summary for today.</p>
    </div>
  )

  const headerRight = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/v2/interview')}
        className="flex items-center gap-1.5 px-4.5 py-2 glass-btn-primary font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
      >
        <BsStars size={13} /> Start Practice Session
      </button>
    </div>
  )

  return (
    <V2Layout headerLeft={headerLeft} headerRight={headerRight}>
      <div className="p-2 lg:p-4 max-w-[1600px] mx-auto w-full space-y-6">

        {/* ── TOP STATS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Interviews', val: interviews.length.toString(), inc: 'All Time', icn: <FaCalendarCheck size={18} />, c: 'text-teal-700', bg: 'bg-emerald-500/15' },
            { label: 'Completed', val: completed.length.toString(), inc: 'All Time', icn: <FaChartLine size={18} />, c: 'text-indigo-600', bg: 'bg-indigo-500/15' },
            { label: 'Avg. Score', val: `${avgScore}%`, inc: 'Average', icn: <FaRegClock size={18} />, c: 'text-amber-600', bg: 'bg-amber-500/15' },
            { label: 'Total Time', val: `${hours}h ${mins}m`, inc: 'Estimated', icn: <FaRegClock size={18} />, c: 'text-teal-800', bg: 'bg-teal-500/15' },
          ].map((stat, i) => (
            <div key={i} className="glass-card-static rounded-3xl p-5.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.c}`}>
                  {stat.icn}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 mb-0.5">{stat.label}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{stat.val}</h3>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium">
                <span className="text-teal-700 font-bold">Active Tracker</span>
                <span className="text-slate-400">{stat.inc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-6">

            {/* Recent Interviews */}
            <div className="glass-card-static rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Recent Interview Reports</h3>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 cursor-pointer glass-pill px-3 py-1 rounded-full"
                >
                  View All <BsArrowRight />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-3">
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Score</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInterviews.length > 0 ? (
                      recentInterviews.map((row, i) => {
                        const scorePct = Math.round(((row.finalScore || row.final_score || 0) * 10))
                        return (
                          <tr
                            key={i}
                            className="group hover:bg-slate-100/60 transition cursor-pointer"
                            onClick={() => navigate(`/report/${row.id || row._id}`)}
                          >
                            <td className="py-3.5">
                              <span className="font-bold text-sm text-slate-900">{row.role || row.predicted_role || 'Technical Interview'}</span>
                            </td>
                            <td className="py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                {row.mode || row.interview_mode || 'Technical'}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`font-extrabold text-sm ${scorePct >= 80 ? 'text-teal-700' : scorePct >= 60 ? 'text-indigo-600' : 'text-amber-600'}`}>
                                {scorePct}%
                              </span>
                            </td>
                            <td className="py-3.5 text-xs text-slate-500 font-medium">
                              {new Date(row.createdAt || row.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-teal-900 border border-emerald-500/20">
                                Completed
                              </span>
                            </td>
                            <td className="py-3.5 text-xs font-bold text-teal-700 hover:underline">
                              Report →
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-400 text-sm">
                          No recent practice sessions. Click <strong>"Start Practice Session"</strong> to begin!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Score Trend */}
              <div className="glass-card-static rounded-3xl p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-4 font-['Outfit']">Score Progression</h3>
                <div className="h-[180px] w-full">
                  {scoreTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }} />
                        <Area type="monotone" dataKey="score" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <FaChartLine size={28} className="mb-2 opacity-30" />
                      <p className="text-xs">No score data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles Distribution */}
              <div className="glass-card-static rounded-3xl p-6 flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-4 font-['Outfit']">Interviews by Domain</h3>
                <div className="flex-1 flex items-center justify-between">
                  {roleData.length > 0 ? (
                    <>
                      <div className="relative w-[120px] h-[120px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                              {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-extrabold text-slate-900 leading-none font-['Outfit']">{completed.length}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Total</span>
                        </div>
                      </div>
                      <div className="flex-1 pl-4 space-y-2">
                        {roleData.map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-slate-700 font-medium truncate max-w-[100px]">{r.name}</span>
                            </div>
                            <span className="text-slate-600 font-bold">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <p className="text-xs">No role data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-1 space-y-6">

            {/* Performance Overview Gauge */}
            <div className="glass-card-static rounded-3xl p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4 font-['Outfit']">Skill Performance Rating</h3>
              <div className="flex items-center gap-5">
                <div className="relative w-22 h-22 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0f766e" strokeWidth="12" strokeDasharray={`${(251.2 * avgScore) / 100} 251.2`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-slate-900 leading-none font-['Outfit']">{avgScore}%</span>
                    <span className="text-[8px] text-slate-400 font-semibold">Avg Score</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Excellent (80%+)', val: exc, c: 'bg-emerald-500' },
                    { label: 'Good (60-79%)', val: good, c: 'bg-indigo-500' },
                    { label: 'Average (40-59%)', val: avg, c: 'bg-amber-500' },
                    { label: 'Needs Practice (<40%)', val: needs, c: 'bg-rose-500' },
                  ].map((leg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${leg.c}`} />
                        <span className="text-slate-600 font-medium">{leg.label}</span>
                      </div>
                      <span className="font-bold text-slate-900">{leg.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights & Coaching */}
            <div className="glass-card-static rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-['Outfit']">
                <BsStars className="text-teal-700" /> AI Practice Recommendations
              </h3>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-teal-900 flex items-center justify-center shrink-0">
                  <FaChartLine size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Technical Explanations</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Your System Design answers are strong. Focus on trade-off analysis during technical screens.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-900 flex items-center justify-center shrink-0">
                  <HiOutlineLightBulb size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Behavioral STAR Framework</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Structure your behavioral answers with Situation, Task, Action, and Result for higher scoring.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/v2/interview')}
                className="w-full py-3 glass-btn-primary font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Practice Recommended Role</span>
                <BsArrowRight />
              </button>
            </div>

          </div>
        </div>
      </div>
    </V2Layout>
  )
}
