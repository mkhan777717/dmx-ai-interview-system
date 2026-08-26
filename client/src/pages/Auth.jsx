import React, { useState } from 'react'
import { motion } from 'motion/react'
import { FcGoogle } from 'react-icons/fc'
import { HiOutlineMail, HiArrowLeft } from 'react-icons/hi'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider, isKeyValid } from '../utils/firebase'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate, Link } from 'react-router-dom'
import { getDefaultRoute } from '../permissions'
import BrandLogo from '../components/ui/BrandLogo'

function Auth({ isModel = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const processLogin = async (userName, userEmail) => {
    try {
      setError(null)
      setLoading(true)

      const result = await axios.post(
        ServerUrl + '/api/auth/google',
        { name: userName, email: userEmail },
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
    } catch (err) {
      console.error('Auth error:', err)
      const detail = err.response?.data?.detail || err.message || 'Authentication failed'
      setError(detail)
      dispatch(setUserData(null))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!isKeyValid) {
      setError('Google Sign-in is not configured. Please use Email / Demo sign in below.')
      return
    }
    try {
      setError(null)
      setLoading(true)
      const response = await signInWithPopup(auth, provider)
      const { displayName: gName, email: gEmail } = response.user
      await processLogin(gName || 'Candidate', gEmail)
    } catch (err) {
      console.error('Firebase Auth error:', err.code, err.message)
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/popup-blocked') {
        setError('Google popup domain not whitelisted. Please use Quick Demo or Email Sign-in below.')
      } else {
        setError(err.code || err.message || 'Google sign in failed')
      }
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    const derivedName = name.trim() || email.split('@')[0]
    await processLogin(derivedName, email.trim())
  }

  const handleQuickDemo = async (role = 'USER') => {
    const demoEmail = role === 'RECRUITER' ? 'recruiter.demo@interviewiq.ai' : 'candidate.demo@interviewiq.ai'
    const demoName = role === 'RECRUITER' ? 'Recruiter Demo' : 'Candidate Demo'
    await processLogin(demoName, demoEmail)
  }

  return (
    <div
      className={`w-full font-body transition-colors duration-150 ${
        isModel
          ? 'py-2'
          : 'min-h-screen flex flex-col justify-center items-center px-4 py-12 relative'
      }`}
      style={{
        backgroundColor: isModel ? 'transparent' : 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Return Navigation (Page mode only) */}
      {!isModel && (
        <div className="w-full max-w-md mb-6 relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold transition hover:text-[var(--accent)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <HiArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Live AI Studio</span>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: isModel ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`w-full max-w-md relative z-10 rounded-3xl border shadow-sm ${
          isModel ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
        }`}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <BrandLogo size="lg" />
          </div>

          <h1 className="text-xl font-extrabold mt-2 font-display" style={{ color: 'var(--text-primary)' }}>
            Welcome to Career Studio
          </h1>
          <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Access personalized AI mock interviews, real-time avatar feedback, and scoring diagnostics.
          </p>
        </div>

        {/* Primary Google Sign-in Action */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 border font-semibold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group hover:border-[var(--accent)]"
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
              <FcGoogle size={20} className="group-hover:scale-105 transition-transform duration-200 shrink-0" />
            )}
            <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>

          {/* Email Login Alternative */}
          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3 px-4 border font-medium text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer hover:bg-[var(--bg-page)]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <HiOutlineMail size={16} />
              <span>Sign in with Email</span>
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-2.5 pt-2">
              <input
                type="text"
                placeholder="Full Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--accent)] transition"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="email"
                required
                placeholder="Work or Personal Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--accent)] transition"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign In with Email →'}
              </button>
            </form>
          )}

          {/* Quick Demo Mode */}
          <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('USER')}
              disabled={loading}
              className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Demo Candidate
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('RECRUITER')}
              disabled={loading}
              className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Demo Recruiter
            </button>
          </div>
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
            <span className="text-sm">🎙️</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Live Avatars</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Real-Time Voice</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x px-1" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm">⚡</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Fast Scoring</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Local NLP Model</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">📊</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Skill Matrices</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Percentile Rank</span>
          </div>
        </div>

        {/* Trust Metric & Legal */}
        <div className="mt-6 text-center space-y-2">
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
