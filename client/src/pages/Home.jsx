import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import { motion } from "motion/react"
import { useNavigate } from 'react-router-dom'
import AuthModel from '../components/AuthModel'
import { 
  BsRobot, BsClock, BsArrowRight, 
  BsPersonBadge, BsFileEarmarkText, BsBarChart,
  BsShieldCheck, BsStarFill, BsLock, BsLightningCharge
} from "react-icons/bs"
import { HiSparkles, HiOutlineChartSquareBar } from "react-icons/hi"
import { FaCheckCircle } from 'react-icons/fa'

function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const handleStart = () => {
    if (!userData) return setShowAuth(true)
    navigate("/v2/interview")
  }

  const handleHistory = () => {
    if (!userData) return setShowAuth(true)
    navigate("/history")
  }

  return (
    <div className='min-h-screen bg-[#Fcfcfd] flex flex-col font-["Inter",sans-serif] overflow-hidden relative'>
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      
      <Navbar />

      <main className='flex-1 px-6 pt-32 pb-24 w-full max-w-7xl mx-auto z-10'>
        
        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <div className='grid lg:grid-cols-2 gap-16 lg:gap-8 items-center mb-32'>
          
          {/* Left: Copy & Actions */}
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-semibold mb-6'
            >
              <HiSparkles size={14} />
              AI Powered Smart Interview Platform
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className='text-5xl lg:text-[64px] font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight'
            >
              Practice Interviews<br/>with <span className='text-green-500'>AI Intelligence</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className='text-gray-500 text-lg md:text-xl leading-relaxed mb-10 max-w-lg'
            >
              Role-based mock interviews with smart follow-ups, adaptive difficulty and real-time performance evaluation.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className='flex flex-wrap items-center gap-4 mb-14'
            >
              <button 
                onClick={handleStart}
                className='flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-black transition-colors shadow-[0_8px_20px_rgb(0,0,0,0.12)]'
              >
                <BsRobot size={18} />
                Start Interview <BsArrowRight />
              </button>
              
              <button 
                onClick={handleHistory}
                className='flex items-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm'
              >
                <BsClock size={18} />
                View History
              </button>
            </motion.div>

            {/* Small Features Grid */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className='grid grid-cols-2 sm:grid-cols-4 gap-4'
            >
              {[
                { icon: <BsRobot />, title: 'AI Interviewer', desc: 'Smart & Adaptive' },
                { icon: <BsFileEarmarkText />, title: 'Real-time Feedback', desc: 'Instant Evaluation' },
                { icon: <BsPersonBadge />, title: 'Personalized', desc: 'For Your Role' },
                { icon: <HiOutlineChartSquareBar />, title: 'Detailed Reports', desc: 'Track & Improve' },
              ].map((f, i) => (
                <div key={i} className='flex items-start gap-3'>
                  <div className='w-8 h-8 shrink-0 rounded-lg bg-green-50/80 border border-green-100 text-green-500 flex items-center justify-center text-sm'>
                    {f.icon}
                  </div>
                  <div>
                    <h4 className='text-xs font-bold text-gray-900 whitespace-nowrap'>{f.title}</h4>
                    <p className='text-[10px] text-gray-500 mt-0.5 whitespace-nowrap'>{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Floating UI Graphics Composition */}
          <div className='relative h-[600px] w-full hidden md:block select-none z-10'>
            
            {/* Background pattern */}
            <div className="absolute inset-0 right-[-10%] bottom-[10%] opacity-20" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Graphic 1: AI Avatar Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[10%] top-[25%] bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-[220px] z-20 flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full p-1 mb-4">
                <img src="/ai_avatar.jpg" alt="Avatar" className="w-full h-full rounded-full object-cover object-top" onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=AI&background=10b981&color=fff" }} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">AI Interviewer</h3>
              <p className="text-green-500 text-xs font-medium mt-1 mb-4 flex items-center gap-1">Listening...</p>
              <div className="flex items-center gap-1 h-6">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <motion.div key={i} animate={{ height: ['4px', Math.random()*16 + 8 + 'px', '4px'] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.1 }} className="w-1 bg-green-400 rounded-full" />
                ))}
              </div>
            </motion.div>

            {/* Graphic 2: Great Answer Notification */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.7 }}
              animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute left-[25%] top-[10%] bg-white rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 flex items-start gap-3 z-30"
            >
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><FaCheckCircle size={14}/></div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Great answer!</h4>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[120px] leading-tight">Your response shows <span className="text-green-600 font-semibold">strong problem solving.</span></p>
              </div>
            </motion.div>

            {/* Graphic 3: Performance Score */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
              animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[30%] bottom-[20%] bg-white rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4 z-30 min-w-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><HiOutlineChartSquareBar size={20}/></div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Performance Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-green-500 leading-none mt-1">85%</span>
                  <span className="text-[10px] text-gray-400 font-medium mb-0.5 flex items-center">↑ 12%</span>
                </div>
                <p className="text-[10px] font-bold text-gray-800 mt-1">Excellent</p>
              </div>
            </motion.div>

            {/* Graphic 4: Dashboard Overview */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
              animate={{ y: [0, -5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute right-[-5%] top-[15%] bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 w-[420px] z-10"
            >
              <h3 className="text-xs font-bold text-gray-900 mb-4">Dashboard Overview</h3>
              
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { val: '24', lbl: 'Total Interviews', c: 'green' },
                  { val: '16', lbl: 'Completed', c: 'purple' },
                  { val: '78%', lbl: 'Avg. Score', c: 'orange' },
                  { val: '8h 45m', lbl: 'Total Time', c: 'blue' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-bold text-gray-900 mb-1">{s.val}</p>
                    <p className="text-[8px] text-gray-400 font-medium whitespace-nowrap overflow-hidden">{s.lbl}</p>
                    {/* Dummy line chart */}
                    <svg className="w-full h-4 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path d="M0,15 Q20,5 40,15 T80,5 T100,10" fill="none" stroke={`var(--color-${s.c}-400, #9ca3af)`} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                    </svg>
                  </div>
                ))}
              </div>

              <h3 className="text-[10px] font-bold text-gray-500 mb-3">Recent Interviews</h3>
              <div className="space-y-3">
                {[
                  { role: 'Frontend Developer', type: 'Technical Interview', score: '85%', date: 'May 18, 2025', c: 'text-green-600 bg-green-50' },
                  { role: 'Backend Developer', type: 'Technical Interview', score: '72%', date: 'May 17, 2025', c: 'text-orange-600 bg-orange-50' },
                  { role: 'Product Manager', type: 'Behavioral Interview', score: '80%', date: 'May 16, 2025', c: 'text-green-600 bg-green-50' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0"><BsPersonBadge size={14}/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{r.role}</p>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5">{r.type}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.c}`}>{r.score}</div>
                    <p className="text-[9px] text-gray-400 whitespace-nowrap">{r.date}</p>
                    <div className="px-2 py-0.5 rounded-full border border-green-200 text-green-600 text-[8px] font-semibold">Completed</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-5 py-2 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50">View All</button>
            </motion.div>
          </div>
        </div>

        {/* ── PROCESS SECTION ────────────────────────────────────────────── */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            
            {/* Arrow connectors (hidden on mobile) */}
            <div className="hidden md:block absolute top-1/2 left-[30%] w-[10%] border-t-2 border-dashed border-gray-200"></div>
            <div className="hidden md:block absolute top-1/2 left-[65%] w-[10%] border-t-2 border-dashed border-gray-200"></div>

            {[
              {
                icon: <BsFileEarmarkText size={28} />,
                step: "STEP 1",
                title: "Upload Your Resume",
                desc: "Upload your PDF resume — AI extracts key information."
              },
              {
                icon: <BsRobot size={28} />,
                step: "STEP 2",
                title: "AI-Powered Interview",
                desc: "5 personalized questions with live evaluation, follow-ups, and more."
              },
              {
                icon: <BsBarChart size={28} />,
                step: "STEP 3",
                title: "Detailed Report",
                desc: "Get hiring recommendation, skill analysis, and performance insights."
              }
            ].map((item, index) => (
              <motion.div key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow flex items-start gap-6 w-full md:w-[31%]"
              >
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-green-50/80 text-green-500 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-500 tracking-wider mb-1">{item.step}</p>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── TRUST FOOTER ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-full border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-10 py-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {[
              { icon: <BsShieldCheck size={22}/>, c: 'text-green-500 bg-green-50/80', t: 'Trusted by 10K+ Users', d: 'Across students & professionals' },
              { icon: <BsStarFill size={22}/>, c: 'text-yellow-500 bg-yellow-50/80', t: '4.9/5 Average Rating', d: 'From thousands of reviews' },
              { icon: <BsLock size={22}/>, c: 'text-blue-500 bg-blue-50/80', t: 'Secure & Private', d: 'Your data is always protected' },
              { icon: <BsLightningCharge size={22}/>, c: 'text-purple-500 bg-purple-50/80', t: 'Built for Real Results', d: 'Improve skills. Get hired.' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.c}`}>
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">{f.t}</p>
                  <p className="text-xs text-gray-500">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Auth Modal */}
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default Home
