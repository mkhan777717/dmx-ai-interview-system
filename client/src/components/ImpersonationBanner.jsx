import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { clearImpersonation, setUserData } from '../redux/userSlice'
import { ServerUrl } from '../App'

/**
 * ImpersonationBanner — Displayed globally when a Super Admin is impersonating another user.
 * The banner is prominent, yellow, and explains the impersonation context.
 * Provides a "End Session" button to return to the real admin account.
 */
export default function ImpersonationBanner() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isImpersonating, impersonatedAs } = useSelector(state => state.user)

  if (!isImpersonating) return null

  const handleEndSession = async () => {
    try {
      // Log out the impersonation token and re-fetch real admin session
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(clearImpersonation())
      dispatch(setUserData(null))
      navigate('/auth')
    } catch {
      navigate('/auth')
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-400 border-b-2 border-amber-500 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ⚠
          </div>
          <div className="text-sm text-amber-900">
            <span className="font-bold">Impersonation Active</span>
            {impersonatedAs && (
              <span>
                {' — '}You are viewing as{' '}
                <span className="font-semibold">{impersonatedAs.name || impersonatedAs.email}</span>
                {' '}({impersonatedAs.role}). This session expires in 15 minutes.
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleEndSession}
          className="shrink-0 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          End Session
        </button>
      </div>
    </div>
  )
}
