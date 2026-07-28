import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getRoleLabel, getDefaultRoute } from '../permissions'

export default function Forbidden() {
  const navigate = useNavigate()
  const userData = useSelector(state => state.user?.userData)
  const role = userData?.role || 'USER'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Error code */}
        <p className="text-sm font-bold text-red-400 tracking-widest uppercase mb-2">Error 403</p>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>

        {/* Description */}
        <p className="text-gray-500 mb-2">
          You don't have permission to view this page.
        </p>
        {userData && (
          <p className="text-sm text-gray-400 mb-8">
            You're signed in as <span className="font-semibold text-gray-600">{userData.email}</span>{' '}
            with the <span className="font-semibold text-blue-600">{getRoleLabel(role)}</span> role.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(getDefaultRoute(role))}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Go Back
          </button>
        </div>

        {/* Role info box */}
        <div className="mt-10 p-4 bg-blue-50 border border-blue-100 rounded-xl text-left text-sm text-blue-700">
          <p className="font-semibold mb-1">Why am I seeing this?</p>
          <p>
            This page is restricted to specific roles. If you believe you should have access,
            please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
