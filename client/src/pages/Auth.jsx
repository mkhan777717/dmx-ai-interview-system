import React, { useState } from 'react'
import { BsRobot, BsStars, BsShieldCheck } from 'react-icons/bs'
import { motion } from 'motion/react'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider, isKeyValid } from '../utils/firebase'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate, Link } from 'react-router-dom'
import { getDefaultRoute } from '../permissions'
import { HiArrowLeft } from 'react-icons/hi2'
import Badge from '../components/ui/Badge'

function Auth({ isModel = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleAuth = async () => {
    if (!isKeyValid) {
      setError('Google Sign-in is not configured. Please set VITE_FIREBASE_APIKEY in Vercel environment variables.')
      return
    }
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
    <div className={`w-full font-['Plus_Jakarta_Sans',sans-serif] ${isModel ? 'py-2' : 'min-h-screen bg-[#050811] text-[#f8fafc] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden dark-canvas'}`}>
      
      {/* Background Ambient Mesh (Page mode only) */}
      {!isModel && (
        <>
          <div className="ambient-blob bg-cyan-500/15 w-[600px] h-[600px] -top-32 left-1/2 -translate-x-1/2" />
          <div className="ambient-blob bg-indigo-500/12 w-[450px] h-[450px] bottom-10 right-10" />

          {/* Top Return Navigation */}
          <div className="w-full max-w-md mb-6 relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400 transition"
            >
              <HiArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-400">Live AI System</span>
            </div>
          </div>
        </>
      )}

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: isModel ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`w-full max-w-md relative z-10 rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl ${
          isModel ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
        }`}
      >
        {/* Brand Logo & Pill */}
        <div className="flex flex-col items-center text-center mb-6">
          <Badge variant="cyan" icon={BsStars} className="mb-4">
            AI-Powered Interview Studio
          </Badge>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-11 h-11 bg-slate-900/90 border border-cyan-500/30 text-white rounded-2xl flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20">
              <img
                src="/logo.png"
                alt="InterviewIQ Logo"
                className="w-full h-full object-contain aspect-square"
              />
            </div>
            <h2 className="font-extrabold text-2xl tracking-tight text-white font-['Outfit']">
              InterviewIQ<span className="text-cyan-400">.AI</span>
            </h2>
          </div>

          <h1 className="text-xl font-bold text-white mt-2 font-['Outfit']">
            Welcome to Career Studio 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Access personalized AI mock interviews, real-time avatar feedback, and scoring analytics.
          </p>
        </div>

        {/* Google Sign-in Action */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15 hover:border-cyan-500/40 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
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
          <div className="mt-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5">
            <span className="text-rose-400 mt-0.5 shrink-0">⚠️</span>
            <p className="text-xs font-semibold text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Features Value Pillars */}
        <div className="mt-7 pt-6 border-t border-white/8 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🎙️</span>
            <span className="text-[11px] font-bold text-slate-300">Live Avatars</span>
            <span className="text-[9px] text-slate-500">Real-Time Voice</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-white/8 px-1">
            <span className="text-base">⚡</span>
            <span className="text-[11px] font-bold text-slate-300">Fast Scoring</span>
            <span className="text-[9px] text-slate-500">Local NLP Model</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">📊</span>
            <span className="text-[11px] font-bold text-slate-300">Skill Matrices</span>
            <span className="text-[9px] text-slate-500">Percentile Rank</span>
          </div>
        </div>

        {/* Trust Metric & Legal */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className="text-amber-400">★★★★★</span>
            <span className="text-white">4.9/5</span>
            <span className="text-slate-500 font-normal">· Trusted by 10,000+ candidates</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-slate-400 hover:text-cyan-400 underline font-medium">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-slate-400 hover:text-cyan-400 underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
