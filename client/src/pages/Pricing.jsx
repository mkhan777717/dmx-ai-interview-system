import React, { useState } from 'react'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

function Pricing() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('free')

  const plans = [
    {
      id: 'free',
      name: 'Community',
      price: 'Free',
      credits: 'Unlimited',
      description: 'Ideal for candidates preparing for upcoming technical interviews.',
      features: [
        'AI Interview Voice & Avatar Room',
        'Standard Technical & Behavioral Questions',
        'Dynamic Question Generation & Real-Time Hints',
        'Instant Detailed Performance Scorecard',
      ],
      default: true,
    },
    {
      id: 'pro',
      name: 'Pro Candidate',
      price: 'Free in Beta',
      credits: 'Unlimited',
      description: 'Full access to all personas, system design, and coding rounds.',
      features: [
        'All 3 AI Avatars (Alex, Sophia, Marcus)',
        'Monaco DSA & System Design Code Editor',
        'Groq Whisper Fast STT & Natural Voice TTS',
        'Peer Percentile Benchmarking',
      ],
      badge: 'Popular',
    },
    {
      id: 'enterprise',
      name: 'Enterprise & Teams',
      price: 'Custom',
      credits: 'Unlimited',
      description: 'For recruiters and organizations conducting high-volume candidate evaluations.',
      features: [
        'Custom Job Description & Rubric Builder',
        'Recruiter & Candidate Assessment Dashboard',
        'Candidate Integrity & Anti-Cheat Audit Logs',
        'Role-Based Access Control (RBAC)',
      ],
      badge: 'Teams',
    },
  ]

  const handleSelect = (plan) => {
    setSelectedPlan(plan.id)
    navigate('/v2/interview')
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900 py-12 px-6 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition cursor-pointer"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto text-center mb-14">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, Transparent Plans
        </h1>
        <p className="mt-3 text-sm text-gray-500 max-w-lg mx-auto">
          Practice technical, behavioral, and system design interviews with lifelike AI avatars.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-8 transition-all border ${
                isSelected
                  ? 'border-emerald-500 shadow-xl bg-white ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white shadow-xs'
              } cursor-pointer`}
            >
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                  Free
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {plan.price}
                </span>
                <p className="text-gray-500 text-xs font-semibold mt-1">
                  {plan.credits} Practice Sessions
                </p>
              </div>

              <p className="text-gray-600 text-xs mt-3 leading-relaxed">
                {plan.description}
              </p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
                    <span className="text-gray-700 text-xs font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(plan)
                }}
                className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                Start Practice Now
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Pricing
