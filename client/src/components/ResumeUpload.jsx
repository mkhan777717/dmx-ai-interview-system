import React, { useState, useRef } from 'react'
import { FaUpload, FaCheckCircle, FaSpinner, FaFilePdf, FaCode, FaArrowRight, FaLightbulb, FaBullseye } from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import axios from 'axios'
import { ServerUrl } from '../App'

const Stepper = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Upload Resume' },
    { num: 2, label: 'Parsing Document' },
    { num: 3, label: 'Extracting Profile' },
    { num: 4, label: 'Ready to Practice' },
  ]
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-8 px-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              currentStep > s.num
                ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-xs'
                : currentStep === s.num
                ? 'bg-emerald-500/15 border-2 border-emerald-600 text-teal-800 ring-4 ring-emerald-500/20'
                : 'glass-pill text-slate-400'
            }`}>
              {currentStep > s.num ? <FaCheckCircle size={12} /> : s.num}
            </div>
            <span className={`text-[11px] font-bold ${currentStep >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
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
    <div className="max-w-[1400px] mx-auto w-full p-2 lg:p-4 space-y-6">
      <Stepper currentStep={step >= 5 ? 4 : step} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Upload Box */}
            <div className="glass-card-static rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-slate-900 font-bold text-base mb-4 font-['Outfit'] flex items-center gap-2">
                  <FaUpload className="text-emerald-600" size={14} /> Upload Resume
                </h3>

                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${
                    file
                      ? 'border-emerald-500 bg-emerald-50/40 glow-border-emerald'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="w-13 h-13 bg-gradient-to-br from-emerald-100 to-teal-100 text-teal-800 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                    <FaUpload size={20} />
                  </div>
                  <p className="font-bold text-slate-900 text-sm mb-1">Drag & drop your resume PDF here</p>
                  <p className="text-xs text-slate-400 mb-3">or</p>
                  <button className="px-5 py-2 glass-btn-secondary rounded-xl text-xs font-bold transition cursor-pointer">
                    Browse Files
                  </button>
                  <p className="text-[10px] text-slate-400 mt-3">PDF format supported (Max 10MB)</p>
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between p-3.5 glass-panel-subtle rounded-xl border border-emerald-500/30">
                    <div className="flex items-center gap-3">
                      <FaFilePdf className="text-rose-500 text-xl" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <FaCheckCircle className="text-emerald-500" />
                  </div>
                )}
                {error && (
                  <p className="mt-4 text-xs font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    ⚠️ {error}
                  </p>
                )}
              </div>
            </div>

            {/* Parsing Progress */}
            <div className="glass-card-static rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-slate-900 font-bold text-base mb-4 font-['Outfit'] flex items-center gap-2">
                  <BsStars className="text-indigo-600" size={15} /> AI Parsing Engine
                </h3>

                <div className="space-y-3.5">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return [
                      { label: 'Reading PDF Stream', s: 1 },
                      { label: 'Extracting Raw Text', s: 2 },
                      { label: 'Analyzing Experience & Skills', s: 2 },
                      { label: 'Extracting Core Projects', s: 3 },
                      { label: 'Evaluating Match Rubrics', s: 4 },
                      { label: 'Generating Interview Persona', s: 4 },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className={`font-semibold ${currentParseStep >= item.s ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                        {currentParseStep > item.s ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            Done <FaCheckCircle size={11} />
                          </span>
                        ) : currentParseStep === item.s ? (
                          <span className="font-bold text-teal-700 flex items-center gap-1">
                            Processing <FaSpinner className="animate-spin" size={11} />
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending</span>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return (
                      <div
                        className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-700 rounded-full"
                        style={{ width: `${(Math.min(currentParseStep, 4) / 4) * 100}%` }}
                      />
                    )
                  })()}
                </div>
                <p className="text-right text-xs text-slate-600 font-bold mt-1.5">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return Math.round((Math.min(currentParseStep, 4) / 4) * 100)
                  })()}%
                </p>
              </div>
            </div>
          </div>

          {/* Optional JD Paste Panel */}
          <div className="glass-card-static rounded-3xl p-5.5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-slate-900 font-bold text-sm font-['Outfit']">
                  Target Job Description <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tailor your questions to match an explicit job opening</p>
              </div>
              <button
                onClick={() => setShowJd(v => !v)}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 cursor-pointer glass-pill px-3 py-1 rounded-full"
              >
                {showJd ? 'Hide JD' : 'Add JD +'}
              </button>
            </div>

            {showJd && (
              <div className="space-y-3 pt-3">
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the job description text here..."
                  rows={4}
                  className="w-full rounded-2xl glass-input text-slate-900 placeholder-slate-400 p-3.5 text-xs resize-none font-mono"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleParseJD}
                    disabled={!jdText.trim() || jdParsing}
                    className="px-4.5 py-2 rounded-xl glass-btn-primary disabled:opacity-50 text-xs font-bold cursor-pointer"
                  >
                    {jdParsing ? <><FaSpinner className="animate-spin mr-1" /> Parsing JD...</> : 'Parse JD'}
                  </button>

                  {jdData && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">{jdData.role}</span>
                      {jdData.skills?.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold">
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
          <div className="glass-card-static rounded-3xl p-6 min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-900 font-bold text-base font-['Outfit']">
                Extracted Profile Information <span className="text-slate-400 font-normal text-xs">(Verified)</span>
              </h3>
              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <FaCode size={11} /> AI Parsed
              </span>
            </div>

            {resumeData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 glass-panel-subtle rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Candidate Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{resumeData.name || 'Detected from PDF'}</p>
                  </div>
                  <div className="p-3.5 glass-panel-subtle rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{resumeData.email || 'Detected from PDF'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Projects Highlighted</p>
                  <div className="space-y-2">
                    {resumeData.projects?.slice(0, 3).map((p, i) => (
                      <div key={i} className="p-3 glass-panel-subtle rounded-xl text-xs font-semibold text-slate-800 border-l-3 border-emerald-500">
                        {p}
                      </div>
                    )) || <p className="text-xs text-slate-400">No projects specified</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>Information will appear automatically after resume parsing</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card-static rounded-3xl p-6 flex-1 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-slate-900 font-bold text-base font-['Outfit'] flex items-center gap-2">
                <BsStars className="text-teal-700" /> Assessment Blueprint
              </h3>
              {resumeData && (
                <span className="text-xs bg-emerald-500/15 text-teal-900 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                  98% Match
                </span>
              )}
            </div>

            {resumeData ? (
              <div className="space-y-4.5">
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl border border-emerald-500/20">
                  <p className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider mb-1">Target Evaluation Role</p>
                  <p className="text-xl font-extrabold text-teal-950 font-['Outfit']">{resumeData.predicted_role}</p>
                  <p className="text-xs text-slate-600 mt-1">Adaptive questions configured for your experience tier.</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Detected Skill Domain</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills?.slice(0, 8).map(s => (
                      <span key={s} className="px-2.5 py-1 glass-pill text-teal-900 text-xs font-bold rounded-lg border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-200/60" />

                {/* Mode Selector */}
                <div>
                  <p className="text-xs font-bold text-slate-900 mb-2.5">Select Interview Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Technical', label: '💻 Technical', desc: 'Coding & Algorithms' },
                      { id: 'Behavioral', label: '🤝 Behavioral', desc: 'STAR Framework' },
                      { id: 'System Design', label: '🏗️ Architecture', desc: 'Scalability & Design' },
                      { id: 'Data Science', label: '📊 ML & Data', desc: 'Statistics & AI' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setInterviewMode(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          interviewMode === m.id
                            ? 'border-emerald-500 bg-emerald-500/15 text-teal-950 font-bold shadow-xs glow-border-emerald'
                            : 'glass-pill text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{m.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div className="p-3.5 glass-panel-subtle rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">ATS Resume Quality</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Optimized for AI interviewer</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-extrabold text-teal-900 text-xs bg-white shadow-xs">
                    {resumeData.resume_quality_score || 92}
                  </div>
                </div>

                <div className="p-3.5 bg-teal-500/10 rounded-2xl border border-teal-500/20 flex gap-2.5">
                  <FaLightbulb className="text-teal-700 shrink-0 mt-0.5" size={13} />
                  <p className="text-xs text-teal-950 leading-relaxed">
                    Live interactive avatar will test you on <strong>{interviewMode}</strong> concepts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 py-12">
                <FaBullseye size={28} className="mb-2 opacity-30 text-slate-400" />
                <p className="text-xs text-center text-slate-500 font-medium">
                  Summary will appear automatically after resume parsing
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={!resumeData || starting}
            className="w-full glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {starting ? <><FaSpinner className="animate-spin" /> Preparing AI Room...</> : <>Enter {interviewMode} Room <FaArrowRight /></>}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ResumeUpload
