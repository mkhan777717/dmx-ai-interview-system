import React, { useState } from 'react'
import { BsStars } from 'react-icons/bs'
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
      if (userData.token) {
        localStorage.setItem('token', userData.token)
      }
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
    <div
      className={`w-full font-body transition-colors duration-200 ${
        isModel
          ? 'py-2'
          : 'min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden dark-canvas'
      }`}
      style={{
        backgroundColor: isModel ? 'transparent' : 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background Ambient Mesh (Page mode only) */}
      {!isModel && (
        <>
          <div className="ambient-blob bg-[var(--accent)]/15 w-[600px] h-[600px] -top-32 left-1/2 -translate-x-1/2" />
          <div className="ambient-blob bg-[var(--toggle-knob)]/12 w-[450px] h-[450px] bottom-10 right-10" />

          {/* Top Return Navigation */}
          <div className="w-full max-w-md mb-6 relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold transition hover:text-[var(--accent)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <HiArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Live AI System</span>
            </div>
          </div>
        </>
      )}

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: isModel ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`w-full max-w-md relative z-10 rounded-3xl border shadow-2xl ${
          isModel ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
        }`}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand Logo & Pill */}
        <div className="flex flex-col items-center text-center mb-6">
          <Badge variant="accent" icon={BsStars} className="mb-4">
            AI-Powered Interview Studio
          </Badge>

          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-11 h-11 border rounded-2xl flex items-center justify-center p-1.5 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border)',
              }}
            >
              <img
                src="/logo.png"
                alt="InterviewIQ Logo"
                className="w-full h-full object-contain aspect-square"
              />
            </div>
            <h2 className="font-bold text-2xl tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
              InterviewIQ<span className="text-[var(--accent)]">.AI</span>
            </h2>
          </div>

          <h1 className="text-xl font-bold mt-2 font-display" style={{ color: 'var(--text-primary)' }}>
            Welcome to Career Studio 👋
          </h1>
          <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Access personalized AI mock interviews, real-time avatar feedback, and scoring analytics.
          </p>
        </div>

        {/* Google Sign-in Action */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 border font-semibold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-page)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
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
            <span className="text-rose-500 mt-0.5 shrink-0">⚠️</span>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Features Value Pillars */}
        <div className="mt-7 pt-6 border-t grid grid-cols-3 gap-2 text-center" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🎙️</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Live Avatars</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Real-Time Voice</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x px-1" style={{ borderColor: 'var(--border)' }}>
            <span className="text-base">⚡</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Fast Scoring</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Local NLP Model</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">📊</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Skill Matrices</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Percentile Rank</span>
          </div>
        </div>

        {/* Trust Metric & Legal */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
            <span className="text-amber-500">★★★★★</span>
            <span style={{ color: 'var(--text-primary)' }}>4.9/5</span>
            <span className="font-normal">· Trusted by 10,000+ candidates</span>
          </div>

          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            By continuing, you agree to our{' '}
            <a href="#" className="underline font-medium hover:text-[var(--accent)]" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="underline font-medium hover:text-[var(--accent)]" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
