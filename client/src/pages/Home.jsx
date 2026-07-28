import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import AuthModel from '../components/AuthModel'
import {
  BsStars, BsPlayFill, BsCheckCircleFill, BsLightningChargeFill,
  BsShieldCheck, BsArrowRight, BsGraphUpArrow, BsCpu, BsBriefcase,
  BsPersonWorkspace, BsAwardFill, BsChatQuote, BsCheckLg,
} from 'react-icons/bs'
import { HiArrowUpRight, HiSparkles } from 'react-icons/hi2'
import { FaGraduationCap, FaBuilding, FaUserCheck, FaMicrophoneAlt } from 'react-icons/fa'

export default function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Software Engineer')
  const [selectedLevel, setSelectedLevel] = useState('Mid-Level')
  const [selectedMode, setSelectedMode] = useState('Technical')
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('candidates')
  const [demoPlaying, setDemoPlaying] = useState(false)
  const navigate = useNavigate()

  const handleStart = () => {
    if (!userData) return setShowAuth(true)
    navigate('/v2/interview')
  }

  const handleHistory = () => {
    if (!userData) return setShowAuth(true)
    navigate('/history')
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 font-['Inter',sans-serif] selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">

      {/* Ambient Background Mesh & Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[950px] h-[600px] bg-gradient-to-b from-emerald-100/70 via-teal-50/50 to-transparent rounded-full blur-3xl opacity-90" />
        <div className="absolute top-[10%] left-[8%] w-[450px] h-[450px] bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="absolute top-[12%] right-[8%] w-[450px] h-[450px] bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-35" />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <Navbar />

      <main className="pt-28 relative z-10">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="px-6 pt-8 pb-20 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">

            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold mb-8 shadow-xs"
            >
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] tracking-wide uppercase">
                Train with AI
              </span>
              <span className="text-slate-700">Perform 4x better in real interviews</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-[68px] font-bold text-slate-900 leading-[1.08] tracking-tight mb-6"
            >
              Develop Job-Ready Talent with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                AI-Powered
              </span>{' '}
              Interview Prep
            </motion.h1>

            {/* Sub-heading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10"
            >
              InterviewIQ dynamically generates role-specific questions, evaluates content & tone in real-time, and delivers actionable performance scoring.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-12"
            >
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-bold text-base transition-all shadow-xl shadow-teal-900/15 hover:shadow-2xl hover:scale-[1.02] cursor-pointer group"
              >
                <span>Start Free Practice</span>
                <HiArrowUpRight className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400" />
              </button>

              <button
                onClick={() => setDemoPlaying(!demoPlaying)}
                className="flex items-center gap-2.5 px-7 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-base transition-all shadow-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BsPlayFill size={16} className="ml-0.5" />
                </div>
                <span>Watch How It Works</span>
              </button>
            </motion.div>

            {/* Social Proof Stack */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium"
            >
              <div className="flex -space-x-2 overflow-hidden">
                {['alex', 'sarah', 'michael', 'elena'].map((name, i) => (
                  <img
                    key={name}
                    src={`https://ui-avatars.com/api/?name=${name}&background=${['064e3b','0d9488','15803d','047857'][i]}&color=fff&size=64`}
                    alt="User"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                  {'★'.repeat(5)}
                  <span className="font-bold text-slate-800 ml-1">4.9/5</span>
                </div>
                <p className="text-slate-600">Trusted by 10,000+ candidates & hiring teams</p>
              </div>
            </motion.div>

          </div>

          {/* ── HERO INTERACTIVE DASHBOARD PREVIEW ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 relative max-w-6xl mx-auto"
          >
            {/* Ambient glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-blue-100/40 rounded-3xl blur-2xl -z-10 transform scale-95" />

            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_25px_70px_rgba(0,0,0,0.07)] p-6 sm:p-8 overflow-hidden">

              {/* Mock App Header Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Jasper+Ron&background=064e3b&color=10b981&size=64"
                    alt="User"
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Welcome Back, Candidate! 👋</h3>
                    <p className="text-xs text-slate-500">Ready to practice your next technical screen?</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    100 AI Credits
                  </div>
                  <button
                    onClick={handleStart}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <BsStars size={12} />
                    Start Interview
                  </button>
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Total Mock Interviews</p>
                  <p className="text-2xl font-extrabold text-slate-900">38</p>
                  <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2">
                    ↑ +12 this month
                  </span>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Average AI Score</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-extrabold text-slate-900">8.7</p>
                    <span className="text-xs text-slate-400 font-medium">/ 10</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2">
                    ↑ 12.7% improvement
                  </span>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Practice Time</p>
                  <p className="text-2xl font-extrabold text-slate-900">37h 21m</p>
                  <span className="inline-block text-[10px] font-medium text-slate-500 mt-2">
                    Last 30 Days
                  </span>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Streak</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-extrabold text-slate-900">7 Days 🔥</p>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-2">
                    Active streak!
                  </span>
                </div>
              </div>

              {/* Active Practice Session Visualizer */}
              <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-teal-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">

                  {/* Left: AI Question Preview */}
                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wide uppercase">
                        Question 3 of 5 · Technical
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Turn Latency: 320ms</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold leading-snug text-white">
                      "Explain how you would design a rate limiter service for a high-traffic REST API in distributed environments."
                    </h4>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <FaMicrophoneAlt className="text-emerald-400 animate-pulse" /> Live Voice Processing...
                        </span>
                        <span className="text-emerald-400 font-bold">92% Answer Match</span>
                      </div>
                      <div className="flex items-center gap-1 h-5">
                        {[12, 24, 8, 30, 18, 36, 14, 28, 22, 16, 32, 10, 20, 26, 12, 34, 18].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-emerald-400/80 rounded-full transition-all duration-300"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live AI Evaluation Card */}
                  <div className="w-full md:w-64 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3 shrink-0 flex flex-col justify-between">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Evaluation Matrix</p>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-200 mb-1">
                          <span>Semantic Accuracy</span>
                          <span className="font-bold text-white">92%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full w-[92%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-200 mb-1">
                          <span>Concept Coverage</span>
                          <span className="font-bold text-white">88%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 rounded-full w-[88%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-200 mb-1">
                          <span>Communication & Tone</span>
                          <span className="font-bold text-white">94%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full w-[94%]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-300 font-semibold">AI Flag: Clean</span>
                      <span className="text-slate-300">0 Follow-up Flags</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </section>

        {/* ── BRAND LOGOS / TRUSTED BY ──────────────────────────────────────── */}
        <section className="py-12 bg-slate-50/60 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
              Trusted by Candidates & Hiring Teams at Leading Companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
              {['Google', 'Meta', 'Microsoft', 'Amazon', 'Apple', 'Stanford', 'MIT'].map(brand => (
                <span key={brand} className="text-slate-700 font-extrabold text-xl tracking-tight">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY ORGANIZATIONS & CANDIDATES CHOOSE ────────────────────────── */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase">
              Benefits
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mt-4 mb-4">
              Why Organizations & Professionals Choose InterviewIQ
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Everything you need to master technical & behavioral interviews with measurable results.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">

            {/* Left: 4 Core Pillars of Measurable Insight */}
            <div className="lg:col-span-6 space-y-5">
              {[
                {
                  num: '01',
                  title: 'Conversational AI Real-Time Adaptation',
                  desc: 'Conversational AI that adapts to each answer in real time, asking intelligent follow-ups based on candidate depth.',
                  icon: FaMicrophoneAlt,
                },
                {
                  num: '02',
                  title: 'Deep Dual Content & Delivery Scoring',
                  desc: 'Deep scoring on both delivery dynamics and exact technical answer content accuracy.',
                  icon: BsGraphUpArrow,
                },
                {
                  num: '03',
                  title: 'Comprehensive Communication Metrics',
                  desc: 'Communication metrics that track tone, pacing (WPM), and vocal confidence index across every question.',
                  icon: BsCpu,
                },
                {
                  num: '04',
                  title: 'Session-over-Session Progress Tracking',
                  desc: 'Progress tracking that shows measurable skill improvement and percentile ranking session over session.',
                  icon: BsAwardFill,
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex items-start gap-4 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-900 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                    {item.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Interactive Practice Setup Widget */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Try Practice Setup</span>
                    <h3 className="text-xl font-bold text-white mt-1">Configure Your Practice Session</h3>
                  </div>
                  <BsStars className="text-emerald-400 text-xl" />
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Target Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer'].map(role => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer border ${
                          selectedRole === role
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Experience Level</label>
                  <div className="flex gap-2">
                    {['Entry-Level', 'Mid-Level', 'Senior', 'Lead / Staff'].map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          selectedLevel === level
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Interview Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Technical', 'HR & Behavioral', 'Live Voice AI'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border text-center ${
                          selectedMode === mode
                            ? 'bg-teal-700 text-white border-teal-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-4"
                >
                  <span>Start Practice Session ({selectedRole})</span>
                  <HiArrowUpRight />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── CANDIDATE VS RECRUITER WORKFLOW SHOWCASE ───────────────────── */}
        <section className="py-20 bg-slate-50/80 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed for Candidates and Recruiting Teams
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2">
                One platform powered by the same evaluation pipeline, customized for practice or hiring automation.
              </p>

              {/* Tabs */}
              <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl mt-6 border border-slate-300">
                <button
                  onClick={() => setActiveWorkflowTab('candidates')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeWorkflowTab === 'candidates'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  For Candidates (Practice Mode)
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('recruiters')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeWorkflowTab === 'recruiters'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  For Recruiters (Org Screening)
                </button>
              </div>
            </div>

            {/* Workflow Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-5xl mx-auto">
              {activeWorkflowTab === 'candidates' ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">1</div>
                    <h4 className="font-bold text-slate-900 text-base">Select Your Domain</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">Pick from 20+ job roles or upload your resume for customized question generation.</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">2</div>
                    <h4 className="font-bold text-slate-900 text-base">Practice Voice & Code</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">Respond via speech or code editor. AI dynamically asks follow-up questions.</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">3</div>
                    <h4 className="font-bold text-slate-900 text-base">Review Score Report</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">Get hiring recommendations, strengths, missing concepts, and improvement roadmap.</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-900 text-emerald-400 flex items-center justify-center font-bold text-sm">1</div>
                    <h4 className="font-bold text-slate-900 text-base">Invite Candidate Pool</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">Bulk invite candidates by email to standardized interview template links.</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-900 text-emerald-400 flex items-center justify-center font-bold text-sm">2</div>
                    <h4 className="font-bold text-slate-900 text-base">Automated Screening</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">AI scores all answers, detects integrity flags, and ranks candidates in a central pipeline.</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-900 text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
                    <h4 className="font-bold text-slate-900 text-base">Human Override & Audit</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">Recruiters can review transcripts, override AI scores, and export PDF reports.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── PRICING SECTION ──────────────────────────────────────────────── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mt-4 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-base">
              Start for free, upgrade when you need unlimited practice or recruiting features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Starter Free</p>
                <h3 className="text-4xl font-extrabold text-slate-900">$0 <span className="text-xs font-normal text-slate-500">/ forever</span></h3>
                <p className="text-slate-600 text-xs mt-3 mb-6">Perfect for quick self-assessment and trying out AI interviews.</p>
                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> 100 Free Credits on Signup</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Standard Technical & HR Questions</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Basic Score Report</li>
                </ul>
              </div>
              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Candidate */}
            <div className="bg-teal-900 text-white rounded-3xl p-8 border border-teal-800 shadow-xl flex flex-col justify-between relative transform lg:-translate-y-2">
              <span className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Candidate Pro</p>
                <h3 className="text-4xl font-extrabold text-white">$19 <span className="text-xs font-normal text-slate-300">/ month</span></h3>
                <p className="text-slate-300 text-xs mt-3 mb-6">Unlimited mock interviews with voice AI & detailed analytics.</p>
                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-400 shrink-0" /> Unlimited Mock Interviews</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-400 shrink-0" /> Real-Time Voice AI Interviewer</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-400 shrink-0" /> Deep Rubric Analysis & PDF Reports</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-400 shrink-0" /> Personalized Improvement Roadmap</li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Upgrade to Pro ↗
              </button>
            </div>

            {/* Recruiter / Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recruiter & Team</p>
                <h3 className="text-4xl font-extrabold text-slate-900">$99 <span className="text-xs font-normal text-slate-500">/ month</span></h3>
                <p className="text-slate-600 text-xs mt-3 mb-6">Org candidate screening pipeline with RBAC and score overrides.</p>
                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Recruiter Hub & Bulk Candidate Invites</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Custom Question Templates & Rubrics</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Human Score Override & Audit Logging</li>
                  <li className="flex items-center gap-2"><BsCheckLg className="text-emerald-600 shrink-0" /> Super Admin Multi-Tenant Support</li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER CALL TO ACTION ────────────────────────────────────────── */}
        <section className="px-6 py-12 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide uppercase">
                Get Started Today
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                Ready to Master Your Next Interview?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Join thousands of candidates who practice with AI to land their dream job.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-9 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 cursor-pointer"
                >
                  <span>Start Free Practice Now</span>
                  <HiArrowUpRight />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-6 h-6 rounded-md bg-teal-900 text-emerald-400 flex items-center justify-center text-xs">
              <BsStars size={12} />
            </div>
            <span>InterviewIQ.AI</span>
          </div>

          <p>© 2026 InterviewIQ Inc. All rights reserved.</p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition">Support</a>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
