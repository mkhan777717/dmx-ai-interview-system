import React, { useState, useRef } from 'react'
import { FaUpload, FaCheckCircle, FaSpinner, FaFilePdf, FaCode, FaArrowRight, FaLightbulb, FaBullseye } from 'react-icons/fa'
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep > s.num
                ? 'bg-green-600 text-white'
                : currentStep === s.num
                ? 'bg-green-50 border-2 border-green-600 text-green-700'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}>
              {currentStep > s.num ? <FaCheckCircle /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${currentStep >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-gray-200">
              <div
                className="h-full bg-green-600 transition-all duration-500"
                style={{ width: currentStep > s.num ? '100%' : '0%' }}
              />
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
  const [step, setStep] = useState(1)
  const fileRef = useRef()

  const [jdText, setJdText] = useState('')
  const [jdData, setJdData] = useState(null)
  const [jdParsing, setJdParsing] = useState(false)
  const [showJd, setShowJd] = useState(false)
  const [interviewMode, setInterviewMode] = useState('Technical')

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
      await new Promise(r => setTimeout(r, 600))
      setStep(3)

      const res = await axios.post(ServerUrl + '/api/v2/resume/parse', form, { withCredentials: true })
      const data = res.data
      setResumeData(data)
      if (onResumeParsed) onResumeParsed(data)
      setStep(4)
      setTimeout(() => setStep(5), 400)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse resume. Please try again.')
      setStep(1)
    } finally {
      setParsing(false)
    }
  }

  const handleParseJD = async () => {
    if (!jdText.trim() || jdParsing) return
    setJdParsing(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/jd/parse', { jd_text: jdText }, { withCredentials: true })
      setJdData(res.data)
    } catch {
      setJdData(null)
    } finally {
      setJdParsing(false)
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
        interview_mode: interviewMode,
        jd_skills: jdData?.skills || [],
        jd_role: jdData?.role || null,
      }, { withCredentials: true })
      onStart({ ...res.data, resumeData, mode: interviewMode })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start interview.')
      setStarting(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full p-4 lg:p-6 space-y-6">
      <Stepper currentStep={step >= 5 ? 4 : step} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Upload Box */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-gray-900 font-bold text-base mb-4">Upload Resume</h3>

                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[200px] ${
                    file
                      ? 'border-green-400 bg-green-50/50'
                      : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                    <FaUpload size={22} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Drag & drop your resume here</p>
                  <p className="text-xs text-gray-400 mb-3">or</p>
                  <button className="px-5 py-2 border border-green-600 text-green-700 rounded-xl text-xs font-bold hover:bg-green-50 transition cursor-pointer">
                    Browse Files
                  </button>
                  <p className="text-[11px] text-gray-400 mt-3">Supports PDF (Max 10MB)</p>
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FaFilePdf className="text-red-500 text-xl" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{file.name}</p>
                        <p className="text-[10px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <FaCheckCircle className="text-emerald-500" />
                  </div>
                )}
                {error && (
                  <p className="mt-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    ⚠️ {error}
                  </p>
                )}
              </div>
            </div>

            {/* Parsing Progress */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-gray-900 font-bold text-base mb-4">Parsing Progress</h3>

                <div className="space-y-3.5">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return [
                      { label: 'Reading PDF', s: 1 },
                      { label: 'Extracting Text', s: 2 },
                      { label: 'Analyzing Sections', s: 2 },
                      { label: 'Extracting Information', s: 3 },
                      { label: 'Generating Summary', s: 4 },
                      { label: 'Finalizing Output', s: 4 },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className={`font-semibold ${currentParseStep >= item.s ? 'text-gray-900' : 'text-gray-400'}`}>
                          {item.label}
                        </span>
                        {currentParseStep > item.s ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            Completed <FaCheckCircle size={11} />
                          </span>
                        ) : currentParseStep === item.s ? (
                          <span className="font-bold text-blue-600 flex items-center gap-1">
                            In Progress <FaSpinner className="animate-spin" size={11} />
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">Pending</span>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return (
                      <div
                        className="h-full bg-emerald-500 transition-all duration-700 rounded-full"
                        style={{ width: `${(Math.min(currentParseStep, 4) / 4) * 100}%` }}
                      />
                    )
                  })()}
                </div>
                <p className="text-right text-xs text-gray-500 font-bold mt-1">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return Math.round((Math.min(currentParseStep, 4) / 4) * 100)
                  })()}%
                </p>
              </div>
            </div>
          </div>

          {/* Optional JD Paste Panel */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-gray-900 font-bold text-sm">
                  Paste Job Description <span className="text-gray-400 font-normal">(Optional)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Tailor your interview questions to target a specific job role</p>
              </div>
              <button
                onClick={() => setShowJd(v => !v)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {showJd ? 'Hide' : 'Add JD +'}
              </button>
            </div>

            {showJd && (
              <div className="space-y-3 pt-2">
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the job description text here..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleParseJD}
                    disabled={!jdText.trim() || jdParsing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {jdParsing ? <><FaSpinner className="animate-spin mr-1" /> Parsing...</> : 'Parse JD'}
                  </button>

                  {jdData && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-blue-700">{jdData.role}</span>
                      {jdData.skills?.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold border border-blue-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Extracted Information Preview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs min-h-[220px]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-900 font-bold text-base">
                Extracted Information <span className="text-gray-400 font-normal text-xs">(Preview)</span>
              </h3>
              <button className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                <FaCode /> View Full JSON
              </button>
            </div>

            {resumeData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Full Name</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{resumeData.name || 'Detected from PDF'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Email Address</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{resumeData.email || 'Detected from PDF'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Projects Detected</p>
                  <div className="space-y-1.5">
                    {resumeData.projects?.slice(0, 3).map((p, i) => (
                      <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-semibold text-gray-800">
                        {p}
                      </div>
                    )) || <p className="text-xs text-gray-400">No projects specified</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-xs">
                <p>Information will appear automatically after resume parsing</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-900 font-bold text-base">AI Summary</h3>
              {resumeData && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-100">
                  95% Match
                </span>
              )}
            </div>

            {resumeData ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Detected Target Role</p>
                  <p className="text-xl font-extrabold text-emerald-600">{resumeData.predicted_role}</p>
                  <p className="text-xs text-gray-500 mt-1">Generated based on your projects, skills, and experience.</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2.5">Extracted Key Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills?.slice(0, 8).map(s => (
                      <span key={s} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Mode Selector */}
                <div>
                  <p className="text-xs font-bold text-gray-900 mb-2.5">Select Interview Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Technical', label: '💻 Technical', desc: 'Coding & DSA' },
                      { id: 'Behavioral', label: '🤝 HR & Behavioral', desc: 'Communication' },
                      { id: 'System Design', label: '🏗️ System Design', desc: 'Architecture' },
                      { id: 'Data Science', label: '📊 Data Science', desc: 'ML & Analytics' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setInterviewMode(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          interviewMode === m.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                            : 'border-gray-200 text-gray-700 hover:border-emerald-200'
                        }`}
                      >
                        <p className="text-xs font-bold">{m.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-900">ATS Resume Quality</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Optimized for AI interviewer</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-extrabold text-emerald-600 text-xs bg-white">
                    {resumeData.resume_quality_score || 88}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100 flex gap-2.5">
                  <FaLightbulb className="text-blue-500 shrink-0 mt-0.5" size={13} />
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Questions will be customized for <strong>{interviewMode}</strong> mode based on your skills in {resumeData.skills?.[0] || 'core topics'}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 py-12">
                <FaBullseye size={28} className="mb-2 opacity-30 text-gray-400" />
                <p className="text-xs text-center text-gray-500 font-medium">
                  Summary will appear automatically after resume parsing
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={!resumeData || starting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {starting ? <><FaSpinner className="animate-spin" /> Starting Session...</> : <>Continue to {interviewMode} Interview <FaArrowRight /></>}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ResumeUpload
