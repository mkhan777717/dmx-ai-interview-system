import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ResumeUpload from '../components/ResumeUpload'
import V2InterviewRoom from '../components/V2InterviewRoom'
import V2Report from '../components/V2Report'
import AuthModel from '../components/AuthModel'
import V2Layout from '../components/V2Layout'

// Phases: upload → interview → report
const PHASE = { UPLOAD: 'upload', INTERVIEW: 'interview', REPORT: 'report' }

function V2Interview() {
  const [phase, setPhase] = useState(PHASE.UPLOAD)
  const [sessionData, setSessionData] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const [progressData, setProgressData] = useState({ text: "", percent: 0 })

  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  // If not logged in, show auth modal
  useEffect(() => {
    if (!userData) {
      setShowAuth(true)
    }
  }, [userData])

  const handleStart = (data) => {
    setSessionData(data)
    setPhase(PHASE.INTERVIEW)
  }

  const handleFinish = (report) => {
    setReportData(report)
    setPhase(PHASE.REPORT)
  }

  const handleRestart = () => {
    setPhase(PHASE.UPLOAD)
    setSessionData(null)
    setReportData(null)
    setResumeData(null)
    setProgressData({ text: "", percent: 0 })
  }

  // Show auth modal if not logged in
  if (!userData) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        {showAuth && <AuthModel onClose={() => navigate('/')} />}
      </div>
    )
  }

  const getLayoutProps = () => {
    if (phase === PHASE.UPLOAD) return { title: "Resume Parser", subtitle: "Upload your resume and let AI extract valuable information" }
    if (phase === PHASE.INTERVIEW) return { title: "AI Smart Interview", subtitle: "Your AI interviewer is here to help you succeed" }
    return { title: "Interview Report", subtitle: "AI-powered performance insights" }
  }

  return (
    <V2Layout 
      {...getLayoutProps()} 
      sessionData={sessionData} 
      resumeData={resumeData || sessionData?.resumeData}
      progressText={progressData.text}
      progressPercent={progressData.percent}
    >
      {phase === PHASE.UPLOAD && <ResumeUpload onStart={handleStart} onResumeParsed={setResumeData} />}
      {phase === PHASE.INTERVIEW && sessionData && (
        <V2InterviewRoom 
          sessionData={sessionData} 
          onFinish={handleFinish} 
          onProgressUpdate={setProgressData}
        />
      )}
      {phase === PHASE.REPORT && reportData && (
        <V2Report reportData={reportData} onRestart={handleRestart} />
      )}
    </V2Layout>
  )
}

export default V2Interview
