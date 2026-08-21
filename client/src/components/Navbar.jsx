import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import { BsStars } from 'react-icons/bs'
import { HiArrowUpRight } from 'react-icons/hi2'
import { HiOutlineLogout } from 'react-icons/hi'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'
import { getRoleLabel, getRoleBadgeColor, getDefaultRoute } from '../permissions'
import GradientButton from './ui/GradientButton'

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(setUserData(null))
      setShowUserPopup(false)
      navigate('/')
    } catch (error) {
      console.error(error)
    }
  }

  const userRole = userData?.role || 'USER'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`max-w-7xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'glass-panel border-white/10 shadow-2xl bg-slate-950/85'
            : 'bg-slate-950/50 backdrop-blur-md border border-white/5'
        }`}
      >
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <BsStars size={17} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 font-['Outfit']">
            InterviewIQ
            <span className="text-[10px] font-extrabold tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full uppercase shadow-xs">
              AI
            </span>
          </h1>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-300">
          <button
            onClick={() => navigate('/#features')}
            className="hover:text-cyan-400 transition-colors cursor-pointer py-1"
          >
            Platform
          </button>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSolutionsDropdown(!showSolutionsDropdown)}
              className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1 py-1 text-slate-300"
            >
              <span>Solutions</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {showSolutionsDropdown && (
              <div className="absolute top-full left-0 mt-2.5 w-64 glass-panel rounded-2xl shadow-2xl p-2 z-50 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    setShowSolutionsDropdown(false)
                    navigate('/v2/interview')
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-300 rounded-xl transition cursor-pointer flex items-center gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400"></span>
                  Candidate Practice Room
                </button>
                <button
                  onClick={() => {
                    setShowSolutionsDropdown(false)
                    navigate('/recruiter')
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-indigo-500/15 hover:text-indigo-300 rounded-xl transition cursor-pointer flex items-center gap-2.5 mt-0.5"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400"></span>
                  Recruiter Screening Hub
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/#stages')}
            className="hover:text-cyan-400 transition-colors cursor-pointer py-1"
          >
            How It Works
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="hover:text-cyan-400 transition-colors cursor-pointer py-1"
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/#faq')}
            className="hover:text-cyan-400 transition-colors cursor-pointer py-1"
          >
            FAQ
          </button>
        </nav>

        {/* Right: Actions / Auth */}
        <div className="flex items-center gap-3">
          {userData ? (
            <div className="relative">
              <button
                onClick={() => setShowUserPopup(!showUserPopup)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-pill hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              >
                <img
                  src={
                    userData?.profile_picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData?.name || 'User'
                    )}&background=06b6d4&color=050811&size=64`
                  }
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-cyan-500/30"
                />
                <span className="text-sm font-semibold text-slate-200 max-w-[110px] truncate">
                  {userData.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleBadgeColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </span>
              </button>

              <AnimatePresence>
                {showUserPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2.5 w-60 glass-panel rounded-2xl shadow-2xl p-2 z-50 border border-white/10"
                  >
                    <div className="px-3.5 py-2.5 border-b border-white/8 mb-1">
                      <p className="font-bold text-sm text-white">{userData.name}</p>
                      <p className="text-xs text-slate-400 truncate">{userData.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserPopup(false)
                        navigate(getDefaultRoute(userRole))
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl font-medium transition cursor-pointer"
                    >
                      My Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowUserPopup(false)
                        navigate('/history')
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl font-medium transition cursor-pointer"
                    >
                      Interview Reports
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium flex items-center gap-2 transition cursor-pointer mt-1"
                    >
                      <HiOutlineLogout size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
              >
                Log In
              </button>
              <GradientButton
                onClick={() => setShowAuth(true)}
                size="sm"
                iconRight={HiArrowUpRight}
              >
                Launch Studio
              </GradientButton>
            </div>
          )}
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </header>
  )
}

export default Navbar
