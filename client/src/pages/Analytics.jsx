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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316']

export default function Analytics() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FaSpinner className="animate-spin text-3xl mb-3 text-green-600" />
              <p className="text-sm font-medium">Analyzing performance metrics...</p>
            </div>
          ) : completed.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 rounded-3xl shadow-xs text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                <FaChartPie size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Not enough data</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">
                Complete at least one mock interview to unlock full analytics, trend graphs, and domain distribution reports.
              </p>
              <button
                onClick={() => navigate('/v2/interview')}
                className="px-6 py-3 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition cursor-pointer shadow-sm"
              >
                Start Practice Session
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 text-xl border border-green-100">
                    <FaChartLine />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Average Score</p>
                    <h3 className="text-2xl font-bold text-gray-900">{avgScore} / 10</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl border border-blue-100">
                    <FaBullseye />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Highest Score</p>
                    <h3 className="text-2xl font-bold text-gray-900">{highestScore} / 10</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl border border-purple-100">
                    <FaChartPie />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Completed Sessions</p>
                    <h3 className="text-2xl font-bold text-gray-900">{completed.length}</h3>
                  </div>
                </div>
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score History */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                  <h3 className="font-bold text-gray-900 text-base mb-4">Score History (Chronological)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Score Distribution */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                  <h3 className="font-bold text-gray-900 text-base mb-4">Score Range Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h3 className="font-bold text-gray-900 text-base mb-4">Interviews by Job Domain</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                          {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {roleData.map((r, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-gray-900">{r.name}</span>
                        </div>
                        <span className="font-bold text-gray-700">{r.value} session(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </V2Layout>
  )
}
