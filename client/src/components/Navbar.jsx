import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import { BsStars } from 'react-icons/bs'
import { HiArrowUpRight } from 'react-icons/hi2'
import { HiOutlineLogout } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'
import { getRoleLabel, getRoleBadgeColor, getDefaultRoute } from '../permissions'

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

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
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.04)] px-6 py-3 flex items-center justify-between"
      >
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-teal-900 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
            <BsStars size={16} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1">
            InterviewIQ
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
              AI
            </span>
          </h1>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
          <button
            onClick={() => navigate('/#features')}
            className="hover:text-teal-900 transition cursor-pointer"
          >
            Platform
          </button>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSolutionsDropdown(!showSolutionsDropdown)}
              className="hover:text-teal-900 transition cursor-pointer flex items-center gap-1"
            >
              <span>Solutions</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {showSolutionsDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50">
                <button
                  onClick={() => {
                    setShowSolutionsDropdown(false)
                    navigate('/v2/interview')
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition cursor-pointer"
                >
                  Candidate Self Practice
                </button>
                <button
                  onClick={() => {
                    setShowSolutionsDropdown(false)
                    navigate('/recruiter')
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition cursor-pointer"
                >
                  Recruiter Screening Pipeline
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/#stories')}
            className="hover:text-teal-900 transition cursor-pointer"
          >
            Success Stories
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="hover:text-teal-900 transition cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/#resources')}
            className="hover:text-teal-900 transition cursor-pointer"
          >
            Resources
          </button>
        </nav>

        {/* Right: Actions / Auth */}
        <div className="flex items-center gap-3">
          {userData ? (
            <div className="relative">
              <button
                onClick={() => setShowUserPopup(!showUserPopup)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50 transition cursor-pointer"
              >
                <img
                  src={
                    userData?.profile_picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData?.name || 'User'
                    )}&background=064e3b&color=10b981&size=64`
                  }
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-slate-900 max-w-[100px] truncate">
                  {userData.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </span>
              </button>

              <AnimatePresence>
                {showUserPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="font-bold text-sm text-slate-900">{userData.name}</p>
                      <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserPopup(false)
                        navigate(getDefaultRoute(userRole))
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition cursor-pointer"
                    >
                      My Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowUserPopup(false)
                        navigate('/history')
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition cursor-pointer"
                    >
                      Interview Reports
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium flex items-center gap-2 transition cursor-pointer mt-1"
                    >
                      <HiOutlineLogout size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm font-semibold text-gray-700 hover:text-slate-900 px-3 py-2 transition cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-sm transition-all shadow-md shadow-teal-900/10 cursor-pointer group"
              >
                <span>Request a Demo</span>
                <HiArrowUpRight className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </header>
  )
}

export default Navbar
