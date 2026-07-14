import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import V2Report from '../components/V2Report'
import V2Layout from '../components/V2Layout'

function InterviewReport() {
  const {id} = useParams()
  const [report, setReport] = useState(null)
  const navigate = useNavigate()
   
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/v2/interview/report/${id}`, { withCredentials: true })
        setReport(result.data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchReport()
  }, [id])

  if (!report) {
    return (
      <V2Layout title="Interview Report" subtitle="Loading your performance insights">
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 font-medium">Loading Report...</p>
        </div>
      </V2Layout>
    )
  }

  return (
    <V2Layout title="Interview Report" subtitle="AI-powered performance insights" sessionData={{}} resumeData={{}} >
       <V2Report reportData={report} onRestart={() => navigate('/history')} />
    </V2Layout>
  )
}

export default InterviewReport
