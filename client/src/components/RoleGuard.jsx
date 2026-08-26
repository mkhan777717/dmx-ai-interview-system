import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { hasPermission } from '../permissions'

/**
 * RoleGuard — Renders children only if the current user has one of the required roles.
 *
 * @param {string[]} roles - Array of allowed roles e.g. ['SUPER_ADMIN', 'RECRUITER']
 * @param {string}   permission - Alternative: check a specific permission key (from permissions.js)
 * @param {string}   redirectTo - Where to redirect on failure (default: '/403')
 * @param {ReactNode} fallback - What to render instead of redirecting (optional)
 *
 * Usage:
 *   <RoleGuard roles={['SUPER_ADMIN', 'RECRUITER']}>
 *     <AdminDashboard />
 *   </RoleGuard>
 *
 *   <RoleGuard permission="interviews.overrideScore">
 *     <OverrideButton />
 *   </RoleGuard>
 */
export default function RoleGuard({
  children,
  roles,
  permission,
  redirectTo = '/403',
  fallback = null,
}) {
  const { userData, loading } = useSelector(state => state.user)
  const userRole = userData?.role || 'USER'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in → redirect to auth
  if (!userData) {
    return <Navigate to="/auth" replace />
  }

  let allowed = false

  if (roles && roles.length > 0) {
    allowed = roles.includes(userRole)
  } else if (permission) {
    allowed = hasPermission(userRole, permission)
  } else {
    // No constraint specified → allow any authenticated user
    allowed = true
  }

  if (!allowed) {
    if (fallback !== null) {
      return fallback
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

/**
 * PermissionGuard — Inline guard for hiding/showing UI elements.
 * Does NOT redirect — just returns null if not allowed.
 *
 * Usage:
 *   <PermissionGuard permission="interviews.overrideScore">
 *     <button>Override Score</button>
 *   </PermissionGuard>
 */
export function PermissionGuard({ children, permission, roles }) {
  const userData = useSelector(state => state.user?.userData)
  const userRole = userData?.role || 'USER'

  if (!userData) return null

  let allowed = false
  if (roles && roles.length > 0) {
    allowed = roles.includes(userRole)
  } else if (permission) {
    allowed = hasPermission(userRole, permission)
  } else {
    allowed = true
  }

  return allowed ? <>{children}</> : null
}
