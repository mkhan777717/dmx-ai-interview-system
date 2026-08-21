import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import { PermissionGuard } from '../components/RoleGuard'
import {
  FaUsers, FaEnvelopeOpen, FaCheckCircle, FaSpinner, FaSearch,
  FaChartLine, FaPlus, FaTimes, FaUserCheck,
} from 'react-icons/fa'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import Badge from '../components/ui/Badge'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   { bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   border: 'border-cyan-500/20' },
    green:  { bg: 'bg-emerald-500/10',  icon: 'text-emerald-400',  border: 'border-emerald-500/20' },
    amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="glass-card-static rounded-3xl p-6 flex items-center gap-4 group hover:border-cyan-500/30 transition-all">
      <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center ${c.icon} border ${c.border} shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-extrabold text-white font-['Outfit']">{value}</h3>
      </div>
    </div>
  )
}

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const { userData } = useSelector(state => state.user)

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, avg_score: null })

  const fetchCandidates = async (q = '') => {
    setLoading(true)
    try {
      const res = await axios.get(`${ServerUrl}/api/recruiter/candidates?search=${encodeURIComponent(q)}`, {
        withCredentials: true,
      })
      setCandidates(res.data.candidates || [])
      setStats({
        total: res.data.total_candidates || 0,
        active: res.data.active_interviews || 0,
        avg_score: res.data.avg_organization_score,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCandidates(search)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmails.trim()) return
    setInviting(true)
    try {
      const emails = inviteEmails
        .split(/[\n,]/)
        .map(e => e.trim())
        .filter(Boolean)

      const res = await axios.post(`${ServerUrl}/api/recruiter/invite`, {
        emails,
        custom_message: inviteMessage.trim() || undefined,
      }, { withCredentials: true })

      setInviteResult({ success: true, message: res.data.message, results: res.data.results })
      fetchCandidates()
    } catch (err) {
      setInviteResult({ error: err.response?.data?.detail || 'Failed to send invites.' })
    } finally {
      setInviting(false)
    }
  }

  const closeModal = () => {
    setShowInviteModal(false)
    setInviteEmails('')
    setInviteMessage('')
    setInviteResult(null)
  }

  return (
    <V2Layout
      title="Recruiter Screening Hub"
      subtitle="Review candidate scores, send assessment invites, and track team hiring metrics."
    >
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            icon={FaUsers}
            label="Total Candidates"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={FaUserCheck}
            label="Active Screenings"
            value={stats.active}
            color="green"
          />
          <StatCard
            icon={FaChartLine}
            label="Org Average Score"
            value={stats.avg_score != null ? `${stats.avg_score.toFixed(1)} / 10` : 'N/A'}
            color="amber"
          />
        </div>

        {/* ── Actions / Search ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by candidate name or email..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-2xl text-xs text-white placeholder-slate-500"
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-xs" />
          </form>

          <PermissionGuard roles={['RECRUITER', 'SUPER_ADMIN']}>
            <GradientButton
              onClick={() => setShowInviteModal(true)}
              size="sm"
              icon={FaPlus}
            >
              Invite Candidates
            </GradientButton>
          </PermissionGuard>
        </div>

        {/* ── Candidates Table ── */}
        <div className="glass-card-static rounded-3xl p-6 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <FaSpinner className="animate-spin text-2xl text-cyan-400 mr-2" />
              <span className="text-sm">Loading candidates...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FaUsers size={36} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="font-bold text-white text-base font-['Outfit']">No candidates found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Invite candidates to your organization to start reviewing their interview scores here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-4">Candidate</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Score</th>
                    <th className="pb-3 px-4">Recommendation</th>
                    <th className="pb-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {candidates.map(c => (
                    <tr key={c.id} className="hover:bg-white/3 transition group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white group-hover:text-cyan-300 transition-colors font-['Outfit']">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {c.role || 'Candidate'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.is_active
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                            : 'bg-white/5 text-slate-400'
                        }`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-white font-['Outfit']">
                        {c.latest_score != null ? `${c.latest_score.toFixed(1)} / 10` : '—'}
                      </td>
                      <td className="py-4 px-4">
                        {c.hiring_recommendation ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                            {c.hiring_recommendation}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-medium">Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate('/admin')}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          Pipeline →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-slate-950/90 rounded-3xl p-6 shadow-2xl border border-white/10 relative"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1">
              <FaTimes size={14} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <FaEnvelopeOpen size={16} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-['Outfit']">Invite Candidates</h3>
                <p className="text-xs text-slate-400">Enter emails separated by commas or new lines</p>
              </div>
            </div>

            {inviteResult ? (
              <div>
                <div className={`border rounded-2xl p-4 mb-4 ${inviteResult.error ? 'bg-rose-500/10 border-rose-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                  {inviteResult.error ? (
                    <p className="text-rose-300 font-bold text-xs">{inviteResult.error}</p>
                  ) : (
                    <>
                      <p className="font-bold text-cyan-300 mb-2 flex items-center gap-2 text-xs">
                        <FaCheckCircle className="text-cyan-400" /> {inviteResult.message}
                      </p>
                      <div className="space-y-1.5">
                        {(inviteResult.results || []).map((r, i) => (
                          <p key={i} className="text-xs text-slate-300">
                            <strong>{r.email}</strong>:{' '}
                            <span className={r.status === 'invited' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                              {r.status}
                            </span>
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 btn-glass font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Candidate Email Address(es)</label>
                  <textarea
                    rows={3}
                    value={inviteEmails}
                    onChange={e => setInviteEmails(e.target.value)}
                    placeholder="candidate1@example.com, candidate2@example.com"
                    required
                    className="w-full p-3 glass-input rounded-xl text-xs text-white placeholder-slate-500 resize-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Custom Invitation Note (Optional)</label>
                  <input
                    type="text"
                    value={inviteMessage}
                    onChange={e => setInviteMessage(e.target.value)}
                    placeholder="e.g. Please complete your technical screen by Friday"
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <SecondaryButton
                    onClick={closeModal}
                    size="sm"
                  >
                    Cancel
                  </SecondaryButton>
                  <GradientButton
                    type="submit"
                    disabled={inviting || !inviteEmails.trim()}
                    size="sm"
                  >
                    {inviting ? <><FaSpinner className="animate-spin mr-1" /> Sending...</> : 'Send Invites'}
                  </GradientButton>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </V2Layout>
  )
}
