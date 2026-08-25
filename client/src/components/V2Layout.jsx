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
    className={`flex items-center gap-3 px-3.5 py-2.5 mb-1 rounded-2xl cursor-pointer transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 font-bold border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <Icon className={`text-base shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
    <span className="text-sm font-medium tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />}
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
    <div className="min-h-screen bg-[#050811] text-[#f8fafc] flex relative overflow-hidden dark-canvas">
      {/* Background ambient blobs */}
      <div className="ambient-blob bg-cyan-500/10 w-[550px] h-[550px] -top-32 -left-32" />
      <div className="ambient-blob bg-indigo-500/10 w-[500px] h-[500px] bottom-10 right-10" />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-68 bg-slate-950/70 backdrop-blur-2xl border-r border-white/8 flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 z-20">

        {/* Logo */}
        <div className="px-5 py-4.5 flex items-center gap-2.5 cursor-pointer border-b border-white/8" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center p-1 shadow-md shadow-cyan-500/20">
            <img
              src="/logo.png"
              alt="InterviewIQ Logo"
              className="w-full h-full object-contain aspect-square"
            />
          </div>
          <h1 className="text-lg font-extrabold text-white tracking-tight font-['Outfit'] flex items-center gap-1">
            Interview<span className="font-calligraphy italic font-normal text-cyan-400">IQ</span>
            <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">AI</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex-1 space-y-0.5 custom-scrollbar">

          {/* Section: Main */}
          <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 font-mono">Main Menu</p>
          <NavItem onClick={() => navigate('/dashboard')} icon={FaThLarge} label="Overview" active={location.pathname === '/dashboard'} />
          <NavItem onClick={() => navigate('/v2/interview')} icon={FaMicrophoneAlt} label="Start Interview" active={location.pathname === '/v2/interview' || location.pathname === '/interview'} />
          <NavItem onClick={() => navigate('/history')} icon={FaHistory} label="My Reports" active={location.pathname === '/history' || location.pathname.startsWith('/report')} />
          <NavItem onClick={() => navigate('/analytics')} icon={FaChartBar} label="Analytics" active={location.pathname === '/analytics'} />

          {/* Section: Recruiter */}
          {hasPermission(userRole, 'nav.recruiterDashboard') && (
            <>
              <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-5 mb-2 font-mono">Recruiter</p>
              <NavItem onClick={() => navigate('/recruiter')} icon={FaUsersCog} label="Recruiter Hub" active={location.pathname === '/recruiter'} />
              <NavItem onClick={() => navigate('/admin')} icon={FaShieldAlt} label="Candidate Pipeline" active={location.pathname === '/admin'} />
            </>
          )}

          {/* Section: Super Admin */}
          {hasPermission(userRole, 'nav.superAdminDashboard') && (
            <>
              <p className="px-3 text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mt-5 mb-2 font-mono">Super Admin</p>
              <NavItem onClick={() => navigate('/superadmin')} icon={FaCrown} label="Platform Control" active={location.pathname === '/superadmin'} />
            </>
          )}
        </nav>

        {/* Bottom — User Profile */}
        <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-2.5">

          {/* Plan badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/10 via-indigo-500/5 to-transparent border border-cyan-500/20 rounded-2xl">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <BsStars size={11} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-cyan-200">Pro Tier</p>
              <p className="text-[9px] text-slate-400 font-medium">Enterprise Engine</p>
            </div>
            <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-cyan-300 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-cyan-500/30 transition cursor-pointer shadow-2xs">
              Upgrade
            </button>
          </div>

          {/* User card */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 glass-card-static rounded-2xl border-white/5">
            <img
              src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=06b6d4&color=050811&size=64`}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate font-['Outfit']">{userData?.name || 'User'}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
            <button onClick={() => navigate('/dashboard')} title="Account Settings" className="text-slate-400 hover:text-cyan-400 p-1 transition cursor-pointer shrink-0">
              <FaEdit size={11} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10">

        {/* Header */}
        <header className="h-16 bg-slate-950/60 backdrop-blur-xl border-b border-white/8 px-8 flex items-center justify-between shrink-0">

          {headerLeft ? headerLeft : (
            <div>
              <div className="flex items-center gap-2 font-bold text-white text-lg leading-tight font-['Outfit']">
                <BsStars className="text-cyan-400 shrink-0" />
                <h1>{title}</h1>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>
            </div>
          )}

          {headerRight ? headerRight : (
            <div className="flex items-center gap-3" ref={menuRef}>

              {/* Progress (interview pages) */}
              {progressText && (
                <div className="flex items-center gap-3.5 border-r border-white/10 pr-4 mr-1">
                  <div className="w-40">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-cyan-400">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-xs" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{progressText}</span>
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass-pill hover:border-cyan-500/30 text-slate-300 transition cursor-pointer relative"
                >
                  <FaBell size={14} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full ring-2 ring-slate-950 shadow-xs shadow-cyan-400" />
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-[55]"
                        onClick={() => setShowNotifications(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-2 w-68 glass-panel rounded-2xl shadow-2xl p-4 z-[60] border border-white/10 bg-slate-950/95"
                      >
                        <h3 className="font-bold text-white text-sm mb-2 font-['Outfit']">System Notifications</h3>
                        <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-xs text-slate-400">All services connected & operational</p>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar / Profile Menu */}
              <div className="relative">
                <div
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false) }}
                  className="w-9 h-9 rounded-full overflow-hidden cursor-pointer ring-2 ring-cyan-500/40 hover:ring-cyan-400 transition shadow-xs"
                >
                  <img
                    src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=06b6d4&color=050811&size=64`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      {/* Backdrop — closes menu when clicking outside */}
                      <div
                        className="fixed inset-0 z-[55]"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl shadow-2xl p-2 z-[60] border border-white/10 bg-slate-950/95"
                      >
                        <div className="px-3 py-2.5 mb-1 border-b border-white/8">
                          <p className="font-bold text-white text-sm">{userData?.name || 'User'}</p>
                          <p className="text-xs text-slate-400 truncate">{userData?.email}</p>
                          <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border mt-1 ${getRoleBadgeColor(userRole)}`}>
                            {getRoleLabel(userRole)}
                          </span>
                        </div>
                        <button
                          onClick={() => { setShowProfileMenu(false); navigate('/dashboard') }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl flex items-center gap-2 transition cursor-pointer"
                        >
                          <FaCog className="text-slate-500" size={13} /> Dashboard
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition cursor-pointer mt-0.5"
                        >
                          <FaSignOutAlt size={13} /> Log out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
