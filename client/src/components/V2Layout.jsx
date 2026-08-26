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
import ThemeToggle from './ui/ThemeToggle'
import BrandLogo from './ui/BrandLogo'

// ── Nav Item ──────────────────────────────────────────────────────────────────
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-3.5 py-2.5 mb-1 rounded-2xl cursor-pointer transition-all duration-200 border ${
      active
        ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold border-[var(--accent)]/30 shadow-xs'
        : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)] hover:text-[var(--text-primary)]'
    }`}
  >
    <Icon className={`text-base shrink-0 transition-colors ${active ? 'text-[var(--accent)]' : 'opacity-70'}`} />
    <span className="text-sm font-medium tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent)]/20" />}
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
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token')
      dispatch(setUserData(null))
      window.location.href = '/'
    }
  }

  const userRole = userData?.role || 'USER'

  return (
    <div className="min-h-screen flex w-full relative overflow-x-hidden font-body" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        className="w-64 border-r flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 z-20 transition-colors duration-150"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-4 flex items-center gap-2.5 cursor-pointer border-b transition-colors"
          style={{ borderColor: 'var(--border)' }}
          onClick={() => navigate('/')}
        >
          <BrandLogo size="md" />
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex-1 space-y-0.5">
          {/* Section: Main */}
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-2 font-display" style={{ color: 'var(--text-muted)' }}>Main Menu</p>
          <NavItem onClick={() => navigate('/dashboard')} icon={FaThLarge} label="Overview" active={location.pathname === '/dashboard'} />
          <NavItem onClick={() => navigate('/v2/interview')} icon={FaMicrophoneAlt} label="Start Interview" active={location.pathname === '/v2/interview' || location.pathname === '/interview'} />
          <NavItem onClick={() => navigate('/history')} icon={FaHistory} label="My Reports" active={location.pathname === '/history' || location.pathname.startsWith('/report')} />
          <NavItem onClick={() => navigate('/analytics')} icon={FaChartBar} label="Analytics" active={location.pathname === '/analytics'} />

          {/* Section: Recruiter */}
          {hasPermission(userRole, 'recruiter.candidates.view') && (
            <>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest mt-5 mb-2 font-display" style={{ color: 'var(--text-muted)' }}>Recruiting</p>
              <NavItem onClick={() => navigate('/recruiter')} icon={FaUsersCog} label="Screening Hub" active={location.pathname === '/recruiter'} />
              <NavItem onClick={() => navigate('/admin')} icon={FaShieldAlt} label="Candidate Pipeline" active={location.pathname === '/admin'} />
            </>
          )}

          {/* Section: Super Admin */}
          {hasPermission(userRole, 'system.impersonate') && (
            <>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest mt-5 mb-2 font-display" style={{ color: 'var(--text-muted)' }}>Administration</p>
              <NavItem onClick={() => navigate('/superadmin')} icon={FaCrown} label="Platform Console" active={location.pathname === '/superadmin'} />
            </>
          )}
        </nav>

        {/* Bottom — User Profile */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          {/* Plan badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 border rounded-2xl"
            style={{
              backgroundColor: 'rgba(78, 156, 110, 0.08)',
              borderColor: 'rgba(78, 156, 110, 0.25)',
            }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(78, 156, 110, 0.2)',
                color: 'var(--accent)',
              }}
            >
              <BsStars size={11} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Pro Tier</p>
              <p className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>Enterprise Engine</p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
            >
              Upgrade
            </button>
          </div>

          {/* User card */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-page)',
              borderColor: 'var(--border)',
            }}
          >
            <img
              src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=4e9c6e&color=ffffff&size=64`}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--accent)]/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate font-display" style={{ color: 'var(--text-primary)' }}>{userData?.name || 'User'}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              title="Account Settings"
              className="p-1 transition cursor-pointer shrink-0 hover:text-[var(--accent)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <FaEdit size={11} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header */}
        <header
          className="h-16 border-b px-8 flex items-center justify-between shrink-0 sticky top-0 relative z-50 transition-colors duration-150"
          style={{
            backgroundColor: 'var(--bg-nav)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'var(--border)',
          }}
        >
          {headerLeft ? headerLeft : (
            <div>
              <div className="flex items-center gap-2 font-bold text-lg leading-tight font-display" style={{ color: 'var(--text-primary)' }}>
                <BsStars className="text-[var(--accent)] shrink-0" />
                <h1>{title}</h1>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
          )}

          {headerRight ? headerRight : (
            <div className="flex items-center gap-3" ref={menuRef}>
              {/* Progress (interview pages) */}
              {progressText && (
                <div className="flex items-center gap-3.5 border-r pr-4 mr-1" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-40">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ color: 'var(--accent)' }}>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden p-0.5 border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--accent)' }} />
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: 'rgba(78, 156, 110, 0.12)',
                      borderColor: 'rgba(78, 156, 110, 0.3)',
                      color: 'var(--accent)',
                    }}
                  >
                    {progressText}
                  </span>
                </div>
              )}

              {/* Universal Theme Toggle */}
              <ThemeToggle size="sm" />

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border transition cursor-pointer relative"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <FaBell size={14} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2" style={{ backgroundColor: 'var(--accent)', ringColor: 'var(--bg-elevated)' }} />
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowNotifications(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-2 w-68 rounded-2xl shadow-2xl p-4 z-[70] border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <h3 className="font-bold text-sm mb-2 font-display" style={{ color: 'var(--text-primary)' }}>System Notifications</h3>
                        <div className="text-center py-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All services connected & operational</p>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown trigger */}
              <div className="relative">
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false) }}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <img
                    src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=4e9c6e&color=ffffff&size=64`}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--accent)]/40"
                  />
                  <span className="text-xs font-semibold max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {userData?.name?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl p-2 z-[70] border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                          <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{userData?.name}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{userData?.email}</p>
                        </div>
                        <button
                          onClick={() => { setShowProfileMenu(false); navigate('/dashboard') }}
                          className="w-full text-left px-3 py-1.5 text-xs rounded-xl transition cursor-pointer hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          My Dashboard
                        </button>
                        <button
                          onClick={() => { setShowProfileMenu(false); navigate('/history') }}
                          className="w-full text-left px-3 py-1.5 text-xs rounded-xl transition cursor-pointer hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Interview History
                        </button>
                        <button
                          onClick={() => { setShowProfileMenu(false); navigate('/pricing') }}
                          className="w-full text-left px-3 py-1.5 text-xs rounded-xl transition cursor-pointer hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Upgrade Plan
                        </button>
                        <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <FaSignOutAlt size={11} /> Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </header>

        {/* Page body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
