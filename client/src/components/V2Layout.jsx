import React from 'react'
import { motion } from 'motion/react'
import { 
  FaMicrophoneAlt, FaRegIdBadge, FaHistory, FaChartPie, FaCog, FaEdit, 
  FaBell, FaSun, FaUserTie, FaClock, FaListOl, FaChartBar, FaThLarge 
} from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl cursor-pointer transition ${active ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'}`}>
    <Icon className={`text-xl ${active ? 'text-green-600' : 'text-gray-400'}`} />
    <span className={`font-medium ${active ? 'text-green-600 font-semibold' : ''}`}>{label}</span>
    {active && <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>}
  </div>
)

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="mt-0.5 p-1.5 bg-gray-50 rounded-lg text-gray-500">
      <Icon size={14} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  </div>
)

export default function V2Layout({ 
  children, 
  title = "AI Smart Interview",
  subtitle = "Your AI interviewer is here to help you succeed",
  progressText = "",
  progressPercent = 0,
  sessionData, // To show role/duration in sidebar
  resumeData, // To show candidate profile
  headerLeft,
  headerRight
}) {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-['Inter',sans-serif]">
      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-2 cursor-pointer mb-2" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-blue-600 font-bold text-xl relative border-2 border-dotted border-blue-400">
             <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white"><BsStars size={12}/></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">InterviewIQ <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded align-middle ml-0.5">AI</span></h1>
        </div>

        {/* Nav Links */}
        <nav className="px-4 flex-1">
          <NavItem onClick={() => navigate('/dashboard')} icon={FaThLarge} label="Overview" active={location.pathname === '/dashboard'} />
          <NavItem onClick={() => navigate('/v2/interview')} icon={FaMicrophoneAlt} label="Interview" active={location.pathname === '/v2/interview'} />
          <NavItem onClick={() => {}} icon={FaRegIdBadge} label="Resume Parser" active={location.pathname === '/resume'} />
          <NavItem onClick={() => {}} icon={FaListOl} label="Question Bank" active={location.pathname === '/questions'} />
          <NavItem onClick={() => navigate('/history')} icon={FaHistory} label="Interview History" active={location.pathname === '/history'} />
          <NavItem onClick={() => {}} icon={FaChartPie} label="Reports" active={location.pathname === '/reports'} />
          <NavItem onClick={() => {}} icon={FaChartBar} label="Analytics" active={location.pathname === '/analytics'} />
          <NavItem onClick={() => {}} icon={FaCog} label="Settings" active={location.pathname === '/settings'} />
        </nav>

        {/* Bottom Cards */}
        <div className="px-4 pb-6 space-y-4">
          
          {/* User Profile */}
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center gap-3 relative">
            <img src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${userData?.name || 'User'}&background=e2e8f0&color=475569`} alt="User" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{userData?.name || "User"}</p>
              <p className="text-[10px] text-gray-500 truncate">Flutter Developer</p>
            </div>
            <button className="text-blue-500 p-1 hover:bg-blue-50 rounded"><FaEdit size={12}/></button>
          </div>

          {/* Pro Plan */}
          <div className="border border-green-100 rounded-xl p-3 bg-green-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center"><BsStars size={12}/></div>
              <div>
                <p className="font-bold text-green-800 text-xs">Pro Plan</p>
                <p className="text-[9px] text-green-600">Valid till 24 Feb 2026</p>
              </div>
            </div>
            <button className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">Upgrade</button>
          </div>

          {/* Need Help */}
          <div className="border border-purple-100 rounded-xl p-4 bg-purple-50">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <div className="w-6 h-6 rounded-full border border-purple-200 flex items-center justify-center text-xs">?</div>
              <h4 className="font-bold text-sm">Need Help?</h4>
            </div>
            <p className="text-[10px] text-purple-800 mb-3 leading-relaxed">Check our documentation or contact support.</p>
            <button className="w-full bg-white text-purple-600 border border-purple-100 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition">Get Support</button>
          </div>

        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          
          {headerLeft ? headerLeft : (
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-1">
                <BsStars className="text-blue-500" />
                <h1>{title}</h1>
              </div>
              <p className="text-gray-500 text-sm">{subtitle}</p>
            </div>
          )}

          {headerRight ? headerRight : (
            <div className="flex items-center gap-8">
              {/* Progress Bar */}
              {progressText && (
                <div className="flex items-center gap-6 border-r border-gray-200 pr-8">
                  <div className="w-48">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Interview Progress</span>
                      <span className="text-sm font-bold text-green-500">{Math.round(progressPercent)}% Complete</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium whitespace-nowrap mt-6">{progressText}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
                  <FaSun size={18} />
                </button>
                <div className="relative">
                  <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
                    <FaBell size={18} />
                  </button>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer">
                  <img src={userData?.profile_picture || `https://ui-avatars.com/api/?name=${userData?.name || 'User'}&background=e2e8f0&color=475569`} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}</style>
    </div>
  )
}
