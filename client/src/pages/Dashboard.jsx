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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

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
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
      </h1>
      <p className="text-gray-500 text-xs mt-0.5">Here is your practice performance summary for today.</p>
    </div>
  )

  const headerRight = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/v2/interview')}
        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
      >
        <BsStars size={13} /> Start New Practice
      </button>
    </div>
  )

  return (
    <V2Layout headerLeft={headerLeft} headerRight={headerRight}>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">

        {/* ── TOP STATS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Interviews', val: interviews.length.toString(), inc: 'All Time', icn: <FaCalendarCheck size={18} />, c: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Completed', val: completed.length.toString(), inc: 'All Time', icn: <FaChartLine size={18} />, c: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Avg. Score', val: `${avgScore}%`, inc: 'Average', icn: <FaRegClock size={18} />, c: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Time', val: `${hours}h ${mins}m`, inc: 'Estimated', icn: <FaRegClock size={18} />, c: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.c}`}>
                  {stat.icn}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.val}</h3>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold">Active Tracker</span>
                <span className="text-gray-400">{stat.inc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-6">

            {/* Recent Interviews */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-gray-900 text-base">Recent Interview Reports</h3>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1.5 cursor-pointer"
                >
                  View All <BsArrowRight />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-3">
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Score</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentInterviews.length > 0 ? (
                      recentInterviews.map((row, i) => {
                        const scorePct = Math.round(((row.finalScore || row.final_score || 0) * 10))
                        return (
                          <tr
                            key={i}
                            className="group hover:bg-gray-50/80 transition cursor-pointer"
                            onClick={() => navigate(`/report/${row.id || row._id}`)}
                          >
                            <td className="py-3.5">
                              <span className="font-semibold text-sm text-gray-900">{row.role || row.predicted_role || 'Technical Interview'}</span>
                            </td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                {row.mode || row.interview_mode || 'Technical'}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`font-bold text-sm ${scorePct >= 80 ? 'text-green-600' : scorePct >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                                {scorePct}%
                              </span>
                            </td>
                            <td className="py-3.5 text-xs text-gray-500">
                              {new Date(row.createdAt || row.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                Completed
                              </span>
                            </td>
                            <td className="py-3.5 text-xs font-semibold text-blue-600 hover:underline">
                              Report →
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-gray-400 text-sm">
                          No recent practice sessions. Click <strong>"Start New Practice"</strong> to begin!
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
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Score Trend</h3>
                <div className="h-[180px] w-full">
                  {scoreTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <FaChartLine size={28} className="mb-2 opacity-30" />
                      <p className="text-xs">No score data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles Distribution */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Interviews by Domain</h3>
                <div className="flex-1 flex items-center justify-between">
                  {roleData.length > 0 ? (
                    <>
                      <div className="relative w-[120px] h-[120px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                              {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-bold text-gray-900 leading-none">{completed.length}</span>
                          <span className="text-[9px] text-gray-500 font-medium">Total</span>
                        </div>
                      </div>
                      <div className="flex-1 pl-4 space-y-2">
                        {roleData.map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-gray-700 font-medium truncate max-w-[100px]">{r.name}</span>
                            </div>
                            <span className="text-gray-500 font-bold">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Skill Performance Rating</h3>
              <div className="flex items-center gap-5">
                <div className="relative w-22 h-22 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${(251.2 * avgScore) / 100} 251.2`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-900 leading-none">{avgScore}%</span>
                    <span className="text-[8px] text-gray-400">Avg Score</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Excellent (80%+)', val: exc, c: 'bg-emerald-500' },
                    { label: 'Good (60-79%)', val: good, c: 'bg-blue-500' },
                    { label: 'Average (40-59%)', val: avg, c: 'bg-amber-500' },
                    { label: 'Needs Practice (<40%)', val: needs, c: 'bg-red-500' },
                  ].map((leg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${leg.c}`} />
                        <span className="text-gray-600 font-medium">{leg.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{leg.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights & Coaching */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <BsStars className="text-green-500" /> AI Practice Recommendations
              </h3>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FaChartLine size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Technical Explanations</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Your System Design answers are strong. Focus on trade-off analysis during technical screens.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
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
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
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
