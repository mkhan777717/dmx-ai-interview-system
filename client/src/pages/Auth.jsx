import React, { useState } from 'react'
import { BsRobot, BsStars, BsCheckCircleFill, BsShieldCheck } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import { motion } from 'motion/react'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../utils/firebase'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate, Link } from 'react-router-dom'
import { getDefaultRoute } from '../permissions'
import { HiArrowLeft } from 'react-icons/hi2'

function Auth({ isModel = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleAuth = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await signInWithPopup(auth, provider)
      const { displayName: name, email } = response.user

      const result = await axios.post(
        ServerUrl + '/api/auth/google',
        { name, email },
        { withCredentials: true }
      )

      const userData = result.data
      dispatch(setUserData(userData))

      // Redirect to the role-appropriate dashboard
      if (!isModel) {
        navigate(getDefaultRoute(userData.role), { replace: true })
      }
    } catch (error) {
      console.error('Auth error:', error.code, error.message)
      setError(error.code || error.message || 'Sign in failed')
      dispatch(setUserData(null))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full font-['Inter',sans-serif] ${isModel ? 'py-2' : 'min-h-screen bg-[#FFFFFF] text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden'}`}>
      
      {/* Background Ambient Mesh & Glow Effects (Page mode only) */}
      {!isModel && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-emerald-100/75 via-teal-50/50 to-transparent rounded-full blur-3xl opacity-90" />
            <div className="absolute top-[15%] left-[10%] w-[380px] h-[380px] bg-emerald-100/60 rounded-full blur-3xl" />
            <div className="absolute top-[18%] right-[10%] w-[380px] h-[380px] bg-teal-100/50 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-35" />
          </div>

          {/* Top Return Navigation */}
          <div className="w-full max-w-md mb-6 relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
            >
              <HiArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-500">Live AI System</span>
            </div>
          </div>
        </>
      )}

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: isModel ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`w-full max-w-md relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-emerald-950/5 ${
          isModel ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
        }`}
      >
        {/* Brand Logo & Pill */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 mb-4 shadow-2xs">
            <BsStars className="text-emerald-600" /> AI-Powered Interview System
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/25">
              <BsRobot size={20} />
            </div>
            <h2 className="font-extrabold text-2xl tracking-tight text-slate-900">
              InterviewIQ<span className="text-emerald-600">.AI</span>
            </h2>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mt-2">
            Welcome to your career prep 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Access personalized AI mock interviews, real-time avatar feedback, and scoring analytics.
          </p>
        </div>

        {/* Google Sign-in Action */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-emerald-400 text-slate-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <FcGoogle size={22} className="group-hover:scale-110 transition-transform duration-200 shrink-0" />
            )}
            <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5">
            <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
            <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Features Value Pillars */}
        <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🎙️</span>
            <span className="text-[11px] font-bold text-slate-700">Real-Time Avatar</span>
            <span className="text-[9px] text-slate-400">Live Voice / Video</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-slate-100 px-1">
            <span className="text-base">⚡</span>
            <span className="text-[11px] font-bold text-slate-700">Instant Scoring</span>
            <span className="text-[9px] text-slate-400">Local NLP Model</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">📊</span>
            <span className="text-[11px] font-bold text-slate-700">Skill Reports</span>
            <span className="text-[9px] text-slate-400">Strengths & Insights</span>
          </div>
        </div>

        {/* Trust Metric & Legal */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600">
            <span className="text-amber-500">★★★★★</span>
            <span>4.9/5</span>
            <span className="text-slate-400 font-normal">· Trusted by 10,000+ candidates</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-slate-600 hover:text-emerald-700 underline font-medium">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-slate-600 hover:text-emerald-700 underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
