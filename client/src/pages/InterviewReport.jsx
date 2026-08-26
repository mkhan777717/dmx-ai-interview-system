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
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/v2/interview/report/${id}`, { withCredentials: true })
        setReport(result.data)
      } catch {
        try {
          const result = await axios.get(`${ServerUrl}/api/interview/report/${id}`, { withCredentials: true })
          setReport(result.data)
        } catch {
          setError('Report not found or you do not have access.')
        }
      }
    }

    const fetchMeta = async () => {
      try {
        const hist = await axios.get(`${ServerUrl}/api/v2/interview/history`, { withCredentials: true })
        const match = (hist.data || []).find(i => String(i.id) === String(id) || String(i._id) === String(id))
        if (match) setMeta(match)
      } catch {}
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
          className="flex items-center gap-2 text-xs font-bold transition cursor-pointer mb-4 hover:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <BsArrowLeft size={14} /> Back to My Reports
        </button>

        {/* Interview metadata card */}
        <div
          className="rounded-3xl px-5 py-4 mb-2 flex flex-wrap items-center gap-x-6 gap-y-2 border shadow-sm"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-base"
              style={{
                backgroundColor: 'rgba(78, 156, 110, 0.12)',
                borderColor: 'rgba(78, 156, 110, 0.25)',
                color: 'var(--accent)',
              }}
            >
              {role.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>{role}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{mode} Mode</p>
            </div>
          </div>

          {createdAt && (
            <>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <FaCalendarAlt size={10} style={{ color: 'var(--text-muted)' }} />
                {fmtDate(createdAt)}
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <FaClock size={10} style={{ color: 'var(--text-muted)' }} />
                {fmtTime(createdAt)}
              </div>
            </>
          )}

          {report?.percentile != null && (
            <span className="ml-auto text-xs font-bold" style={{ color: 'var(--accent)' }}>
              Top <span>{Math.round(report.percentile)}%</span> for role
            </span>
          )}
        </div>
      </div>

      {/* Report body */}
      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 px-4" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm font-bold text-rose-500">{error}</p>
          <button
            onClick={() => navigate('/history')}
            className="text-xs hover:underline cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to My Reports
          </button>
        </div>
      ) : !report ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3" style={{ color: 'var(--text-muted)' }}>
          <FaSpinner className="animate-spin text-2xl" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium">Loading report...</p>
        </div>
      ) : (
        <V2Report reportData={report} onRestart={() => navigate('/history')} />
      )}
    </V2Layout>
  )
}
