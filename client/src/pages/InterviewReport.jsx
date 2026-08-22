import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Report from '../components/V2Report'
import V2Layout from '../components/V2Layout'
import { FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa'
import { BsArrowLeft } from 'react-icons/bs'

function fmtDate(raw) {
  if (!raw) return ''
  return new Date(raw).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(raw) {
  if (!raw) return ''
  return new Date(raw).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [meta, setMeta]     = useState(null)   // interview metadata from history
  const [error, setError]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Try v2 report first
        const result = await axios.get(`${ServerUrl}/api/v2/interview/report/${id}`, { withCredentials: true })
        setReport(result.data)
      } catch (err) {
        // Fallback to legacy report endpoint
        try {
          const result = await axios.get(`${ServerUrl}/api/interview/report/${id}`, { withCredentials: true })
          setReport(result.data)
        } catch {
          setError('Report not found or you do not have access.')
        }
      }
    }

    // Fetch lightweight metadata for the header
    const fetchMeta = async () => {
      try {
        const hist = await axios.get(`${ServerUrl}/api/v2/interview/history`, { withCredentials: true })
        const match = (hist.data || []).find(i => String(i.id) === String(id) || String(i._id) === String(id))
        if (match) setMeta(match)
      } catch {
        // Non-critical — header will just be minimal
      }
    }

    fetchReport()
    fetchMeta()
  }, [id])

  const role = meta?.predicted_role || meta?.role || report?.predicted_role || report?.role || 'Interview Report'
  const mode = meta?.interview_mode || meta?.mode || report?.interview_mode || 'Technical'
  const createdAt = meta?.created_at || meta?.createdAt

  return (
    <V2Layout
      title={role}
      subtitle={`${mode} Mode · AI-powered performance insights`}
    >
      {/* Breadcrumb + metadata header */}
      <div className="px-4 lg:px-6 pt-2 pb-0 max-w-5xl mx-auto w-full">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-300 transition cursor-pointer mb-4"
        >
          <BsArrowLeft size={14} /> Back to My Reports
        </button>

        {/* Interview metadata card */}
        <div className="glass-card-static rounded-3xl px-5 py-4 mb-2 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/25 flex items-center justify-center text-cyan-300 font-bold text-base">
              {role.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white text-sm font-['Outfit']">{role}</p>
              <p className="text-[10px] text-slate-400">{mode} Mode</p>
            </div>
          </div>

          {createdAt && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <FaCalendarAlt size={10} className="text-slate-500" />
                {fmtDate(createdAt)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <FaClock size={10} className="text-slate-500" />
                {fmtTime(createdAt)}
              </div>
            </>
          )}

          {report?.percentile != null && (
            <span className="ml-auto text-xs font-bold text-indigo-300">
              Top <span className="text-indigo-200">{Math.round(report.percentile)}%</span> for role
            </span>
          )}
        </div>
      </div>

      {/* Report body */}
      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-400 px-4">
          <p className="text-sm font-bold text-rose-400">{error}</p>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            ← Back to My Reports
          </button>
        </div>
      ) : !report ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
          <FaSpinner className="animate-spin text-2xl text-cyan-400" />
          <p className="text-sm font-medium">Loading report...</p>
        </div>
      ) : (
        <V2Report reportData={report} onRestart={() => navigate('/history')} />
      )}
    </V2Layout>
  )
}
