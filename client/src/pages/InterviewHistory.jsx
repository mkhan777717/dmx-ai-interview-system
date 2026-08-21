import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { FaHistory, FaCalendarAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa'
import { BsArrowRight } from 'react-icons/bs'
import V2Layout from '../components/V2Layout'

function InterviewHistory() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(ServerUrl + '/api/v2/interview/history', { withCredentials: true })
        const completedInterviews = (result.data || []).filter(i => i.status === 'completed')
        setInterviews(completedInterviews)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    getMyInterviews()
  }, [])

  return (
    <V2Layout title="My Interview Reports" subtitle="Review your past mock interviews and detailed AI feedback reports">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FaSpinner className="animate-spin text-3xl mb-3 text-green-600" />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="glass-card-static p-12 rounded-3xl text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
              <FaHistory size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-['Outfit']">No completed interviews yet</h3>
            <p className="text-slate-500 text-xs max-w-sm mb-6 leading-relaxed">
              Complete your first AI mock interview to receive detailed rubric feedback, communication metrics, and progress tracking.
            </p>
            <button
              onClick={() => navigate('/v2/interview')}
              className="px-6 py-3.5 glass-btn-primary font-bold text-xs rounded-2xl transition cursor-pointer shadow-md"
            >
              Start Interview Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((item, index) => {
              const reportId = item.id || item._id
              const roleName = item.role || item.predicted_role || 'Technical Interview'
              const score = item.finalScore ?? item.final_score ?? 0

              return (
                <div
                  key={index}
                  onClick={() => navigate(`/report/${reportId}`)}
                  className="glass-card p-5 rounded-3xl cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                      {roleName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors font-['Outfit']">
                        {roleName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-slate-400" />
                          {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-teal-700 font-bold">{item.mode || item.interview_mode || 'Technical'} Mode</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-right">
                      <p className="text-base font-extrabold text-slate-900 font-['Outfit']">
                        {score.toFixed(1)} / 10
                      </p>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                        Score
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-teal-900 border border-emerald-500/20 flex items-center gap-1.5">
                      <FaCheckCircle className="text-emerald-600" /> Completed
                    </span>
                    <div className="w-8 h-8 rounded-full glass-pill group-hover:bg-emerald-500/15 group-hover:text-teal-900 flex items-center justify-center text-slate-400 transition-all">
                      <BsArrowRight />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </V2Layout>
  )
}

export default InterviewHistory
