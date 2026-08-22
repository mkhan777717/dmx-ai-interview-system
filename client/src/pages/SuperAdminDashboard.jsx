import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import V2Layout from '../components/V2Layout'
import {
  FaCrown, FaBuilding, FaUsers, FaChartBar, FaSpinner, FaTrash,
  FaPlus, FaHistory, FaExchangeAlt, FaSearch,
} from 'react-icons/fa'
import { motion } from 'motion/react'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import Badge from '../components/ui/Badge'

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
    <div className="glass-card-static rounded-3xl p-5 border border-white/8 group hover:border-cyan-500/30 transition-all">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-white font-['Outfit']">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
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
        setOrgs(r.data.organizations || r.data.orgs || [])
      } else if (tab === 'All Users') {
        const r = await apiGet('/api/superadmin/users', {
          role: userRoleFilter || undefined,
          search: userSearch || undefined,
        })
        setUsers(r.data.users || [])
      } else if (tab === 'Audit Logs') {
        const r = await apiGet('/api/superadmin/audit-logs')
        setAuditLogs(r.data.logs || [])
      }
    } catch (err) {
      console.error('SuperAdmin loadTab error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return
    setCreatingOrg(true)
    try {
      await apiPost('/api/superadmin/orgs', { name: newOrgName.trim(), plan: newOrgPlan })
      setNewOrgName('')
      loadTab('Organizations')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create org')
    } finally {
      setCreatingOrg(false)
    }
  }

  const handleDeleteOrg = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to delete org "${orgName}"?`)) return
    try {
      await apiDel(`/api/superadmin/orgs/${orgId}`)
      loadTab('Organizations')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete org')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiPost(`/api/superadmin/users/${userId}/role`, { role: newRole })
      loadTab('All Users')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateId) return
    setImpersonating(true)
    setImpersonateMsg(null)
    try {
      const r = await apiPost('/api/superadmin/impersonate', { user_id: parseInt(impersonateId) })
      setImpersonateMsg({ success: true, text: `Now impersonating: ${r.data.impersonated_user.name} (${r.data.impersonated_user.role}). Redirecting...` })
      setTimeout(() => window.location.href = '/dashboard', 1200)
    } catch (err) {
      setImpersonateMsg({ success: false, text: err.response?.data?.detail || 'Impersonation failed' })
    } finally {
      setImpersonating(false)
    }
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <V2Layout
      title="Platform Control Center"
      subtitle="Multi-tenant supervision, organizational quotas, RBAC escalation, and security audit logs."
    >
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-2 border-b border-white/8 pb-3 overflow-x-auto">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === key
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={12} />
              {key}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <FaSpinner className="animate-spin text-2xl text-cyan-400 mr-2" />
            <span className="text-sm">Loading data...</span>
          </div>
        ) : (
          <div>
            {/* ── Platform Overview ── */}
            {activeTab === 'Platform Overview' && platformStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Platform Users" value={platformStats.total_users} sub={`+${platformStats.new_users_30d || 0} this month`} />
                  <StatCard label="Organizations" value={platformStats.total_organizations} sub={`${platformStats.active_organizations || 0} active`} />
                  <StatCard label="Interviews Completed" value={platformStats.total_interviews} sub="All tenant sessions" />
                  <StatCard label="Avg Platform Score" value={platformStats.avg_platform_score != null ? `${platformStats.avg_platform_score.toFixed(1)}/10` : '—'} sub="Across all rubrics" />
                </div>

                {/* Plan Distribution */}
                {platformStats.plan_breakdown && (
                  <div className="glass-card-static rounded-3xl p-6">
                    <h3 className="font-bold text-white mb-4 font-['Outfit']">Organizations by Subscription Plan</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.entries(platformStats.plan_breakdown).map(([plan, count]) => (
                        <div key={plan} className="glass-panel-subtle rounded-2xl p-4 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{plan}</p>
                          <p className="text-2xl font-extrabold text-cyan-300 font-['Outfit'] mt-1">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Audit Events */}
                <div className="glass-card-static rounded-3xl p-6">
                  <h3 className="font-bold text-white mb-4 font-['Outfit']">Recent Security & Admin Events</h3>
                  <div className="divide-y divide-white/5">
                    {(platformStats.recent_audit_events || []).slice(0, 5).map(e => (
                      <div key={e.id} className="py-3 flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shrink-0">
                          {e.action}
                        </span>
                        <span className="text-sm text-slate-300">{e.entity_type} #{e.entity_id || '—'}</span>
                        <span className="text-xs text-slate-500 ml-auto shrink-0">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {!(platformStats.recent_audit_events || []).length && (
                      <div className="py-8 text-center text-slate-400 text-sm">No audit events yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Organizations ── */}
            {activeTab === 'Organizations' && (
              <div className="space-y-5">
                {/* Create */}
                <div className="glass-card-static rounded-3xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-['Outfit']">
                    <FaPlus className="text-cyan-400" size={13} /> Create Organization
                  </h3>
                  <div className="flex gap-3">
                    <input
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
                      placeholder="Organization name..."
                      className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500"
                    />
                    <select
                      value={newOrgPlan}
                      onChange={e => setNewOrgPlan(e.target.value)}
                      className="glass-input rounded-xl px-3 py-2.5 text-sm text-white cursor-pointer"
                    >
                      {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map(p => <option key={p} className="bg-slate-900 text-white">{p}</option>)}
                    </select>
                    <GradientButton
                      onClick={handleCreateOrg}
                      disabled={!newOrgName.trim() || creatingOrg}
                      size="sm"
                    >
                      {creatingOrg ? <FaSpinner className="animate-spin" /> : 'Create'}
                    </GradientButton>
                  </div>
                </div>

                {/* List */}
                <div className="glass-card-static rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/8">
                    <h3 className="font-bold text-white font-['Outfit']">All Organizations</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {orgs.map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0">
                          <FaBuilding size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white font-['Outfit']">{o.name}</p>
                          <p className="text-xs text-slate-400">Plan: <span className="font-semibold text-cyan-300">{o.plan}</span> · Members: <span className="font-semibold text-slate-300">{o.member_count}</span></p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.is_deleted
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        }`}>
                          {o.is_deleted ? 'Deleted' : 'Active'}
                        </span>
                        {!o.is_deleted && (
                          <button
                            onClick={() => handleDeleteOrg(o.id, o.name)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
                            title="Soft-delete org"
                          >
                            <FaTrash size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {orgs.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-sm">No organizations yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── All Users ── */}
            {activeTab === 'All Users' && (
              <div className="glass-card-static rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-4 py-2 glass-input rounded-xl text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={e => { setUserRoleFilter(e.target.value); loadTab('All Users') }}
                    className="glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">All Roles</option>
                    <option value="SUPER_ADMIN" className="bg-slate-900">Super Admin</option>
                    <option value="RECRUITER" className="bg-slate-900">Recruiter</option>
                    <option value="USER" className="bg-slate-900">User</option>
                  </select>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-2.5 border-b border-white/8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span />
                  <span>User</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>

                <div className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-white/3 transition">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=06b6d4&color=050811&size=64`}
                        alt={u.name}
                        className="w-9 h-9 rounded-full border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate font-['Outfit']">{u.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      <select
                        defaultValue={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-xs glass-input rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                      >
                        <option value="USER" className="bg-slate-900">User</option>
                        <option value="RECRUITER" className="bg-slate-900">Recruiter</option>
                        <option value="SUPER_ADMIN" className="bg-slate-900">Super Admin</option>
                      </select>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        u.is_active
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {u.is_active ? 'Active' : 'Off'}
                      </span>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">No users found.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Audit Logs ── */}
            {activeTab === 'Audit Logs' && (
              <div className="glass-card-static rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                  <h3 className="font-bold text-white font-['Outfit']">System Audit Trail</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {auditLogs.map(log => (
                    <div key={log.id} className="px-6 py-3.5 flex items-center gap-4 text-xs">
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-medium">{log.entity_type} #{log.entity_id || '—'}</span>
                        {log.ip_address && <span className="text-slate-500 ml-2 text-[10px]">({log.ip_address})</span>}
                      </div>
                      <span className="text-slate-500 text-[10px] shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">No audit logs yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Impersonate ── */}
            {activeTab === 'Impersonate' && (
              <div className="max-w-lg glass-card-static rounded-3xl p-6">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-['Outfit']">
                  <FaExchangeAlt className="text-cyan-400" size={14} /> Impersonate User Session
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  Assume the identity and tenant permissions of another user for support & diagnostics.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">User ID</label>
                    <input
                      type="number"
                      value={impersonateId}
                      onChange={e => setImpersonateId(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  {impersonateMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${impersonateMsg.success ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                      {impersonateMsg.text}
                    </div>
                  )}
                  <GradientButton
                    onClick={handleImpersonate}
                    disabled={!impersonateId || impersonating}
                    size="sm"
                    className="w-full"
                  >
                    {impersonating ? <FaSpinner className="animate-spin" /> : 'Begin Impersonation'}
                  </GradientButton>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </V2Layout>
  )
}
