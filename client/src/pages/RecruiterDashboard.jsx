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

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center ${c.icon} border ${c.border}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    fetchCandidates(q)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmails.trim()) return
    setInviting(true)
    setInviteResult(null)
    try {
      const emailsList = inviteEmails
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean)

      const res = await axios.post(
        `${ServerUrl}/api/recruiter/invite`,
        { emails: emailsList, custom_message: inviteMessage },
        { withCredentials: true }
      )
      setInviteResult(res.data)
      fetchCandidates()
    } catch (err) {
      setInviteResult({ error: err.response?.data?.detail || 'Failed to send invitations.' })
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
      title="Recruiter Hub"
      subtitle="Manage your organization's candidates, send interview invites, and track scores"
    >
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

        {/* ── Top Stats Bar ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={FaUsers}
            label="Total Candidates"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={FaUserCheck}
            label="Active Interviews"
            value={stats.active}
            color="amber"
          />
          <StatCard
            icon={FaChartLine}
            label="Org Average Score"
            value={stats.avg_score != null ? `${stats.avg_score.toFixed(1)} / 10` : 'N/A'}
            color="green"
          />
        </div>

        {/* ── Action & Search Bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search candidate by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <PermissionGuard roles={['RECRUITER', 'SUPER_ADMIN']}>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-sm"
            >
              <FaPlus size={12} /> Invite Candidates
            </button>
          </PermissionGuard>
        </div>

        {/* ── Candidates Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <FaSpinner className="animate-spin text-2xl text-green-500 mr-2" />
              <span className="text-sm">Loading candidates...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FaUsers size={36} className="mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="font-semibold text-gray-700 text-base">No candidates found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Invite candidates to your organization to start reviewing their interview scores here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3.5">Candidate</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Score</th>
                      <th className="px-6 py-3.5">Recommendation</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {candidates.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {c.role || 'Candidate'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.is_active
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-gray-900">
                          {c.latest_score != null ? `${c.latest_score.toFixed(1)} / 10` : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {c.hiring_recommendation ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {c.hiring_recommendation}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs font-medium">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate('/admin')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Pipeline →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 relative"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer p-1">
              <FaTimes size={14} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center text-green-600">
                <FaEnvelopeOpen size={16} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Invite Candidates</h3>
                <p className="text-xs text-gray-500">Enter emails separated by commas or new lines</p>
              </div>
            </div>

            {inviteResult ? (
              <div>
                <div className={`border rounded-xl p-4 mb-4 ${inviteResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  {inviteResult.error ? (
                    <p className="text-red-700 font-semibold text-sm">{inviteResult.error}</p>
                  ) : (
                    <>
                      <p className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                        <FaCheckCircle className="text-green-600" /> {inviteResult.message}
                      </p>
                      <div className="space-y-1.5">
                        {(inviteResult.results || []).map((r, i) => (
                          <p key={i} className="text-xs text-gray-700">
                            <strong>{r.email}</strong>:{' '}
                            <span className={r.status === 'invited' ? 'text-green-600 font-semibold' : 'text-gray-500'}>
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
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Candidate Email Address(es)</label>
                  <textarea
                    rows={3}
                    value={inviteEmails}
                    onChange={e => setInviteEmails(e.target.value)}
                    placeholder="candidate1@example.com, candidate2@example.com"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Custom Invitation Note (Optional)</label>
                  <input
                    type="text"
                    value={inviteMessage}
                    onChange={e => setInviteMessage(e.target.value)}
                    placeholder="e.g. Please complete your technical screen by Friday"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmails.trim()}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {inviting ? <><FaSpinner className="animate-spin" /> Sending...</> : 'Send Invites'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </V2Layout>
  )
}
