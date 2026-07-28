import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import {
  FaCrown, FaBuilding, FaUsers, FaChartBar, FaSpinner, FaTrash,
  FaPlus, FaHistory, FaExchangeAlt, FaSearch,
} from 'react-icons/fa'
import { motion } from 'motion/react'

const TABS = [
  { key: 'Platform Overview', icon: FaChartBar },
  { key: 'Organizations',     icon: FaBuilding },
  { key: 'All Users',         icon: FaUsers },
  { key: 'Audit Logs',        icon: FaHistory },
  { key: 'Impersonate',       icon: FaExchangeAlt },
]

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('Platform Overview')
  const [loading, setLoading] = useState(false)

  const [platformStats, setPlatformStats] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgPlan, setNewOrgPlan] = useState('FREE')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [impersonateId, setImpersonateId] = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [impersonateMsg, setImpersonateMsg] = useState(null)

  const apiGet  = (url, params = {}) => axios.get(`${ServerUrl}${url}`,  { params, withCredentials: true })
  const apiPost = (url, data  = {}) => axios.post(`${ServerUrl}${url}`, data,  { withCredentials: true })
  const apiDel  = (url)             => axios.delete(`${ServerUrl}${url}`,       { withCredentials: true })

  useEffect(() => { loadTab(activeTab) }, [activeTab])

  const loadTab = async (tab) => {
    setLoading(true)
    try {
      if (tab === 'Platform Overview') {
        const r = await apiGet('/api/superadmin/platform-analytics')
        setPlatformStats(r.data)
      } else if (tab === 'Organizations') {
        const r = await apiGet('/api/superadmin/orgs')
        setOrgs(r.data.orgs || [])
      } else if (tab === 'All Users') {
        const r = await apiGet('/api/superadmin/users', { role: userRoleFilter || undefined })
        setUsers(r.data.users || [])
      } else if (tab === 'Audit Logs') {
        const r = await apiGet('/api/admin/audit-logs')
        setAuditLogs(r.data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return
    setCreatingOrg(true)
    try {
      await apiPost('/api/superadmin/orgs', { name: newOrgName, plan: newOrgPlan })
      setNewOrgName('')
      loadTab('Organizations')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create org')
    } finally {
      setCreatingOrg(false)
    }
  }

  const handleDeleteOrg = async (orgId, orgName) => {
    if (!window.confirm(`Soft-delete "${orgName}"? All members will be deactivated.`)) return
    try {
      await apiDel(`/api/superadmin/orgs/${orgId}`)
      loadTab('Organizations')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete org')
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateId) return
    setImpersonating(true)
    setImpersonateMsg(null)
    try {
      const r = await apiPost(`/api/superadmin/users/${impersonateId}/impersonate`)
      setImpersonateMsg({ success: true, data: r.data })
      setTimeout(() => window.location.reload(), 1800)
    } catch (err) {
      setImpersonateMsg({ success: false, error: err.response?.data?.detail || 'Impersonation failed' })
    } finally {
      setImpersonating(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${ServerUrl}/api/admin/users/${userId}/role`, { new_role: newRole }, { withCredentials: true })
      loadTab('All Users')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <V2Layout title="Platform Control" subtitle="Super Admin — cross-organization management">
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* Banner */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
          <FaCrown className="text-purple-600 text-lg shrink-0" />
          <p className="text-sm text-purple-900 font-medium">
            You have <strong>Super Admin</strong> access. All actions here are audit-logged and affect the entire platform.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={12} /> {key}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-56 text-gray-400">
            <FaSpinner className="animate-spin mr-2 text-purple-500" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        ) : (
          <>
            {/* ── Platform Overview ── */}
            {activeTab === 'Platform Overview' && platformStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard label="Total Users"    value={platformStats.users?.total}      sub={`${platformStats.users?.active} active`} />
                  <StatCard label="Organizations"  value={platformStats.organizations?.total} />
                  <StatCard label="Total Interviews" value={platformStats.interviews?.total} sub={`${platformStats.interviews?.completion_rate}% completion`} />
                  <StatCard label="Avg Score"      value={platformStats.interviews?.avg_score ? `${platformStats.interviews.avg_score}/10` : '—'} />
                </div>

                {/* Mode distribution */}
                {(platformStats.mode_distribution || []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Interview Mode Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {platformStats.mode_distribution.map(m => (
                        <div key={m.mode} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                          <p className="font-bold text-gray-900 text-xl">{m.count}</p>
                          <p className="text-xs text-gray-500 mt-1">{m.mode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Audit Events */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <FaHistory className="text-purple-500" />
                    <h3 className="font-bold text-gray-900">Recent Audit Events</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(platformStats.recent_audit_events || []).map((e, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-3">
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg shrink-0">
                          {e.action}
                        </span>
                        <span className="text-sm text-gray-700">{e.entity_type} #{e.entity_id || '—'}</span>
                        <span className="text-xs text-gray-400 ml-auto shrink-0">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {!(platformStats.recent_audit_events || []).length && (
                      <div className="py-8 text-center text-gray-400 text-sm">No audit events yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Organizations ── */}
            {activeTab === 'Organizations' && (
              <div className="space-y-5">
                {/* Create */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaPlus className="text-green-500" size={13} /> Create Organization
                  </h3>
                  <div className="flex gap-3">
                    <input
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
                      placeholder="Organization name..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                    />
                    <select
                      value={newOrgPlan}
                      onChange={e => setNewOrgPlan(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    >
                      {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map(p => <option key={p}>{p}</option>)}
                    </select>
                    <button
                      onClick={handleCreateOrg}
                      disabled={!newOrgName.trim() || creatingOrg}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold rounded-xl transition cursor-pointer shadow-sm"
                    >
                      {creatingOrg ? <FaSpinner className="animate-spin" /> : 'Create'}
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">All Organizations</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {orgs.map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                          <FaBuilding size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{o.name}</p>
                          <p className="text-xs text-gray-500">Plan: <span className="font-medium text-gray-700">{o.plan}</span> · Members: <span className="font-medium text-gray-700">{o.member_count}</span></p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          o.is_deleted
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          {o.is_deleted ? 'Deleted' : 'Active'}
                        </span>
                        {!o.is_deleted && (
                          <button
                            onClick={() => handleDeleteOrg(o.id, o.name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Soft-delete org"
                          >
                            <FaTrash size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {orgs.length === 0 && (
                      <div className="py-12 text-center text-gray-400 text-sm">No organizations yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── All Users ── */}
            {activeTab === 'All Users' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={e => { setUserRoleFilter(e.target.value); loadTab('All Users') }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="USER">User</option>
                  </select>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-2.5 border-b border-gray-50 bg-gray-50/50">
                  <span />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">User</span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role</span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e2e8f0&color=475569&size=64`}
                        alt={u.name}
                        className="w-9 h-9 rounded-full border border-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <select
                        defaultValue={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        <option value="USER">User</option>
                        <option value="RECRUITER">Recruiter</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        u.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {u.is_active ? 'Active' : 'Off'}
                      </span>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">No users found.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Audit Logs ── */}
            {activeTab === 'Audit Logs' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <FaHistory className="text-purple-500" size={14} />
                  <h3 className="font-bold text-gray-900">Audit Log</h3>
                  <span className="text-xs text-gray-400 ml-1">(read-only — cannot be deleted)</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {auditLogs.map(l => (
                    <div key={l.id} className="flex items-start gap-4 px-6 py-4">
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                        {l.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                          Actor #{l.actor_id} → {l.entity_type} #{l.entity_id || '—'}
                        </p>
                        {l.details && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                            {JSON.stringify(l.details).slice(0, 140)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(l.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">No audit logs yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Impersonate ── */}
            {activeTab === 'Impersonate' && (
              <div className="max-w-md space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold mb-2 text-sm">
                    <FaExchangeAlt className="text-amber-600" size={14} /> Impersonate User
                  </div>
                  <p className="text-sm text-amber-800">
                    This action is <strong>always audit logged</strong>. Sessions expire in <strong>15 minutes</strong>.
                    A warning banner will be visible during impersonation.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Target User ID</label>
                    <input
                      type="number"
                      value={impersonateId}
                      onChange={e => setImpersonateId(e.target.value)}
                      placeholder="Enter user ID (from 'All Users' tab)"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                    />
                  </div>
                  <button
                    onClick={handleImpersonate}
                    disabled={!impersonateId || impersonating}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    {impersonating
                      ? <><FaSpinner className="animate-spin" /> Starting...</>
                      : 'Start Impersonation Session'}
                  </button>

                  {impersonateMsg && (
                    <div className={`p-4 rounded-xl text-sm font-medium border ${
                      impersonateMsg.success
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {impersonateMsg.success
                        ? `✅ Impersonating ${impersonateMsg.data?.impersonated_user?.email}. Page will reload...`
                        : `❌ ${impersonateMsg.error}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </V2Layout>
  )
}
