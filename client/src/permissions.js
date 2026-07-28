/**
 * RBAC Permissions Matrix — Single Source of Truth
 * =================================================
 * Used by both:
 *   - Frontend: to conditionally render/hide UI elements
 *   - Backend: guards mirror these exactly (FastAPI require_roles / require_db_role)
 *
 * Role hierarchy: SUPER_ADMIN > RECRUITER > USER
 */

export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RECRUITER:   'RECRUITER',
  USER:        'USER',
}

/**
 * Permissions matrix.
 * Format: { [action]: Set of roles that can perform it }
 */
export const PERMISSIONS = {
  // ── Users ──────────────────────────────────────────────────────────────────
  'users.invite':          [Role.RECRUITER, Role.SUPER_ADMIN],
  'users.viewAll':         [Role.RECRUITER, Role.SUPER_ADMIN],
  'users.delete':          [Role.SUPER_ADMIN],
  'users.changeRole':      [Role.SUPER_ADMIN],
  'users.impersonate':     [Role.SUPER_ADMIN],
  'users.viewOwn':         [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],

  // ── Organizations ──────────────────────────────────────────────────────────
  'orgs.create':           [Role.SUPER_ADMIN],
  'orgs.delete':           [Role.SUPER_ADMIN],
  'orgs.viewAll':          [Role.SUPER_ADMIN],
  'orgs.viewOwn':          [Role.RECRUITER, Role.SUPER_ADMIN],

  // ── Interviews ─────────────────────────────────────────────────────────────
  'interviews.viewAll':    [Role.RECRUITER, Role.SUPER_ADMIN],
  'interviews.viewOwn':    [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],
  'interviews.create':     [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],
  'interviews.delete':     [Role.SUPER_ADMIN],    // Soft-delete only
  'interviews.overrideScore': [Role.RECRUITER, Role.SUPER_ADMIN],  // DB role re-checked
  'interviews.exportPDF':  [Role.RECRUITER, Role.SUPER_ADMIN],
  'interviews.viewRubrics': [Role.RECRUITER, Role.SUPER_ADMIN],

  // ── Analytics ──────────────────────────────────────────────────────────────
  'analytics.platform':    [Role.SUPER_ADMIN],
  'analytics.org':         [Role.RECRUITER, Role.SUPER_ADMIN],
  'analytics.own':         [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],

  // ── Admin / System ─────────────────────────────────────────────────────────
  'admin.billing':         [Role.SUPER_ADMIN],
  'admin.systemSettings':  [Role.SUPER_ADMIN],
  'admin.auditLogs':       [Role.SUPER_ADMIN],
  'admin.featureFlags':    [Role.SUPER_ADMIN],

  // ── Navigation (used by sidebar) ───────────────────────────────────────────
  'nav.dashboard':         [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],
  'nav.analytics':         [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],
  'nav.history':           [Role.USER, Role.RECRUITER, Role.SUPER_ADMIN],
  'nav.recruiterDashboard': [Role.RECRUITER, Role.SUPER_ADMIN],
  'nav.superAdminDashboard': [Role.SUPER_ADMIN],
  'nav.auditLogs':         [Role.SUPER_ADMIN],
}

/**
 * Check if a role has permission to perform an action.
 *
 * @param {string} role - 'SUPER_ADMIN' | 'RECRUITER' | 'USER'
 * @param {string} action - Key from PERMISSIONS
 * @returns {boolean}
 *
 * @example
 *   hasPermission('RECRUITER', 'interviews.overrideScore') // true
 *   hasPermission('USER', 'orgs.create')                  // false
 */
export function hasPermission(role, action) {
  if (!role || !action) return false
  const allowed = PERMISSIONS[action]
  if (!allowed) return false
  return allowed.includes(role)
}

/**
 * Get the home route for a given role.
 */
export function getDefaultRoute(role) {
  switch (role) {
    case Role.SUPER_ADMIN: return '/superadmin'
    case Role.RECRUITER:   return '/recruiter'
    case Role.USER:
    default:               return '/dashboard'
  }
}

/**
 * Get a human-friendly label for a role.
 */
export function getRoleLabel(role) {
  switch (role) {
    case Role.SUPER_ADMIN: return 'Super Admin'
    case Role.RECRUITER:   return 'Recruiter'
    case Role.USER:        return 'Candidate'
    default:               return 'Unknown'
  }
}

/**
 * Get a color class for the role badge.
 */
export function getRoleBadgeColor(role) {
  switch (role) {
    case Role.SUPER_ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200'
    case Role.RECRUITER:   return 'bg-blue-100 text-blue-800 border-blue-200'
    case Role.USER:        return 'bg-green-100 text-green-800 border-green-200'
    default:               return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}
