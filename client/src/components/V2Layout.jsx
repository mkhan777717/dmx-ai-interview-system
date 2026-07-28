import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import {
  FaMicrophoneAlt, FaHistory, FaEdit,
  FaBell, FaChartBar, FaThLarge, FaSignOutAlt, FaShieldAlt,
  FaUsersCog, FaCrown, FaCog,
} from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { setUserData } from '../redux/userSlice'
import { hasPermission, getRoleLabel, getRoleBadgeColor } from '../permissions'
import { ServerUrl } from '../App'

// ── Nav Item ──────────────────────────────────────────────────────────────────
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 mb-0.5 rounded-xl cursor-pointer transition-all ${
      active
        ? 'bg-green-50 text-green-700 font-semibold border border-green-100'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className={`text-lg shrink-0 ${active ? 'text-green-600' : 'text-gray-400'}`} />
    <span className="text-sm font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
  </div>
)

export default function V2Layout({
  children,
  title = 'AI Smart Interview',
  subtitle = 'Your AI interviewer is here to help you succeed',
  progressText = '',
  progressPercent = 0,
  headerLeft,
  headerRight,
}) {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(setUserData(null))
      navigate('/auth')
    } catch {
      navigate('/auth')
    }
  }

  const userRole = userData?.role || 'USER'

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900 flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto shadow-sm shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 cursor-pointer border-b border-gray-100" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
            <BsStars size={14} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            InterviewIQ <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold align-middle ml-0.5">AI</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex-1 space-y-0.5">

          {/* Section: Main */}
          <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Main</p>
          <NavItem onClick={() => navigate('/dashboard')} icon={FaThLarge} label="Overview" active={location.pathname === '/dashboard'} />
          <NavItem onClick={() => navigate('/v2/interview')} icon={FaMicrophoneAlt} label="Start Interview" active={location.pathname === '/v2/interview' || location.pathname === '/interview'} />
          <NavItem onClick={() => navigate('/history')} icon={FaHistory} label="My Reports" active={location.pathname === '/history' || location.pathname.startsWith('/report')} />
          <NavItem onClick={() => navigate('/analytics')} icon={FaChartBar} label="Analytics" active={location.pathname === '/analytics'} />

          {/* Section: Recruiter */}
          {hasPermission(userRole, 'nav.recruiterDashboard') && (
            <>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-5 mb-2">Recruiter</p>
              <NavItem onClick={() => navigate('/recruiter')} icon={FaUsersCog} label="Recruiter Hub" active={location.pathname === '/recruiter'} />
              <NavItem onClick={() => navigate('/admin')} icon={FaShieldAlt} label="Candidate Pipeline" active={location.pathname === '/admin'} />
            </>
          )}

          {/* Section: Super Admin */}
          {hasPermission(userRole, 'nav.superAdminDashboard') && (
            <>
              <p className="px-3 text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-5 mb-2">Super Admin</p>
              <NavItem onClick={() => navigate('/superadmin')} icon={FaCrown} label="Platform Control" active={location.pathname === '/superadmin'} />
            </>
          )}
        </nav>

        {/* Bottom — User Profile */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-3">

          {/* Plan badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <BsStars size={11} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-green-800">Pro Plan</p>
              <p className="text-[9px] text-green-600">Active</p>
            </div>
            <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded transition cursor-pointer">
              Upgrade
            </button>
          </div>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
            <img
              src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=e2e8f0&color=475569&size=64`}
              alt="User"
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userData?.name || 'User'}</p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border leading-tight ${getRoleBadgeColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
            <button onClick={() => alert('Profile editing coming soon!')} className="text-gray-400 hover:text-blue-500 p-1 transition cursor-pointer shrink-0">
              <FaEdit size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 shadow-sm">

          {headerLeft ? headerLeft : (
            <div>
              <div className="flex items-center gap-2 font-bold text-gray-900 text-xl leading-tight">
                <BsStars className="text-green-500 shrink-0" />
                <h1>{title}</h1>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
            </div>
          )}

          {headerRight ? headerRight : (
            <div className="flex items-center gap-3" ref={menuRef}>

              {/* Progress (interview pages) */}
              {progressText && (
                <div className="flex items-center gap-4 border-r border-gray-200 pr-4 mr-1">
                  <div className="w-44">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className="text-green-600 font-bold">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{progressText}</span>
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer relative"
                >
                  <FaBell size={16} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-11 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                    >
                      <h3 className="font-bold text-gray-900 text-sm mb-3">Notifications</h3>
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-400">No new notifications</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar / Profile Menu */}
              <div className="relative">
                <div
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false) }}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-green-300 transition shadow-sm"
                >
                  <img
                    src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=e2e8f0&color=475569&size=64`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50"
                    >
                      <div className="px-3 py-2.5 mb-1 border-b border-gray-100">
                        <p className="font-bold text-gray-900 text-sm">{userData?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 ${getRoleBadgeColor(userRole)}`}>
                          {getRoleLabel(userRole)}
                        </span>
                      </div>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition cursor-pointer">
                        <FaCog className="text-gray-400" size={13} /> Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition cursor-pointer mt-0.5"
                      >
                        <FaSignOutAlt size={13} /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
