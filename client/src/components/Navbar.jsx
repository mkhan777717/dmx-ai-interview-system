import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import { HiOutlineLogout } from 'react-icons/hi'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'
import { getRoleLabel, getRoleBadgeColor, getDefaultRoute } from '../permissions'
import ThemeToggle from './ui/ThemeToggle'
import BrandLogo from './ui/BrandLogo'

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const navRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setShowUserPopup(false)
        setShowSolutionsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setShowUserPopup(false)
    setShowSolutionsDropdown(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(setUserData(null))
      setShowUserPopup(false)
      navigate('/')
    } catch {
      dispatch(setUserData(null))
      navigate('/')
    }
  }

  const userRole = userData?.role || 'USER'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4 pb-2 transition-all duration-300 pointer-events-none">
      <motion.div
        ref={navRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-6xl mx-auto rounded-full px-6 py-3 flex items-center justify-between transition-all duration-200 pointer-events-auto border shadow-sm"
        style={{
          backgroundColor: 'var(--bg-nav)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <BrandLogo size="md" />
        </div>

        {/* Center: Clean Nav Links (Title Case, Medium font) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <button
            onClick={() => navigate('/#features')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer py-1"
          >
            Platform
          </button>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowSolutionsDropdown(!showSolutionsDropdown); setShowUserPopup(false) }}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1 py-1"
            >
              <span>Solutions</span>
              <span className="text-[10px] opacity-70">▾</span>
            </button>

            {showSolutionsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[55]"
                  onClick={() => setShowSolutionsDropdown(false)}
                />
                <div
                  className="absolute top-full left-0 mt-2 w-60 rounded-2xl shadow-xl p-2 z-[60] border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <button
                    onClick={() => {
                      setShowSolutionsDropdown(false)
                      navigate('/v2/interview')
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2.5 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    Candidate Practice Room
                  </button>
                  <button
                    onClick={() => {
                      setShowSolutionsDropdown(false)
                      navigate('/recruiter')
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2.5 mt-0.5 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Recruiter Screening Hub
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/#stages')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer py-1"
          >
            How It Works
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer py-1"
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/#faq')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer py-1"
          >
            FAQ
          </button>
        </nav>

        {/* Right: ThemeToggle + Actions / Auth */}
        <div className="flex items-center gap-3.5">
          {/* Universal Theme Switcher */}
          <ThemeToggle size="sm" />

          {userData ? (
            <div className="relative">
              <button
                onClick={() => { setShowUserPopup(!showUserPopup); setShowSolutionsDropdown(false) }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <img
                  src={
                    userData?.profile_picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData?.name || 'User'
                    )}&background=4e9c6e&color=ffffff&size=64`
                  }
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--accent)]/50"
                />
                <span className="text-xs font-semibold max-w-[100px] truncate">
                  {userData.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleBadgeColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </span>
              </button>

              <AnimatePresence>
                {showUserPopup && (
                  <>
                    <div
                      className="fixed inset-0 z-[55]"
                      onClick={() => setShowUserPopup(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-2xl p-2 z-[60] border"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="px-3.5 py-2.5 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{userData.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userData.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate(getDefaultRoute(userRole))
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl font-medium transition cursor-pointer hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/history')
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl font-medium transition cursor-pointer hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Interview Reports
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 rounded-xl font-medium flex items-center gap-2 transition cursor-pointer mt-1"
                      >
                        <HiOutlineLogout size={16} /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="btn-primary rounded-full px-5 py-2 text-xs font-semibold cursor-pointer shadow-sm"
            >
              Sign In →
            </button>
          )}
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </header>
  )
}

export default Navbar
