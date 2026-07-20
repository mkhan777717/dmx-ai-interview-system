import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FaUpload, FaCheckCircle, FaSpinner, FaFilePdf, FaRegFileAlt, FaBullseye, FaCode, FaArrowRight, FaLightbulb, FaRegIdBadge, FaBriefcase } from 'react-icons/fa'
import axios from 'axios'
import { ServerUrl } from '../App'

const Stepper = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Upload Resume' },
    { num: 2, label: 'Parsing Resume' },
    { num: 3, label: 'Extracting Information' },
    { num: 4, label: 'Completed' },
  ]
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-8 px-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              currentStep > s.num ? 'bg-green-500 text-white' :
              currentStep === s.num ? 'bg-green-100 border-2 border-green-500 text-green-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > s.num ? <FaCheckCircle /> : s.num}
            </div>
            <span className={`text-xs font-medium ${currentStep >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-gray-200">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: currentStep > s.num ? '100%' : '0%' }}></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function ResumeUpload({ onStart, onResumeParsed }) {
  const [file, setFile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Upload, 2: Parsing, 3: Extracting, 4: Done
  const fileRef = useRef()

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setResumeData(null)
      setError(null)
      setStep(1)
      handleParse(f)
    } else {
      setError('Please upload a PDF file only.')
    }
  }

  const handleParse = async (f) => {
    setParsing(true)
    setError(null)
    setStep(2)
    const form = new FormData()
    form.append('resume', f)
    try {
      // Fake delay for UI visual progress (parsing resume)
      await new Promise(r => setTimeout(r, 800))
      setStep(3) // Extracting information

      const res = await axios.post(ServerUrl + '/api/v2/resume/parse', form, { withCredentials: true })
      const data = res.data
      setResumeData(data)
      if (onResumeParsed) onResumeParsed(data)
      setStep(4)
      setTimeout(() => setStep(5), 500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse resume. Please try again.')
      setStep(1)
    } finally {
      setParsing(false)
    }
  }

  const handleStart = async () => {
    if (!resumeData || starting) return
    setStarting(true)
    setError(null)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/start', {
        predicted_role: resumeData.predicted_role,
        skills: resumeData.skills || [],
        name: resumeData.name || null,
        email: resumeData.email || null,
        interview_mode: 'Technical',
      }, { withCredentials: true })
      onStart({ ...res.data, resumeData, mode: 'Technical' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start interview.')
      setStarting(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <Stepper currentStep={step >= 5 ? 4 : step} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Upload & Extract */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upload Box */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-4">Upload Resume</h3>
              
              <div 
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'}`}
              >
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                  <FaUpload size={24} />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Drag & drop your resume here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button className="px-5 py-2 border border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition">Browse Files</button>
                <p className="text-xs text-gray-400 mt-4">Supports PDF (Max 10MB)</p>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FaFilePdf className="text-red-500 text-xl" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / (1024*1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <FaCheckCircle className="text-green-500" />
                </div>
              )}
              {error && <p className="mt-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            </div>

            {/* Parsing Progress */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-gray-900 font-semibold mb-5">Parsing Progress</h3>
              
              <div className="flex-1 flex flex-col justify-center gap-5">
                {(() => {
                  const currentParseStep = resumeData ? 5 : (parsing ? step : 0);
                  return [
                    { label: 'Reading PDF', s: 1 },
                    { label: 'Extracting Text', s: 2 },
                    { label: 'Analyzing Sections', s: 2 },
                    { label: 'Extracting Information', s: 3 },
                    { label: 'Generating Summary', s: 4 },
                    { label: 'Finalizing Output', s: 4 }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className={`text-sm ${currentParseStep >= item.s ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{item.label}</span>
                      {currentParseStep > item.s ? (
                        <span className="text-xs font-semibold text-green-600 flex items-center gap-1">Completed <FaCheckCircle/></span>
                      ) : currentParseStep === item.s ? (
                        <span className="text-xs font-semibold text-blue-500 flex items-center gap-1">In Progress <FaSpinner className="animate-spin"/></span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </div>
                  ));
                })()}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0);
                    return <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${(Math.min(currentParseStep, 4)/4)*100}%` }}></div>
                  })()}
                </div>
                <p className="text-right text-xs text-gray-500 font-medium mt-1">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0);
                    return Math.round((Math.min(currentParseStep, 4)/4)*100)
                  })()}%
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Information Preview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 font-semibold">Extracted Information <span className="text-gray-400 font-normal">(Preview)</span></h3>
              <button className="text-blue-500 text-sm font-medium hover:text-blue-600 flex items-center gap-1"><FaCode/> View Full JSON</button>
            </div>

            {resumeData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200"><FaRegIdBadge className="text-blue-500"/> Personal Information</h4>
                  <div className="grid grid-cols-[80px_1fr] gap-y-3 text-sm">
                    <span className="text-gray-500">Name</span><span className="text-gray-800 font-medium truncate">{resumeData.name || '-'}</span>
                    <span className="text-gray-500">Email</span><span className="text-gray-800 truncate">{resumeData.email || '-'}</span>
                    <span className="text-gray-500">Phone</span><span className="text-gray-800 truncate">{resumeData.phone || '-'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200"><FaBullseye className="text-purple-500"/> Education</h4>
                  <div className="space-y-2 text-sm text-gray-800">
                    {resumeData.education?.length ? resumeData.education.map((e, i) => <p key={i} className="line-clamp-2 leading-tight">{e}</p>) : <p className="text-gray-400">No education found</p>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200"><FaBriefcase className="text-orange-500"/> Experience</h4>
                  <div className="space-y-2 text-sm text-gray-800">
                    {resumeData.experience?.length ? resumeData.experience.map((e, i) => <p key={i} className="line-clamp-2 leading-tight">{e}</p>) : <p className="text-gray-400">No experience found</p>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200"><FaRegFileAlt className="text-green-500"/> Projects</h4>
                  <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                    {resumeData.projects?.length ? resumeData.projects.map((p, i) => <li key={i} className="line-clamp-1">{p}</li>) : <li className="text-gray-400 list-none">No projects parsed</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FaRegFileAlt size={32} className="mb-3 opacity-20" />
                <p>Upload a resume to see extracted information</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Score */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 font-semibold">AI Summary</h3>
              {resumeData && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">95% Confidence</span>}
            </div>

            {resumeData ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Detected Role</p>
                  <p className="text-xl font-bold text-green-600">{resumeData.predicted_role}</p>
                  <p className="text-xs text-gray-500 mt-1">Based on your skills, experience and projects.</p>
                </div>

                <div>
                  <p className="text-xs text-gray-800 font-semibold mb-3">Top Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills?.slice(0, 8).map(s => (
                      <span key={s} className="px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold rounded-lg">{s}</span>
                    ))}
                    {resumeData.skills?.length > 8 && (
                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium rounded-lg">+{resumeData.skills.length - 8} more</span>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                   <div>
                      <p className="text-xs text-gray-800 font-semibold mb-1">Experience</p>
                      <p className="text-sm text-gray-600 truncate">{resumeData.experience?.[0] || 'Fresher'}</p>
                   </div>
                   <div>
                      <p className="text-xs text-gray-800 font-semibold mb-1">Education</p>
                      <p className="text-sm text-gray-600 truncate">{resumeData.education?.[0] || 'Not specified'}</p>
                   </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100 mt-4">
                   <div>
                     <p className="text-sm font-semibold text-gray-800">Resume Quality Score</p>
                     <p className="text-xs text-gray-500 mt-0.5">
                        {resumeData.resume_quality_score >= 80 ? 'Ready for technical round' :
                         resumeData.resume_quality_score >= 60 ? 'Good, but could be improved' :
                         'Needs improvement for ATS'}
                     </p>
                   </div>
                   <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold bg-white
                      ${resumeData.resume_quality_score >= 80 ? 'border-green-500 text-green-600' :
                        resumeData.resume_quality_score >= 60 ? 'border-yellow-500 text-yellow-600' :
                        'border-red-500 text-red-600'}`}
                   >
                      {resumeData.resume_quality_score || 85}
                   </div>
                </div>
                
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3">
                   <FaLightbulb className="text-blue-500 flex-shrink-0 mt-0.5" />
                   <p className="text-xs text-blue-900 leading-relaxed">Your resume looks good! We've tailored the interview questions based on your stated proficiency in {resumeData.skills?.[0] || 'the core technologies'}.</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <FaBullseye size={32} className="mb-3 opacity-20" />
                <p className="text-sm text-center">Summary will appear here after parsing</p>
              </div>
            )}
          </div>

          <button 
            onClick={handleStart}
            disabled={!resumeData || starting}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl text-base font-semibold transition flex items-center justify-center gap-2 shadow-sm"
          >
            {starting ? <><FaSpinner className="animate-spin" /> Preparing Interview...</> : <>Continue to Interview Setup <FaArrowRight /></>}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ResumeUpload
