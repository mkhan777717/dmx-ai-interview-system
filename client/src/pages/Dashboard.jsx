import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import V2Layout from '../components/V2Layout'
import { motion } from 'motion/react'
import { 
  BsSearch, BsCalendar4, BsChevronDown, BsGraphUp, 
  BsClock, BsCheckCircle, BsPersonBadge, BsThreeDots,
  BsLightbulb, BsArrowRight, BsStars
} from 'react-icons/bs'
import { 
  FaCalendarAlt, FaCalendarCheck, FaChartLine, FaRegClock, FaCloud
} from 'react-icons/fa'
import { HiOutlineLightBulb } from 'react-icons/hi'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#10b981', '#3b82f6', '#eab308', '#a855f7', '#ef4444']

export default function Dashboard() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()
  
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/v2/interview/history", { withCredentials: true })
        setInterviews(result.data)
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    getMyInterviews()
  }, [])

  // ── DATA PROCESSING ───────────────────────────────────────────────────────
  
  const completed = interviews.filter(i => i.status === 'completed')
  
  // Avg Score (finalScore is out of 10)
  const totalScore = completed.reduce((acc, curr) => acc + (curr.finalScore || 0), 0)
  const avgScore = completed.length > 0 ? Math.round((totalScore / completed.length) * 10) : 0
  
  // Total Time (assuming avg 25 mins per completed)
  const totalMins = completed.length * 25
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  
  // Recent Interviews
  const recentInterviews = [...interviews].reverse().slice(0, 5)

  // Roles Aggregation
  const roleCounts = {}
  interviews.forEach(i => {
    const r = i.role || 'Other'
    roleCounts[r] = (roleCounts[r] || 0) + 1
  })
  const roleData = Object.keys(roleCounts).map(key => ({ name: key, value: roleCounts[key] }))
    .sort((a,b) => b.value - a.value).slice(0, 5) // top 5

  // Score Trend (Last 7 days)
  // Group by date (MM/DD)
  const trendMap = {}
  completed.forEach(i => {
    const d = new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!trendMap[d]) trendMap[d] = { count: 0, total: 0 }
    trendMap[d].count += 1
    trendMap[d].total += (i.finalScore || 0) * 10
  })
  const scoreTrendData = Object.keys(trendMap).map(key => ({
    name: key,
    score: Math.round(trendMap[key].total / trendMap[key].count)
  })).slice(-7) // last 7 days

  // Performance Distribution
  let exc = 0, good = 0, avg = 0, needs = 0
  completed.forEach(i => {
    const score = (i.finalScore || 0) * 10
    if (score >= 80) exc++
    else if (score >= 60) good++
    else if (score >= 40) avg++
    else needs++
  })

  // ── HEADER COMPS ──────────────────────────────────────────────────────────
  const headerLeft = (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        Welcome back, {userData?.name?.split(' ')[0] || 'User'}! <span>👋</span>
      </h1>
      <p className="text-gray-500 text-sm">Here's what's happening with your interviews today.</p>
    </div>
  )

  const headerRight = (
    <div className="flex items-center gap-6">
      {/* Search */}
      <div className="relative">
        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-64"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
          <kbd className="border border-gray-200 rounded px-1.5 text-[10px] text-gray-400">⌘</kbd>
          <kbd className="border border-gray-200 rounded px-1.5 text-[10px] text-gray-400">K</kbd>
        </div>
      </div>
      
      {/* Date Picker */}
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
        <FaCalendarAlt className="text-gray-400"/>
        <span className="font-medium">May 12 - May 18, 2025</span>
        <BsChevronDown className="text-[10px] ml-2"/>
      </div>
    </div>
  )

  return (
    <V2Layout headerLeft={headerLeft} headerRight={headerRight}>
      <div className="p-8 max-w-[1600px] mx-auto w-full">
        
        {/* ── TOP STATS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Interviews', val: interviews.length.toString(), inc: '+ 0%', icn: <FaCalendarCheck size={20}/>, c: 'text-green-500', bg: 'bg-green-50', line: 'all time', up: true },
            { label: 'Completed', val: completed.length.toString(), inc: '+ 0%', icn: <FaChartLine size={20}/>, c: 'text-purple-500', bg: 'bg-purple-50', line: 'all time', up: true },
            { label: 'Avg. Score', val: `${avgScore}%`, inc: '+ 0%', icn: <FaRegClock size={20}/>, c: 'text-orange-500', bg: 'bg-orange-50', line: 'all time', up: true },
            { label: 'Total Time', val: `${hours}h ${mins}m`, inc: '+ 0%', icn: <FaRegClock size={20}/>, c: 'text-blue-500', bg: 'bg-blue-50', line: 'all time', up: true },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.c}`}>
                  {stat.icn}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 text-right mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 text-right">{stat.val}</h3>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 mt-4">
                <span className={`text-[11px] font-bold ${stat.up ? 'text-green-500' : 'text-red-500'}`}>▲ {stat.inc}</span>
                <span className="text-[11px] text-gray-400">{stat.line}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN (Takes 2/3 space) */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Recent Interviews */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Recent Interviews</h3>
                <button className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-50">View All <BsArrowRight/></button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-50">
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Duration</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentInterviews.length > 0 ? recentInterviews.map((row, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 transition cursor-pointer" onClick={() => navigate(`/report/${row._id}`)}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">👤</div>
                            <span className="font-semibold text-sm text-gray-900">{row.role || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.mode === 'Technical' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{row.mode || 'Technical'}</span>
                        </td>
                        <td className="py-4">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${((row.finalScore || 0)*10) > 75 ? 'border-green-500 text-green-600' : ((row.finalScore || 0)*10) > 65 ? 'border-yellow-500 text-yellow-600' : 'border-orange-500 text-orange-600'}`}>{((row.finalScore || 0)*10)}%</div>
                        </td>
                        <td className="py-4 text-xs font-medium text-gray-500 flex items-center gap-1 mt-2.5"><FaRegClock/> {row.duration || '25 min'}</td>
                        <td className="py-4">
                          <p className="text-xs font-medium text-gray-900">{new Date(row.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-gray-400">{new Date(row.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>{row.status || 'completed'}</span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-gray-400 hover:text-gray-600"><BsThreeDots/></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500 text-sm">No recent interviews found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Score Trend */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 text-sm">Score Trend</h3>
                  <select className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-500 outline-none">
                    <option>Last 7 Days</option>
                  </select>
                </div>
                <div className="h-[200px] w-full">
                  {scoreTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" activeDot={{r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2}} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <FaChartLine size={32} className="mb-2 opacity-30" />
                      <p className="text-xs">No score data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interviews by Role */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Interviews by Role</h3>
                <div className="flex-1 flex items-center justify-between">
                  {roleData.length > 0 ? (
                    <>
                      <div className="relative w-[120px] h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                              {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-gray-900 leading-none">{interviews.length}</span>
                          <span className="text-[9px] text-gray-500 font-medium mt-0.5">Total</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 pl-6 space-y-2.5">
                        {roleData.map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                              <span className="text-gray-600 font-medium truncate max-w-[90px]">{r.name}</span>
                            </div>
                            <span className="text-gray-400">{r.value} ({Math.round(r.value/interviews.length*100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 min-h-[150px]">
                      <BsPersonBadge size={32} className="mb-2 opacity-30" />
                      <p className="text-xs">No role data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN (Takes 1/3 space) */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Upcoming Interviews */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-sm">Upcoming Interviews</h3>
                <button className="text-[10px] font-semibold text-blue-500 hover:text-blue-600">View Calendar</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { m: 'MAY', d: '20', title: 'System Design Interview', sub: 'Backend Developer', t: '10:00 AM - 11:00 AM' },
                  { m: 'MAY', d: '21', title: 'Behavioral Round', sub: 'Product Manager', t: '02:00 PM - 02:45 PM', alert: true },
                  { m: 'MAY', d: '22', title: 'Technical Interview', sub: 'Full Stack Developer', t: '11:30 AM - 12:30 PM' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center">
                      <span className={`text-[9px] font-bold ${item.alert ? 'text-red-500' : 'text-blue-600'}`}>{item.m}</span>
                      <span className="text-sm font-bold text-gray-900 leading-none mt-0.5">{item.d}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.sub}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><FaRegClock/> {item.t}</p>
                    </div>
                    <button className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 hover:bg-purple-100 transition"><FaCalendarAlt size={12}/></button>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-2 border-t border-gray-100 text-[11px] font-semibold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition rounded-b-xl">
                View All Upcoming <BsArrowRight/>
              </button>
            </div>

            {/* Performance Overview */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-sm">Performance Overview</h3>
                <select className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-500 outline-none">
                  <option>This Week</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                {/* Circular Gauge */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${(251.2 * avgScore) / 100} 251.2`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 leading-none mt-1">{avgScore}%</span>
                    <span className="text-[8px] text-gray-400 font-medium">Average Score</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2.5">
                  {[
                    { label: 'Excellent (80-100%)', val: exc, c: 'bg-green-500' },
                    { label: 'Good (60-79%)', val: good, c: 'bg-blue-500' },
                    { label: 'Average (40-59%)', val: avg, c: 'bg-yellow-500' },
                    { label: 'Needs Improvement (<40%)', val: needs, c: 'bg-red-500' },
                  ].map((leg, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${leg.c}`}></div>
                        <span className="text-[10px] text-gray-500 font-medium">{leg.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-900">{leg.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                <BsStars className="text-blue-500"/> AI Insights
              </h3>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3 cursor-pointer hover:bg-green-100 transition">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-green-200 flex items-center justify-center text-green-500"><FaChartLine size={12}/></div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold text-gray-900">You perform best in Backend Development</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Keep focusing on System Design.</p>
                </div>
                <BsArrowRight className="text-gray-300 self-center"/>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 cursor-pointer hover:bg-orange-100 transition">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-orange-200 flex items-center justify-center text-orange-500"><HiOutlineLightBulb size={14}/></div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold text-gray-900">Work on your Communication Skills</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Your behavioral scores can improve.</p>
                </div>
                <BsArrowRight className="text-gray-300 self-center"/>
              </div>

              <button className="w-full py-2.5 mt-2 border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                View All Insights <BsArrowRight/>
              </button>
            </div>

          </div>
        </div>
      </div>
    </V2Layout>
  )
}
