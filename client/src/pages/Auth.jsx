import React, { useState } from 'react'
import { BsRobot } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import { motion } from 'motion/react'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../utils/firebase'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'
import { getDefaultRoute } from '../permissions'

function Auth({ isModel = false }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleGoogleAuth = async () => {
        try {
            setError(null)
            setLoading(true)
            const response = await signInWithPopup(auth, provider)
            const { displayName: name, email } = response.user

            const result = await axios.post(
                ServerUrl + '/api/auth/google',
                { name, email },
                { withCredentials: true }
            )

            const userData = result.data
            dispatch(setUserData(userData))

            // Redirect to the role-appropriate dashboard
            if (!isModel) {
                navigate(getDefaultRoute(userData.role), { replace: true })
            }
        } catch (error) {
            console.error('Auth error:', error.code, error.message)
            setError(error.code || error.message || 'Sign in failed')
            dispatch(setUserData(null))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`w-full ${isModel ? 'py-4' : 'min-h-screen bg-[#f4f6f8] flex items-center justify-center px-6 py-20'}`}>
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`w-full ${isModel ? 'max-w-md p-8 rounded-3xl' : 'max-w-md p-10 rounded-3xl'} bg-white shadow-xl border border-gray-200 text-gray-900`}
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                        <BsRobot size={18} />
                    </div>
                    <h2 className="font-bold text-xl text-gray-900 tracking-tight">InterviewIQ<span className="text-green-600">.AI</span></h2>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-center text-gray-900 leading-snug mb-3">
                    Welcome back 👋
                </h1>
                <p className="text-gray-500 text-center text-sm mb-8">
                    Sign in to access your AI interviews, reports, and progress tracking.
                </p>

                {/* Google Button */}
                <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-2xl flex items-center justify-center gap-3 shadow-sm transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <FcGoogle size={20} />
                    )}
                    {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {/* Error */}
                {error && (
                    <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    By signing in, you agree to our{' '}
                    <a href="#" className="underline hover:text-gray-600">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </p>

                {/* Feature hints */}
                <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                    {[
                        { icon: '🎯', text: 'AI Interviews' },
                        { icon: '📊', text: 'Smart Reports' },
                        { icon: '🚀', text: 'Track Progress' },
                    ].map(f => (
                        <div key={f.text} className="flex flex-col items-center gap-1.5">
                            <span className="text-xl">{f.icon}</span>
                            <span className="text-[10px] font-semibold text-gray-500">{f.text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default Auth
