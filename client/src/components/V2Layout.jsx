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
    className={`flex items-center gap-3 px-3.5 py-2.5 mb-1 rounded-xl cursor-pointer transition-all duration-200 ${
      active
        ? 'bg-emerald-500/15 text-teal-900 font-bold border border-emerald-500/30 shadow-xs'
        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
    }`}
  >
    <Icon className={`text-base shrink-0 transition-colors ${active ? 'text-teal-700' : 'text-slate-400'}`} />
    <span className="text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />}
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative overflow-hidden mesh-gradient-canvas">
      {/* Background ambient orbs */}
      <div className="ambient-glow bg-emerald-400/20 w-96 h-96 -top-20 -left-20" />
      <div className="ambient-glow bg-indigo-400/15 w-96 h-96 bottom-10 right-10" />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-68 glass-panel-subtle border-r border-slate-200/70 flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 z-20">

        {/* Logo */}
        <div className="px-5 py-4.5 flex items-center gap-2.5 cursor-pointer border-b border-slate-200/60" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-800 to-teal-950 flex items-center justify-center text-emerald-300 shadow-md shadow-teal-950/20">
            <BsStars size={15} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight font-['Outfit'] flex items-center gap-1">
            InterviewIQ <span className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase">AI</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex-1 space-y-0.5 custom-scrollbar">

          {/* Section: Main */}
          <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
          <NavItem onClick={() => navigate('/dashboard')} icon={FaThLarge} label="Overview" active={location.pathname === '/dashboard'} />
          <NavItem onClick={() => navigate('/v2/interview')} icon={FaMicrophoneAlt} label="Start Interview" active={location.pathname === '/v2/interview' || location.pathname === '/interview'} />
          <NavItem onClick={() => navigate('/history')} icon={FaHistory} label="My Reports" active={location.pathname === '/history' || location.pathname.startsWith('/report')} />
          <NavItem onClick={() => navigate('/analytics')} icon={FaChartBar} label="Analytics" active={location.pathname === '/analytics'} />

          {/* Section: Recruiter */}
          {hasPermission(userRole, 'nav.recruiterDashboard') && (
            <>
              <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-5 mb-2">Recruiter</p>
              <NavItem onClick={() => navigate('/recruiter')} icon={FaUsersCog} label="Recruiter Hub" active={location.pathname === '/recruiter'} />
              <NavItem onClick={() => navigate('/admin')} icon={FaShieldAlt} label="Candidate Pipeline" active={location.pathname === '/admin'} />
            </>
          )}

          {/* Section: Super Admin */}
          {hasPermission(userRole, 'nav.superAdminDashboard') && (
            <>
              <p className="px-3 text-[10px] font-extrabold text-purple-600 uppercase tracking-wider mt-5 mb-2">Super Admin</p>
              <NavItem onClick={() => navigate('/superadmin')} icon={FaCrown} label="Platform Control" active={location.pathname === '/superadmin'} />
            </>
          )}
        </nav>

        {/* Bottom — User Profile */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-200/60 space-y-2.5">

          {/* Plan badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-teal-800 flex items-center justify-center shrink-0">
              <BsStars size={11} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-teal-900">Pro Tier</p>
              <p className="text-[9px] text-teal-700 font-medium">Enterprise Engine</p>
            </div>
            <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-teal-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-emerald-500/20 transition cursor-pointer shadow-2xs">
              Upgrade
            </button>
          </div>

          {/* User card */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 glass-card-static rounded-xl">
            <img
              src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=0f766e&color=ffffff&size=64`}
              alt="User"
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{userData?.name || 'User'}</p>
              <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded-full border leading-tight ${getRoleBadgeColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
            <button onClick={() => navigate('/dashboard')} title="Account Settings" className="text-slate-400 hover:text-teal-800 p-1 transition cursor-pointer shrink-0">
              <FaEdit size={11} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10">

        {/* Header */}
        <header className="h-16 glass-panel-subtle border-b border-slate-200/70 px-8 flex items-center justify-between shrink-0">

          {headerLeft ? headerLeft : (
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg leading-tight font-['Outfit']">
                <BsStars className="text-emerald-500 shrink-0" />
                <h1>{title}</h1>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
            </div>
          )}

          {headerRight ? headerRight : (
            <div className="flex items-center gap-3" ref={menuRef}>

              {/* Progress (interview pages) */}
              {progressText && (
                <div className="flex items-center gap-3.5 border-r border-slate-200/80 pr-4 mr-1">
                  <div className="w-40">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-teal-700">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-500 shadow-xs" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60">{progressText}</span>
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass-pill hover:border-slate-300 text-slate-600 transition cursor-pointer relative"
                >
                  <FaBell size={14} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-11 w-68 glass-panel rounded-2xl shadow-xl p-4 z-50 border border-white/80"
                    >
                      <h3 className="font-bold text-slate-900 text-sm mb-2 font-['Outfit']">System Notifications</h3>
                      <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                        <p className="text-xs text-slate-500">All services connected & operational</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar / Profile Menu */}
              <div className="relative">
                <div
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false) }}
                  className="w-9 h-9 rounded-full overflow-hidden cursor-pointer ring-2 ring-emerald-500/30 hover:ring-emerald-500 transition shadow-xs"
                >
                  <img
                    src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=0f766e&color=ffffff&size=64`}
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
                      className="absolute right-0 top-11 w-56 glass-panel rounded-2xl shadow-xl p-2 z-50 border border-white/80"
                    >
                      <div className="px-3 py-2.5 mb-1 border-b border-slate-200/60">
                        <p className="font-bold text-slate-900 text-sm">{userData?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
                        <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border mt-1 ${getRoleBadgeColor(userRole)}`}>
                          {getRoleLabel(userRole)}
                        </span>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/dashboard') }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 rounded-xl flex items-center gap-2 transition cursor-pointer"
                      >
                        <FaCog className="text-slate-400" size={13} /> Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 rounded-xl flex items-center gap-2 transition cursor-pointer mt-0.5"
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
