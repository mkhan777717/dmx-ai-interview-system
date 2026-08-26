import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getRoleLabel, getDefaultRoute } from '../permissions'

export default function Forbidden() {
  const navigate = useNavigate()
  const userData = useSelector(state => state.user?.userData)
  const role = userData?.role || 'USER'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 font-body transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="max-w-lg w-full text-center rounded-3xl p-8 border shadow-xl"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-full border flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
          }}
        >
          <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Error code */}
        <p className="text-xs font-bold text-rose-500 tracking-widest uppercase mb-2 font-display">Error 403</p>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold mb-3 font-display" style={{ color: 'var(--text-primary)' }}>Access Denied</h1>

        {/* Description */}
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          You don't have permission to view this page.
        </p>
        {userData && (
          <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
            You're signed in as <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userData.email}</span>{' '}
            with the <span className="font-semibold" style={{ color: 'var(--accent)' }}>{getRoleLabel(role)}</span> role.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(getDefaultRoute(role))}
            className="px-6 py-2.5 btn-primary rounded-full text-xs font-bold transition cursor-pointer shadow-sm"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 btn-secondary rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            Go Back
          </button>
        </div>

        {/* Role info box */}
        <div
          className="mt-8 p-4 border rounded-2xl text-left text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Why am I seeing this?</p>
          <p>
            This page is restricted to specific roles. If you believe you should have access,
            please contact your platform administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
