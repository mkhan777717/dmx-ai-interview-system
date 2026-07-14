import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { FaSpinner, FaChartPie, FaChartLine, FaChartBar, FaBullseye } from 'react-icons/fa'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#eab308', '#a855f7', '#ef4444', '#f97316']

export default function Analytics() {
    const [interviews, setInterviews] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

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

    const completed = interviews.filter(i => i.status === 'completed')

    // ── DATA PREP FOR CHARTS ──────────────────────────────────────────────────
    
    // 1. Score Trend (Over Time)
    const trendData = completed.map(i => ({
        date: new Date(i.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: i.finalScore || 0
    })).reverse() // Chronological order

    // 2. Role Distribution
    const roleCounts = completed.reduce((acc, curr) => {
        const role = curr.role || 'Other'
        acc[role] = (acc[role] || 0) + 1
        return acc
    }, {})
    const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }))

    // 3. Score Distribution (Buckets)
    const buckets = { '90-100 (Excellent)': 0, '75-89 (Good)': 0, '60-74 (Average)': 0, '0-59 (Needs Work)': 0 }
    completed.forEach(i => {
        const s = i.finalScore || 0
        if (s >= 90) buckets['90-100 (Excellent)']++
        else if (s >= 75) buckets['75-89 (Good)']++
        else if (s >= 60) buckets['60-74 (Average)']++
        else buckets['0-59 (Needs Work)']++
    })
    const distributionData = Object.entries(buckets).map(([name, count]) => ({ name, count }))

    // 4. Overall Stats
    const avgScore = completed.length > 0 
        ? Math.round(completed.reduce((sum, i) => sum + (i.finalScore || 0), 0) / completed.length) 
        : 0
    const highestScore = completed.length > 0 ? Math.max(...completed.map(i => i.finalScore || 0)) : 0

    return (
        <V2Layout title="Performance Analytics" subtitle="Deep insights into your interview performance and progress">
            <div className="flex-1 w-full p-4 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <FaSpinner className="animate-spin text-3xl mb-4 text-green-500" />
                            <p>Analyzing data...</p>
                        </div>
                    ) : completed.length === 0 ? (
                        <div className="bg-white border border-gray-100 p-12 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FaChartPie className="text-gray-300 text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Not enough data</h3>
                            <p className="text-gray-500 max-w-sm mb-6">Complete at least one mock interview to unlock detailed performance analytics.</p>
                            <button onClick={() => navigate('/v2/interview')} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition">
                                Start Interview
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 text-xl"><FaChartLine /></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Average Score</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{avgScore} / 100</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl"><FaBullseye /></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Highest Score</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{highestScore} / 100</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl"><FaChartPie /></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed Interviews</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{completed.length}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Line Chart: Score Trend */}
                                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900">Score Trend Over Time</h3>
                                        <p className="text-xs text-gray-500 mt-1">Track your progress across all recent interviews</p>
                                    </div>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} domain={[0, 100]} />
                                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)'}} />
                                                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2}} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart: Interviews by Role */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                                    <div className="mb-2">
                                        <h3 className="font-bold text-gray-900">Interviews by Role</h3>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        <div className="w-[180px] h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                                                        {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-gray-900 leading-none">{completed.length}</span>
                                            <span className="text-[10px] text-gray-500 font-medium mt-1">Total</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bar Chart: Score Distribution */}
                                <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900">Score Distribution</h3>
                                        <p className="text-xs text-gray-500 mt-1">Breakdown of your performance buckets</p>
                                    </div>
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} allowDecimals={false} />
                                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                    {distributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={
                                                            entry.name.includes('Excellent') ? '#10b981' : 
                                                            entry.name.includes('Good') ? '#3b82f6' : 
                                                            entry.name.includes('Average') ? '#eab308' : '#ef4444'
                                                        } />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
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
