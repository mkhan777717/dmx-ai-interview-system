import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FaMicrophone, FaMicrophoneSlash, FaSpinner, FaLightbulb } from 'react-icons/fa'
import { BsLightningFill } from 'react-icons/bs'
import axios from 'axios'
import { ServerUrl } from '../App'

const CHUNK_MS = 4000
const GREEN = '#10b981'

// ── TTS ───────────────────────────────────────────────────────────────────────
function getBestVoice() {
  const v = window.speechSynthesis.getVoices()
  return v.find(x => x.name === 'Google US English')
      || v.find(x => x.name === 'Samantha')
      || v.find(x => x.name === 'Karen')
      || v.find(x => x.name.includes('Google') && x.lang.startsWith('en'))
      || v.find(x => x.lang === 'en-US') || null
}
function speakText(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = 0.78; u.pitch = 1; u.volume = 1
  u.onend = () => onEnd?.(); u.onerror = () => onEnd?.()
  const go = () => { const v = getBestVoice(); if (v) u.voice = v; window.speechSynthesis.speak(u) }
  window.speechSynthesis.getVoices().length > 0 ? go()
    : (window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; go() })
}

// ── Circular timer SVG ───────────────────────────────────────────────────────
function CircularTimer({ seconds, total }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, seconds / total)
  const dash  = pct * circ

  const color = seconds <= 10 ? '#ef4444' : seconds <= 20 ? '#f59e0b' : GREEN

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {seconds}s
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
function V2InterviewRoom({ sessionData, onFinish, onProgressUpdate }) {
  const { interview_id, questions, candidate_name } = sessionData

  const [qIndex, setQIndex]                   = useState(0)
  const [transcript, setTranscript]           = useState('')
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

  const mediaRecRef  = useRef(null)
  const streamRef    = useRef(null)
  const timerRef     = useRef(null)
  const isMicRef     = useRef(false)
  const isSpeakRef   = useRef(false)
  const chunksRef    = useRef([])

  const currentQ = isFollowUpPhase
    ? { question: followUp, estimated_time_seconds: 60 } : questions[qIndex]
  const totalQ     = questions.length
  const fullAnswer = transcript.trim()
  const initTime   = currentQ?.estimated_time_seconds || 90

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        text: `${qIndex + 1} / ${totalQ} Questions`,
        percent: ((qIndex) / totalQ) * 100
      })
    }
  }, [qIndex, totalQ, onProgressUpdate])

  // ── Groq transcription ────────────────────────────────────────────────────
  const sendToGroq = async (blob, mimeType) => {
    if (!blob || blob.size < 1000) return
    setProcessing(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      const res = await axios.post(ServerUrl + '/api/v2/transcribe', form, { withCredentials: true })
      const text = (res.data.text || '').trim()
      if (text) setTranscript(text) // replace transcript with full transcribed text so far
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Transcription failed'
      setMicError(msg)
    } finally {
      setProcessing(false)
    }
  }

  // ── Mic ───────────────────────────────────────────────────────────────────
  const startMic = async () => {
    if (isSpeakRef.current) return
    setMicError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']
        .find(m => MediaRecorder.isTypeSupported(m)) || ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
      chunksRef.current = [] // reset chunks on start
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
    stopMic(); setFeedback(null); setTranscript('')
    isSpeakRef.current = true; setIsSpeaking(true)
    speakText(currentQ.question, () => { isSpeakRef.current = false; setIsSpeaking(false) })
    return () => window.speechSynthesis?.cancel()
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
      if (!fullAnswer) {
        // Skip to next if no answer given
        stopMic(); window.speechSynthesis?.cancel()
        const next = qIndex + 1
        if (next >= totalQ) { handleFinish(); return }
        setQIndex(next); setIsFollowUpPhase(false); setFollowUp(null)
      } else {
        handleSubmit()
      }
    }
  }, [timeLeft])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || !fullAnswer) return
    stopMic(); window.speechSynthesis?.cancel(); setSubmitting(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/submit', {
        interview_id, question_index: qIndex,
        answer: fullAnswer, is_follow_up: isFollowUpPhase,
        time_taken: initTime - timeLeft,
      }, { withCredentials: true })
      const data = res.data; setFeedback(data)
      
      const proceed = () => {
        if (data.next_action === 'finish') { handleFinish(); return }
        if (data.next_action === 'follow_up' && data.follow_up_question) {
          setFollowUp(data.follow_up_question); setIsFollowUpPhase(true)
        } else {
          const next = qIndex + 1
          if (next >= totalQ) { handleFinish(); return }
          setQIndex(next); setIsFollowUpPhase(false); setFollowUp(null)
        }
      }

      if (data.feedback) {
        isSpeakRef.current = true; setIsSpeaking(true)
        speakText(data.feedback, () => {
          isSpeakRef.current = false; setIsSpeaking(false)
          proceed()
        })
      } else {
        proceed()
      }
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  const handleFinish = async () => {
    setFinishLoading(true)
    try {
      const res = await axios.post(ServerUrl + '/api/v2/interview/finish', { interview_id }, { withCredentials: true })
      onFinish(res.data)
    } catch (e) { console.error(e); setFinishLoading(false) }
  }

  // Status label top-right of left panel
  const statusLabel = isSpeaking ? 'AI Speaking'
    : micOn && processing ? 'Converting...'
    : micOn ? 'Listening'
    : 'Idle'
  const statusColor = isSpeaking ? GREEN
    : micOn ? '#ef4444'
    : '#9ca3af'

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Interview Interface */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* AI Interviewer Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <div className={`absolute inset-0 rounded-full border-4 ${isSpeaking ? 'border-green-400' : 'border-transparent'} transition-colors duration-500`}></div>
              <img src="/ai_avatar.jpg" alt="AI Interviewer" className="w-full h-full rounded-full object-cover object-top p-1" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">AI Interviewer</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : micOn ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-semibold ${isSpeaking ? 'text-green-600' : micOn ? 'text-red-500' : 'text-gray-500'}`}>
                  {isSpeaking ? 'Speaking...' : micOn && processing ? 'Processing...' : micOn ? 'Listening...' : 'Ready'}
                </span>
              </div>
              
              {/* Sound Wave Animation Placeholder */}
              <div className="flex items-center gap-1 h-8 opacity-60">
                {(isSpeaking || micOn) ? [0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <motion.div key={i}
                    animate={{ height: ['8px', Math.random()*24 + 10 + 'px', '8px'] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                    className={`w-1.5 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-red-500'}`} 
                  />
                )) : (
                  <div className="text-gray-400 text-sm">Audio inactive</div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">Tip: Take your time and think before answering ⓘ</p>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100 flex items-center gap-1">
                  ✦ {isFollowUpPhase ? 'Follow-up' : 'Behavioral'}
                </span>
                <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-md border border-orange-100 flex items-center gap-1">
                  ✦ Medium
                </span>
              </div>
              <div className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Expected Time: {Math.floor(initTime/60)} min
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.h2 
                key={`${qIndex}-${isFollowUpPhase}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-xl md:text-2xl font-bold text-gray-900 leading-snug"
              >
                {currentQ?.question}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Answer Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col flex-1">
            <div className="flex border-b border-gray-200 mb-4">
              <button className="px-4 py-2 border-b-2 border-green-500 text-green-600 font-semibold text-sm">Type Answer</button>
              <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 font-medium text-sm flex items-center gap-2">
                <FaMicrophone /> Speak Answer
              </button>
            </div>

            <div className="relative flex-1 min-h-[200px] mb-4">
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder={
                  isSpeaking ? 'AI is reading the question...' :
                  micOn ? 'Listening... your words will appear here automatically' :
                  'Type your answer here...'
                }
                disabled={isSpeaking}
                className={`w-full h-full min-h-[200px] resize-none outline-none text-gray-800 p-4 rounded-xl border ${micOn ? 'border-green-400 bg-green-50/30' : 'border-gray-200 bg-gray-50'} focus:bg-white focus:border-green-400 transition-colors`}
              />
              <div className="absolute bottom-4 left-4 text-xs font-medium text-gray-400">Words: {fullAnswer.split(/\s+/).filter(w => w.length > 0).length}</div>
              
              {/* Processing badge */}
              {processing && (
                <div className="absolute bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5 text-xs font-medium text-yellow-700 flex items-center gap-2">
                  <FaSpinner className="animate-spin" /> Converting...
                </div>
              )}
            </div>

            {/* Error */}
            {micError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600 flex justify-between items-center">
                <span>⚠️ {micError}</span>
                <button onClick={() => setMicError('')}>✕</button>
              </div>
            )}

            {/* Action Row */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mt-2">
              <button 
                onClick={toggleMic} 
                disabled={isSpeaking}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition ${micOn ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
              >
                {micOn ? (
                  <><div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div> Stop Recording</>
                ) : (
                  <><FaMicrophone /> Start Recording</>
                )}
              </button>

              <div className="flex items-center gap-3 border border-gray-200 rounded-full px-5 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800 leading-tight">
                    {Math.floor((initTime - timeLeft)/60).toString().padStart(2, '0')}:{(initTime - timeLeft)%60 | 0} / {Math.floor(initTime/60).toString().padStart(2, '0')}:{(initTime%60).toString().padStart(2,'0')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Elapsed / Expected</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !fullAnswer || finishLoading || isSpeaking}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                {submitting ? <><FaSpinner className="animate-spin" /> Evaluating...</> :
                 finishLoading ? <><FaSpinner className="animate-spin" /> Finishing...</> :
                 isSpeaking ? 'AI Speaking...' :
                 'Submit Answer'}
              </button>
            </div>

            <hr className="my-5 border-gray-100" />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="text-blue-500">💡 Need help?</span> You can ask for a hint or skip this question if needed.
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Hint</button>
                <button className="px-5 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Skip</button>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Sidebar Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Interview Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-semibold mb-6">Interview Timeline</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              
              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm z-10 shrink-0 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 leading-tight">Resume Uploaded</p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed</p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm z-10 shrink-0 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 leading-tight">Role Detected</p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed</p>
                </div>
              </div>

              {questions.map((_, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10 shrink-0 mt-0.5 ${i < qIndex ? 'bg-green-500 text-white' : i === qIndex ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-200'}`}>
                    {i < qIndex && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div>
                    <p className={`text-sm leading-tight ${i === qIndex ? 'font-bold text-green-600' : i < qIndex ? 'font-semibold text-gray-700' : 'font-medium text-gray-500'}`}>Question {i+1}</p>
                    <p className={`text-xs mt-0.5 ${i === qIndex ? 'text-green-500' : 'text-gray-400'}`}>
                      {i < qIndex ? 'Completed' : i === qIndex ? 'In Progress' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 shadow-sm z-10 shrink-0 mt-0.5"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 leading-tight">Final Report</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Evaluation */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-semibold mb-2">Live Evaluation <span className="text-gray-400 font-normal text-xs">(Will update after you submit)</span></h3>
            
            <div className="flex items-center gap-6 mt-6">
              {/* Circular Score (Static placeholder for mockup) */}
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  {feedback && <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${(feedback.final_score/10)*283} 283`} strokeLinecap="round" className="transition-all duration-1000" />}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{feedback ? Math.round((feedback.final_score/10)*100) : '--'}%</span>
                  <span className="text-[9px] text-gray-500 -mt-1">Predicted<br/>Score</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                {[
                  { label: 'Relevance', val: feedback ? (feedback.relevance/10)*100 : null },
                  { label: 'Clarity', val: feedback ? (feedback.clarity/10)*100 : null },
                  { label: 'Completeness', val: feedback ? (feedback.completeness/10)*100 : null },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-xs font-medium text-gray-600">{m.label}</span>
                    <span className="text-xs font-bold text-gray-800">{m.val !== null ? `${Math.round(m.val)}%` : '--%'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-semibold mb-5 text-sm">Evaluation Criteria</h3>
            <div className="space-y-4">
               {[
                 'Relevance to question',
                 'Key Concepts Covered',
                 'Communication Clarity',
                 'Structure & Flow'
               ].map(c => (
                 <div key={c} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32">{c}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-800 w-6 text-right">--%</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex gap-4">
            <div className="text-green-500 mt-1"><FaLightbulb size={20}/></div>
            <div>
               <h3 className="text-sm font-semibold text-gray-900 mb-1">Tips</h3>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Structure your answer using STAR method (Situation, Task, Action, Result) for behavioral questions.
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default V2InterviewRoom
