import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FaMicrophone, FaMicrophoneSlash, FaSpinner, FaLightbulb, FaVolumeUp, FaTimes, FaStepForward, FaCode } from 'react-icons/fa'
import { BsLightningFill, BsStars } from 'react-icons/bs'
import axios from 'axios'
import { ServerUrl } from '../App'
import TrugenWidget from './TrugenWidget'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

const CHUNK_MS = 4000
const GREEN = '#10b981'



function V2InterviewRoom({ sessionData, onFinish, onProgressUpdate }) {
  const { interview_id, questions, candidate_name } = sessionData

  const [qIndex, setQIndex]                   = useState(0)
  const [transcript, setTranscript]           = useState('')
  const [codeValue, setCodeValue]             = useState('# Write your solution here\n')
  const [codeLang, setCodeLang]               = useState('python')
  const [isFollowUpPhase, setIsFollowUpPhase] = useState(false)
  const [followUp, setFollowUp]               = useState(null)
  const [feedback, setFeedback]               = useState(null)
  const [submitting, setSubmitting]           = useState(false)
  const [finishLoading, setFinishLoading]     = useState(false)
  const [timeLeft, setTimeLeft]               = useState(questions[0]?.estimated_time_seconds || 90)
  const [micOn, setMicOn]                     = useState(false)
  const [micError, setMicError]               = useState('')
  const [processing, setProcessing]           = useState(false)
  const [isSpeaking, setIsSpeaking]           = useState(false)

  // Hint Modal State
  const [hintModalOpen, setHintModalOpen]     = useState(false)
  const [hintText, setHintText]               = useState('')
  const [hintLoading, setHintLoading]         = useState(false)

  // Integrity / Anti-Cheat State
  const [integrityFlags, setIntegrityFlags]   = useState([])
  const startTimeRef = useRef(Date.now())

  const mediaRecRef  = useRef(null)
  const streamRef    = useRef(null)
  const timerRef     = useRef(null)
  const isMicRef     = useRef(false)
  const chunksRef    = useRef([])
  const avatarRef    = useRef(null)

  const currentQ = isFollowUpPhase
    ? { question: followUp, estimated_time_seconds: 60 } : questions[qIndex]
  const totalQ        = questions.length
  const isDSAQuestion = ['DSA', 'Coding', 'Code'].includes(currentQ?.category)
  const fullAnswer    = isDSAQuestion
    ? (codeValue.trim() + (transcript.trim() ? '\n\n// Candidate Spoken Explanation:\n' + transcript.trim() : ''))
    : (transcript.trim() || (codeValue.trim() ? 'Solution:\n' + codeValue.trim() : ''))
  const initTime      = currentQ?.estimated_time_seconds || 90

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        text: `${qIndex + 1} / ${totalQ} Questions`,
        percent: ((qIndex) / totalQ) * 100
      })
    }
  }, [qIndex, totalQ, onProgressUpdate])

  // ── Tab-switch integrity tracking ─────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const flag = {
          type: 'tab_switch',
          question_index: qIndex,
          timestamp: new Date().toISOString(),
          elapsed_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        }
        setIntegrityFlags(prev => [...prev, flag])
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [qIndex])

  // ── Groq transcription ────────────────────────────────────────────────────
  const sendToGroq = async (blob, mimeType) => {
    if (!blob || blob.size < 1000) return
    setProcessing(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      const res = await axios.post(ServerUrl + '/api/v2/transcribe', form, { withCredentials: true })
      const text = (res.data.text || '').trim()
      if (text) setTranscript(text)
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Transcription failed'
      setMicError(msg)
    } finally {
      setProcessing(false)
    }
  }

  // ── Mic with Echo Cancellation ───────────────────────────────────────────
  const startMic = async () => {
    setMicError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']
        .find(m => MediaRecorder.isTypeSupported(m)) || ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 1000 && isMicRef.current) {
          chunksRef.current.push(e.data)
          const fullBlob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
          sendToGroq(fullBlob, rec.mimeType)
        }
      }
      rec.start(CHUNK_MS)
      mediaRecRef.current = rec
      isMicRef.current = true
      setMicOn(true)
    } catch (err) {
      setMicError('Microphone access denied')
    }
  }

  const stopMic = () => {
    isMicRef.current = false
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; mediaRecRef.current = null
    setMicOn(false)
  }

  const toggleMic = () => { if (isSpeaking) return; micOn ? stopMic() : startMic() }

  // ── New question ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentQ?.question) return
    stopMic(); setFeedback(null); setTranscript(''); setHintModalOpen(false)
    // eslint-disable-next-line
  }, [qIndex, isFollowUpPhase])

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeLeft(currentQ?.estimated_time_seconds || 90)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() =>
      setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); return 0 } return p - 1 })
    , 1000)
    return () => clearInterval(timerRef.current)
  }, [qIndex, isFollowUpPhase])

  useEffect(() => {
    if (timeLeft === 0 && !submitting && !finishLoading && !isSpeaking) {
      stopMic()

      // If any response was transcribed or entered during the allotted time, submit it for evaluation
      if (fullAnswer && fullAnswer.length > 0) {
        handleSubmit()
      } else {
        const next = qIndex + 1
        if (next >= totalQ) {
          handleFinish()
          return
        }
        setQIndex(next)
        setIsFollowUpPhase(false)
        setFollowUp(null)
      }
    }
  }, [timeLeft])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || !fullAnswer) return
    stopMic(); setSubmitting(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/submit', {
        interview_id, question_index: qIndex,
        answer: fullAnswer, is_follow_up: isFollowUpPhase,
        time_taken: initTime - timeLeft,
        integrity_flags: integrityFlags,
      }, { withCredentials: true })
      const data = res.data; setFeedback(data)
      setIntegrityFlags([])  // Clear sent flags
      
      if (data.next_action === 'finish') {
        handleFinish()
        return
      }
      if (data.next_action === 'follow_up' && data.follow_up_question) {
        setFollowUp(data.follow_up_question)
        setIsFollowUpPhase(true)
      } else {
        const next = qIndex + 1
        if (next >= totalQ) {
          handleFinish()
          return
        }
        setQIndex(next)
        setIsFollowUpPhase(false)
        setFollowUp(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = async () => {
    setFinishLoading(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/finish', {
        interview_id,
        integrity_flags: integrityFlags,
      }, { withCredentials: true })
      onFinish(res.data)
    } catch (e) { console.error(e); setFinishLoading(false) }
  }

  // ── Functional Hint Handler ───────────────────────────────────────────────
  const handleGetHint = async () => {
    setHintLoading(true)
    setHintModalOpen(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/hint', {
        interview_id,
        question_index: qIndex
      }, { withCredentials: true })
      setHintText(res.data.hint || "Focus your answer on explaining key concepts clearly with examples.")
    } catch (e) {
      setHintText("Focus your answer on explaining key concepts related to this topic with a real-world example.")
    } finally {
      setHintLoading(false)
    }
  }

  // ── Functional Skip Handler ───────────────────────────────────────────────
  const handleSkipQuestion = () => {
    stopMic()
    avatarRef.current?.stopSpeaking()
    setFeedback(null)
    setTranscript('')
    setHintModalOpen(false)

    if (isFollowUpPhase) {
      setIsFollowUpPhase(false)
      setFollowUp(null)
      const next = qIndex + 1
      if (next >= totalQ) {
        handleFinish()
      } else {
        setQIndex(next)
      }
    } else {
      const next = qIndex + 1
      if (next >= totalQ) {
        handleFinish()
      } else {
        setQIndex(next)
        setIsFollowUpPhase(false)
        setFollowUp(null)
      }
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Interview Interface */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* TruGen Official Cloud Avatar Widget */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-700/50 bg-[#090d16] min-h-[460px] flex items-center justify-center">
            <TrugenWidget agentId="db56efae-05b0-4c3b-956c-914bc31e4c04" inline={true} />
          </div>

          {/* Question Card */}
          <div className="glass-card-static rounded-3xl p-6 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-700 text-xs font-bold rounded-full border border-purple-500/20 flex items-center gap-1">
                  ✦ {isFollowUpPhase ? 'Follow-up' : currentQ?.category || 'Warm-up / Behavioral'}
                </span>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-700 text-xs font-bold rounded-full border border-amber-500/20 flex items-center gap-1">
                  ✦ {currentQ?.difficulty || 'Medium'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 glass-pill px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Expected: {Math.floor(initTime/60)} min
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.h2 
                key={`${qIndex}-${isFollowUpPhase}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-xl md:text-2xl font-bold text-slate-900 leading-snug font-['Outfit']"
              >
                {currentQ?.question}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Answer Card */}
          <div className="glass-card-static rounded-3xl p-6 flex flex-col flex-1 transition-all duration-300">
            <div className="flex border-b border-slate-200/70 mb-4">
              <button className="px-4 py-2 border-b-2 border-emerald-600 text-teal-900 font-bold text-xs uppercase tracking-wider">
                Type / Voice Answer
              </button>
            </div>

            <div className="relative flex-1 min-h-[200px] mb-4">
              {isDSAQuestion ? (
                <div className="flex flex-col gap-2.5 h-full">
                  {/* Language selector */}
                  <div className="flex items-center gap-2 mb-1">
                    <FaCode className="text-indigo-600 text-sm" />
                    <span className="text-xs font-bold text-slate-700">Language:</span>
                    {['python', 'javascript', 'java', 'cpp'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          codeLang === lang
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'glass-pill text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>
                  {/* Monaco Editor */}
                  <div className="rounded-2xl overflow-hidden border border-indigo-200/80 shadow-xs" style={{ height: 240 }}>
                    <Suspense fallback={
                      <div className="h-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
                        <FaSpinner className="animate-spin mr-2" /> Loading editor...
                      </div>
                    }>
                      <MonacoEditor
                        height="240px"
                        language={codeLang}
                        value={codeValue}
                        onChange={v => setCodeValue(v || '')}
                        theme="light"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: 'on',
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 4,
                        }}
                      />
                    </Suspense>
                  </div>
                  {/* Explanation textarea */}
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Explain your approach, time/space complexity..."
                    rows={3}
                    className="w-full resize-none outline-none text-slate-900 p-3.5 rounded-2xl glass-input text-xs font-mono"
                  />
                </div>
              ) : (
                <>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder={
                      isSpeaking ? 'AI is reading the question...' :
                      micOn ? 'Listening... your words will appear here automatically' :
                      'Type your answer here or click Start Recording to speak...'
                    }
                    disabled={isSpeaking}
                    className={`w-full h-full min-h-[200px] resize-none text-slate-900 p-4.5 rounded-2xl glass-input text-sm leading-relaxed transition-all duration-300 ${
                      micOn 
                        ? 'border-emerald-500 bg-emerald-50/40 glow-border-emerald' 
                        : ''
                    }`}
                  />
                  <div className="absolute bottom-4 left-4 text-xs font-bold text-slate-400">Words: {fullAnswer.split(/\s+/).filter(w => w.length > 0).length}</div>
                  {/* Processing badge */}
                  {processing && (
                    <div className="absolute bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold text-amber-700 flex items-center gap-1.5 shadow-xs">
                      <FaSpinner className="animate-spin" size={11} /> Transcribing...
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error */}
            {micError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 mb-4 text-xs font-bold text-rose-700 flex justify-between items-center">
                <span>⚠️ {micError}</span>
                <button onClick={() => setMicError('')} className="cursor-pointer">✕</button>
              </div>
            )}

            {/* Action Row */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mt-2">
              <button 
                onClick={toggleMic} 
                disabled={isSpeaking}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                  micOn 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse' 
                    : 'glass-pill text-slate-700 hover:border-slate-300'
                }`}
              >
                {micOn ? (
                  <><div className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></div> Stop Recording</>
                ) : (
                  <><FaMicrophone className="text-emerald-600" /> Start Recording</>
                )}
              </button>

              <div className="flex items-center gap-2.5 glass-pill px-4.5 py-2 rounded-full">
                <svg className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {Math.floor((initTime - timeLeft)/60).toString().padStart(2, '0')}:{(initTime - timeLeft)%60 | 0} / {Math.floor(initTime/60).toString().padStart(2, '0')}:{(initTime%60).toString().padStart(2,'0')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">Elapsed / Expected</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !fullAnswer || finishLoading || isSpeaking}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-2xl font-bold text-xs cursor-pointer shadow-md"
              >
                {submitting ? <><FaSpinner className="animate-spin" /> Evaluating...</> :
                 finishLoading ? <><FaSpinner className="animate-spin" /> Finishing...</> :
                 isSpeaking ? 'AI Speaking...' :
                 (qIndex === totalQ - 1 && !isFollowUpPhase ? 'Finish & Submit Interview' : 'Submit & Next Question')}
              </button>
            </div>

            <hr className="my-5 border-slate-200/60" />
            
            {/* Functional Hint & Skip Buttons */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-teal-700 font-bold">💡 Need guidance?</span> View a hint or skip forward.
              </div>
              <div className="flex gap-2.5">
                <button 
                  onClick={handleGetHint}
                  disabled={isSpeaking || submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300/80 bg-amber-50/80 text-amber-800 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                >
                  <FaLightbulb /> Hint
                </button>

                <button 
                  onClick={handleSkipQuestion}
                  disabled={isSpeaking || submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-pill text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <FaStepForward size={11} /> Skip Question
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Sidebar Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Interview Timeline */}
          <div className="glass-card-static rounded-3xl p-6">
            <h3 className="text-slate-900 font-bold text-base mb-5 font-['Outfit']">Interview Timeline</h3>
            <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              
              <div className="relative flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-xs z-10 shrink-0 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Resume Uploaded</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Completed</p>
                </div>
              </div>

              <div className="relative flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-xs z-10 shrink-0 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Role Detected</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Completed</p>
                </div>
              </div>

              {questions.map((_, i) => (
                <div key={i} className="relative flex items-start gap-3.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs z-10 shrink-0 mt-0.5 ${
                    i < qIndex ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white' : i === qIndex ? 'bg-emerald-500/20 border-2 border-emerald-600 text-teal-800 ring-2 ring-emerald-500/20' : 'glass-pill border border-slate-200'
                  }`}>
                    {i < qIndex && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div>
                    <p className={`text-xs leading-tight ${i === qIndex ? 'font-bold text-teal-900' : i < qIndex ? 'font-bold text-slate-700' : 'font-medium text-slate-400'}`}>Question {i+1}</p>
                    <p className={`text-[10px] mt-0.5 ${i === qIndex ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
                      {i < qIndex ? 'Completed' : i === qIndex ? 'In Progress' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="relative flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full glass-pill border border-slate-200 shadow-xs z-10 shrink-0 mt-0.5"></div>
                <div>
                  <p className="text-xs font-medium text-slate-400 leading-tight">Final Scorecard</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Feedback Preview Card */}
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card-static rounded-3xl p-6 border-emerald-500/30"
            >
              <h3 className="text-teal-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BsStars className="text-emerald-500" /> AI Instant Evaluation
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">{feedback.feedback}</p>

              {/* Justification quote */}
              {feedback.justification && (
                <p className="mt-2 text-xs text-slate-500 italic border-l-2 border-emerald-400 pl-2">
                  {feedback.justification}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Score:</span>
                  <span className="font-bold text-teal-800">{(feedback.final_score).toFixed(1)} / 10</span>
                </div>
                {/* Confidence badge */}
                {feedback.confidence !== undefined && (
                  <span
                    title="Evaluation confidence"
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      feedback.confidence >= 0.7
                        ? 'bg-emerald-500/15 text-teal-900 border border-emerald-500/20'
                        : feedback.confidence >= 0.4
                        ? 'bg-amber-500/15 text-amber-900 border border-amber-500/20'
                        : 'glass-pill text-slate-600'
                    }`}
                  >
                    {Math.round(feedback.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Integrity flag indicator (subtle, non-blocking) */}
          {integrityFlags.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5">
              <p className="text-xs text-amber-900 font-medium">
                ⚠️ {integrityFlags.length} tab-switch event{integrityFlags.length !== 1 ? 's' : ''} detected during this session.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ── HINT MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative border border-white/90"
            >
              <button 
                onClick={() => setHintModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 transition cursor-pointer"
              >
                <FaTimes size={15} />
              </button>

              <div className="flex items-center gap-3 text-amber-700 mb-4">
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/20 rounded-2xl">
                  <FaLightbulb size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-['Outfit']">Question Guidance & Hint</h3>
                  <p className="text-xs text-amber-800">Tailored to help frame your answer</p>
                </div>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 mb-6">
                {hintLoading ? (
                  <div className="flex items-center justify-center py-4 text-amber-800 text-xs font-semibold gap-2">
                    <FaSpinner className="animate-spin" /> Generating tailored hint...
                  </div>
                ) : (
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {hintText}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <button
                  onClick={() => avatarRef.current?.speak(hintText)}
                  disabled={hintLoading || !hintText}
                  className="flex items-center gap-2 px-3.5 py-2 glass-pill text-amber-900 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <FaVolumeUp /> Listen
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!hintText) return
                      setTranscript(prev => (prev ? prev + '\n\nKey Focus: ' + hintText : 'Key Focus: ' + hintText))
                      setHintModalOpen(false)
                    }}
                    disabled={hintLoading || !hintText}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Use in Answer
                  </button>

                  <button
                    onClick={() => setHintModalOpen(false)}
                    className="px-4 py-2 glass-btn-primary text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default V2InterviewRoom
