import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FaTimes } from 'react-icons/fa'
import Auth from '../pages/Auth'
import { useNavigate } from 'react-router-dom'

function AuthModel({ onClose }) {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (userData) {
      onClose()
      navigate('/v2/interview')
    }
  }, [userData, onClose, navigate])

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-8 right-6 z-20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer border hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Close dialog"
        >
          <FaTimes size={13} />
        </button>
        <Auth isModel={true} />
      </div>
    </div>
  )
}

export default AuthModel
