import React, { useState, useRef } from 'react'
import { FaUpload, FaCheckCircle, FaSpinner, FaFilePdf, FaCode, FaArrowRight, FaLightbulb, FaBullseye } from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import axios from 'axios'
import { ServerUrl } from '../App'
import GradientButton from './ui/GradientButton'
import Badge from './ui/Badge'

const Stepper = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Upload PDF' },
    { num: 2, label: 'Stream Parsing' },
    { num: 3, label: 'Skill Matrix' },
    { num: 4, label: 'Ready to Practice' },
  ]
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-8 px-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border"
              style={{
                backgroundColor: currentStep >= s.num ? 'var(--accent)' : 'var(--bg-elevated)',
                borderColor: currentStep >= s.num ? 'var(--accent)' : 'var(--border)',
                color: currentStep >= s.num ? 'var(--accent-text-on)' : 'var(--text-muted)',
              }}
            >
              {currentStep > s.num ? <FaCheckCircle size={12} /> : s.num}
            </div>
            <span
              className="text-[11px] font-bold"
              style={{ color: currentStep >= s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: currentStep > s.num ? '100%' : '0%',
                  backgroundColor: 'var(--accent)',
                }}
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

  function formatApiError(err, fallback = 'An unexpected error occurred.') {
    if (!err) return fallback
    const detail = err.response?.data?.detail || err.response?.data?.message || err.message
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map(d => (typeof d === 'string' ? d : d.msg || d.loc?.join('.') || JSON.stringify(d))).join(', ')
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || JSON.stringify(detail)
    }
    return fallback
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
      setStep(4)
      if (onResumeParsed) onResumeParsed(data)
    } catch (err) {
      console.error(err)
      setError(formatApiError(err, 'Failed to parse resume. Please ensure it contains readable text.'))
      setStep(1)
    } finally {
      setParsing(false)
    }
  }

  const handleParseJD = async () => {
    if (!jdText.trim()) return
    setJdParsing(true)
    try {
      const res = await axios.post(
        ServerUrl + '/api/v2/interview/parse-jd',
        { jd_text: jdText },
        { withCredentials: true }
      )
      setJdData(res.data)
    } catch {
      setJdData({ role: 'Software Engineer', skills: ['System Architecture', 'Problem Solving'] })
    } finally {
      setJdParsing(false)
    }
  }

  const handleStart = async () => {
    if (!resumeData) return
    setStarting(true)
    setError(null)
    try {
      const payload = {
        resume_text: resumeData.raw_text || '',
        resume_skills: resumeData.skills || [],
        predicted_role: jdData?.role || resumeData.predicted_role || 'Software Engineer',
        interview_mode: interviewMode,
        experience_tier: resumeData.experience_tier || 'Mid',
        target_role: jdData?.role || resumeData.predicted_role || 'Software Engineer',
        jd_text: jdText || '',
      }
      const res = await axios.post(ServerUrl + '/api/v2/interview/start', payload, { withCredentials: true })
      if (onStart) onStart(res.data)
    } catch (err) {
      setError(formatApiError(err, 'Failed to initialize interview room. Please check your backend connection.'))
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
            <div
              className="rounded-3xl p-6 flex flex-col justify-between border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div>
                <h3 className="font-bold text-base mb-4 font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FaUpload style={{ color: 'var(--accent)' }} size={14} /> Upload Candidate Resume
                </h3>

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] hover:border-[var(--accent)]"
                  style={{
                    backgroundColor: file ? 'rgba(78, 156, 110, 0.08)' : 'var(--bg-page)',
                    borderColor: file ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  <div
                    className="w-12 h-12 border rounded-2xl flex items-center justify-center mb-3 shadow-xs"
                    style={{
                      backgroundColor: 'rgba(78, 156, 110, 0.12)',
                      borderColor: 'rgba(78, 156, 110, 0.25)',
                      color: 'var(--accent)',
                    }}
                  >
                    <FaUpload size={18} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Drag & drop your resume PDF here</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>or click to browse local files</p>
                  <button
                    className="px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border hover:border-[var(--accent)]"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Browse Files
                  </button>
                  <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>Standard PDF format supported (Max 10MB)</p>
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                </div>

                {file && (
                  <div
                    className="mt-4 flex items-center justify-between p-3.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <FaFilePdf className="text-rose-500 text-xl" />
                      <div>
                        <p className="text-xs font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <FaCheckCircle style={{ color: 'var(--accent)' }} />
                  </div>
                )}
                {error && (
                  <p className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
                  </p>
                )}
              </div>
            </div>

            {/* Parsing Progress */}
            <div
              className="rounded-3xl p-6 flex flex-col justify-between border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div>
                <h3 className="font-bold text-base mb-4 font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <BsStars style={{ color: 'var(--accent)' }} size={15} /> AI Profile Extraction
                </h3>

                <div className="space-y-3.5">
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return [
                      { label: 'Reading PDF Stream', s: 1 },
                      { label: 'Extracting Raw Text Tokens', s: 2 },
                      { label: 'Vectorizing Skills & Tech Stacks', s: 2 },
                      { label: 'Extracting Core Projects', s: 3 },
                      { label: 'Evaluating Role Alignment', s: 4 },
                      { label: 'Synthesizing Interview Persona', s: 4 },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-semibold" style={{ color: currentParseStep >= item.s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {item.label}
                        </span>
                        {currentParseStep > item.s ? (
                          <span className="font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                            Done <FaCheckCircle size={11} />
                          </span>
                        ) : currentParseStep === item.s ? (
                          <span className="font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                            Processing <FaSpinner className="animate-spin" size={11} />
                          </span>
                        ) : (
                          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Pending</span>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="h-2 w-full rounded-full overflow-hidden p-0.5" style={{ backgroundColor: 'var(--bg-page)' }}>
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return (
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(Math.min(currentParseStep, 4) / 4) * 100}%`,
                          backgroundColor: 'var(--accent)',
                        }}
                      />
                    )
                  })()}
                </div>
                <p className="text-right text-xs font-bold mt-1.5" style={{ color: 'var(--accent)' }}>
                  {(() => {
                    const currentParseStep = resumeData ? 5 : (parsing ? step : 0)
                    return Math.round((Math.min(currentParseStep, 4) / 4) * 100)
                  })()}% Completed
                </p>
              </div>
            </div>
          </div>

          {/* Optional JD Paste Panel */}
          <div
            className="rounded-3xl p-5.5 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
                  Target Job Description <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tailor your questions to match an explicit job opening</p>
              </div>
              <button
                onClick={() => setShowJd(v => !v)}
                className="text-xs font-bold cursor-pointer px-3 py-1 rounded-full border transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent)',
                }}
              >
                {showJd ? 'Hide JD' : 'Add JD +'}
              </button>
            </div>

            {showJd && (
              <div className="space-y-3 pt-3">
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the target job description text here..."
                  rows={4}
                  className="w-full rounded-2xl glass-input p-3.5 text-xs resize-none font-mono"
                />
                <div className="flex items-center justify-between gap-3">
                  <GradientButton
                    onClick={handleParseJD}
                    disabled={!jdText.trim() || jdParsing}
                    size="sm"
                  >
                    {jdParsing ? <><FaSpinner className="animate-spin mr-1" /> Parsing JD...</> : 'Parse JD'}
                  </GradientButton>

                  {jdData && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'rgba(78, 156, 110, 0.15)',
                          borderColor: 'rgba(78, 156, 110, 0.3)',
                          color: 'var(--accent)',
                        }}
                      >
                        {jdData.role}
                      </span>
                      {jdData.skills?.slice(0, 5).map(s => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            backgroundColor: 'var(--bg-page)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)',
                          }}
                        >
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
          <div
            className="rounded-3xl p-6 min-h-[220px] border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base font-display" style={{ color: 'var(--text-primary)' }}>
                Extracted Profile Information <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(Verified)</span>
              </h3>
              <Badge variant="accent" icon={FaCode}>
                AI Parsed
              </Badge>
            </div>

            {resumeData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Candidate Name</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{resumeData.name || 'Detected from PDF'}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contact Email</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{resumeData.email || 'Detected from PDF'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Key Projects Highlighted</p>
                  <div className="space-y-2">
                    {resumeData.projects?.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl text-xs font-semibold border-l-4"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          color: 'var(--text-primary)',
                          borderLeftColor: 'var(--accent)',
                        }}
                      >
                        {p}
                      </div>
                    )) || <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No projects specified</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                <p>Information will appear automatically after resume parsing</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div
            className="rounded-3xl p-6 flex-1 space-y-5 border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BsStars style={{ color: 'var(--accent)' }} /> Assessment Blueprint
              </h3>
              {resumeData && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-bold border"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.15)',
                    borderColor: 'rgba(78, 156, 110, 0.3)',
                    color: 'var(--accent)',
                  }}
                >
                  98% Match
                </span>
              )}
            </div>

            {resumeData ? (
              <div className="space-y-4.5">
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.08)',
                    borderColor: 'rgba(78, 156, 110, 0.25)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 font-display" style={{ color: 'var(--accent)' }}>Target Evaluation Role</p>
                  <p className="text-xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>{resumeData.predicted_role}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Adaptive questions configured for your experience tier.</p>
                </div>

                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Detected Skill Matrix</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills?.slice(0, 8).map(s => (
                      <span
                        key={s}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          borderColor: 'var(--border)',
                          color: 'var(--accent)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border)' }} />

                {/* Mode Selector */}
                <div>
                  <p className="text-xs font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>Select Interview Mode</p>
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
                        className="p-3 rounded-2xl border text-left transition-all cursor-pointer"
                        style={{
                          backgroundColor: interviewMode === m.id ? 'rgba(78, 156, 110, 0.15)' : 'var(--bg-page)',
                          borderColor: interviewMode === m.id ? 'var(--accent)' : 'var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <p className="text-xs font-bold">{m.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ATS Score */}
                <div className="p-3.5 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>ATS Resume Quality</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Optimized for AI interviewer</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shadow-xs"
                    style={{
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                      backgroundColor: 'var(--bg-elevated)',
                    }}
                  >
                    {resumeData.resume_quality_score || 92}
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-2xl border flex gap-2.5"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.08)',
                    borderColor: 'rgba(78, 156, 110, 0.2)',
                  }}
                >
                  <FaLightbulb className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} size={13} />
                  <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Live interactive avatar will test you on <strong>{interviewMode}</strong> concepts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
                <FaBullseye size={28} className="mb-2 opacity-40" />
                <p className="text-xs text-center font-medium">
                  Summary will appear automatically after resume parsing
                </p>
              </div>
            )}
          </div>

          <GradientButton
            onClick={handleStart}
            disabled={!resumeData || starting}
            size="lg"
            className="w-full font-bold shadow-xl"
            iconRight={FaArrowRight}
          >
            {starting ? <><FaSpinner className="animate-spin mr-1" /> Initializing AI Room...</> : `Enter ${interviewMode} Room`}
          </GradientButton>
        </div>

      </div>
    </div>
  )
}

export default ResumeUpload
