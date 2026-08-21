import React, { useState } from 'react'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

function Pricing() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('pro')

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
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden mesh-gradient-canvas">
      {/* Background ambient orbs */}
      <div className="ambient-glow bg-emerald-400/25 w-[500px] h-[500px] -top-20 left-1/4" />
      <div className="ambient-glow bg-indigo-400/20 w-[450px] h-[450px] bottom-10 right-1/4" />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer glass-pill px-4 py-2 rounded-full"
        >
          <FaArrowLeft size={11} /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto text-center mb-14 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-teal-900 mb-4 shadow-2xs">
          <BsStars className="text-emerald-600" /> Flexible Career Prep Tiers
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-5xl font-['Outfit'] tracking-tight">
          Simple, Transparent Plans
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Practice technical, behavioral, and system design interviews with lifelike AI avatars.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -6 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-8 transition-all duration-300 border ${
                isSelected
                  ? 'border-emerald-500/50 shadow-2xl bg-white/90 backdrop-blur-xl ring-2 ring-emerald-500/30'
                  : 'glass-card-static border-white/80'
              } cursor-pointer flex flex-col justify-between`}
            >
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-gradient-to-r from-teal-700 to-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute top-6 right-6 glass-pill text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full">
                  Free
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">{plan.name}</h3>

                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-teal-900 font-['Outfit']">
                    {plan.price}
                  </span>
                  <p className="text-slate-500 text-xs font-semibold mt-1">
                    {plan.credits} Practice Sessions
                  </p>
                </div>

                <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                  {plan.description}
                </p>

                <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <FaCheckCircle className="text-emerald-600 text-xs shrink-0" />
                      <span className="text-slate-700 text-xs font-semibold">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(plan)
                }}
                className={`w-full mt-8 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-xs ${
                  isSelected
                    ? 'glass-btn-primary'
                    : 'glass-btn-secondary'
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
