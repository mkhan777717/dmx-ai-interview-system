import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'motion/react'
import { FaMicrophone, FaVolumeUp, FaUserTie, FaCog, FaCheckCircle } from 'react-icons/fa'
import { BsStars, BsLightningFill } from 'react-icons/bs'

// ── Persona Avatars ──────────────────────────────────────────────────────────
export const AVATAR_PERSONAS = [
  {
    id: 'alex',
    name: 'Alex Vance',
    role: 'Senior Tech Lead',
    company: 'InterviewIQ AI',
    gender: 'male',
    voicePitch: 0.95,
    trugenAvatarId: '80b9095f',
    avatarUrl: 'https://assets.trugen.ai/images/avatarImages/matt.jpeg',
    idleVideoUrl: 'https://assets.trugen.ai/videos/avatar-videos/matt_wide.mp4',
    avatarFallback: 'https://ui-avatars.com/api/?name=Alex+Vance&background=064e3b&color=10b981&size=400',
    badge: 'Technical & System Design',
    color: 'emerald',
  },
  {
    id: 'sophia',
    name: 'Sophia Chen',
    role: 'Principal Engineer & Manager',
    company: 'InterviewIQ AI',
    gender: 'female',
    voicePitch: 1.1,
    trugenAvatarId: '1928040f',
    avatarUrl: 'https://assets.trugen.ai/images/avatarImages/sofia-wide.jpeg',
    idleVideoUrl: 'https://assets.trugen.ai/videos/avatar-videos/sofia_wide.mov',
    avatarFallback: 'https://ui-avatars.com/api/?name=Sophia+Chen&background=0d9488&color=5eead4&size=400',
    badge: 'Behavioral & Culture Fit',
    color: 'teal',
  },
  {
    id: 'marcus',
    name: 'Marcus Brody',
    role: 'Executive Hiring Director',
    company: 'InterviewIQ AI',
    gender: 'male',
    voicePitch: 0.85,
    trugenAvatarId: '05a001fc',
    avatarUrl: 'https://assets.trugen.ai/images/avatarImages/jason_wide.jpg',
    idleVideoUrl: 'https://assets.trugen.ai/videos/avatar-videos/jason_wide.mp4',
    avatarFallback: 'https://ui-avatars.com/api/?name=Marcus+Brody&background=1e1b4b&color=818cf8&size=400',
    badge: 'Executive & Leadership',
    color: 'indigo',
  },
]

/**
 * HumanAvatar — Lifelike AI Interviewer Component
 *
 * Simulates realistic human behavior:
 * - Natural eye blinking & micro-expressions
 * - Head nodding when listening to candidate
 * - Lip-sync mouth animation synced to speech output
 * - Thinking/processing state with visual feedback
 * - Persona selection (Alex, Sophia, Marcus)
 */
export default function HumanAvatar({
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  statusText = 'Ready',
  activePersona = AVATAR_PERSONAS[0],
  onSelectPersona,
}) {
  const [blink, setBlink] = useState(false)
  const [nod, setNod] = useState(false)
  const [mouthHeight, setMouthHeight] = useState(4)
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)

  // ── Lifelike Blinking Loop ────────────────────────────────────────────────
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }, Math.random() * 2500 + 2500)
    return () => clearInterval(blinkInterval)
  }, [])

  // ── Lifelike Head Nodding when candidate speaks (listening state) ────────
  useEffect(() => {
    if (!isListening) return
    const nodInterval = setInterval(() => {
      setNod(true)
      setTimeout(() => setNod(false), 900)
    }, 4000)
    return () => clearInterval(nodInterval)
  }, [isListening])

  // ── Lip-Sync Mouth Height Loop when AI speaks ─────────────────────────────
  useEffect(() => {
    if (!isSpeaking) {
      setMouthHeight(4)
      return
    }
    const mouthInterval = setInterval(() => {
      setMouthHeight(Math.floor(Math.random() * 18) + 6)
    }, 110)
    return () => clearInterval(mouthInterval)
  }, [isSpeaking])

  const persona = activePersona || AVATAR_PERSONAS[0]

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 border border-slate-700 shadow-2xl overflow-hidden">

      {/* Top Header & Persona Selector */}
      <div className="flex items-center justify-between mb-4 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Human AI Interviewer
          </span>
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <FaUserTie size={12} className="text-emerald-400" />
            <span>{persona.name}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Select Interviewer Avatar
              </p>
              {AVATAR_PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPersona?.(p)
                    setShowPersonaMenu(false)
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center gap-3 ${
                    persona.id === p.id ? 'bg-emerald-950/80 border border-emerald-500/40' : 'hover:bg-slate-800'
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    onError={(e) => { e.target.src = p.avatarFallback }}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.role}</p>
                  </div>
                  {persona.id === p.id && <FaCheckCircle className="ml-auto text-emerald-400" size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Avatar Stage */}
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">

        {/* Lifelike Avatar Frame */}
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0">

          {/* Ambient State Glow Ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 blur-md ${
              isSpeaking
                ? 'bg-emerald-500/40 scale-105'
                : isListening
                ? 'bg-teal-400/40 scale-105'
                : isProcessing
                ? 'bg-purple-500/40 scale-105'
                : 'bg-transparent'
            }`}
          />

          {/* Avatar Container with Motion Nodding */}
          <motion.div
            animate={{
              y: nod ? [0, 6, 0] : isSpeaking ? [0, -2, 0] : [0, -3, 0],
              rotate: nod ? [0, 2, 0] : 0,
            }}
            transition={{
              y: { duration: nod ? 0.8 : isSpeaking ? 1.2 : 4, repeat: nod ? 0 : Infinity, ease: 'easeInOut' },
              rotate: { duration: 0.8 },
            }}
            className={`w-full h-full rounded-full relative overflow-hidden border-4 transition-colors duration-300 shadow-2xl ${
              isSpeaking
                ? 'border-emerald-400'
                : isListening
                ? 'border-teal-400'
                : isProcessing
                ? 'border-purple-400 animate-pulse'
                : 'border-slate-700'
            }`}
          >
            {/* Base Photorealistic Image */}
            <img
              src={persona.avatarUrl}
              alt={persona.name}
              className="w-full h-full object-cover object-top filter brightness-95 contrast-105"
              onError={(e) => { e.target.src = persona.avatarFallback }}
            />

            {/* Micro-expression Overlay: Eye Blink */}
            <div
              className={`absolute top-[34%] left-[22%] right-[22%] h-[12%] bg-slate-900/90 rounded-full transition-opacity duration-75 pointer-events-none ${
                blink ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Micro-expression Overlay: Lip-sync Mouth Animation when speaking */}
            {isSpeaking && (
              <div
                className="absolute bottom-[26%] left-1/2 -translate-x-1/2 bg-rose-950/80 border border-rose-500/40 rounded-full transition-all duration-100 shadow-inner"
                style={{
                  width: '28px',
                  height: `${mouthHeight}px`,
                }}
              />
            )}
          </motion.div>

          {/* Status Badge Over Avatar */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-full px-3 py-0.5 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? 'bg-emerald-400 animate-ping'
                  : isListening
                  ? 'bg-teal-400 animate-pulse'
                  : isProcessing
                  ? 'bg-purple-400 animate-spin'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-[10px] font-bold text-slate-200">
              {isSpeaking
                ? 'Speaking...'
                : isListening
                ? 'Listening to candidate...'
                : isProcessing
                ? 'Evaluating Answer...'
                : 'Ready'}
            </span>
          </div>
        </div>

        {/* Right Info & Live Waveform Visualizer */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="text-lg font-bold text-white">{persona.name}</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                AI Interviewer
              </span>
            </div>
            <p className="text-xs text-slate-400">{persona.role} · {persona.company}</p>
          </div>

          <div className="inline-block px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
            📌 Focus: {persona.badge}
          </div>

          {/* Live Audio Frequency Waveform */}
          <div className="pt-2">
            <div className="flex items-center justify-center md:justify-start gap-1 h-7">
              {(isSpeaking || isListening) ? (
                [14, 28, 10, 36, 22, 40, 18, 30, 12, 26, 38, 16, 24, 32].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ['6px', `${Math.random() * 22 + 8}px`, '6px'] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                    className={`w-1 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-teal-400'}`}
                  />
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Avatar ready — click mic or type to speak</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
