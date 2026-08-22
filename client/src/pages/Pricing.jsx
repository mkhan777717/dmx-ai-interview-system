import React, { useState } from 'react'
import { FaArrowLeft, FaCheck } from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import Navbar from '../components/Navbar'
import Badge from '../components/ui/Badge'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import SectionReveal from '../components/ui/SectionReveal'

function Pricing() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      id: 'community',
      name: 'Community Starter',
      price: '$0',
      period: 'Forever free',
      description: 'Essential AI interview practice for students and early-career engineers.',
      features: [
        'Standard Technical & Behavioral rounds',
        'Real-time speech transcription & hints',
        'Instant AI feedback & correctness scoring',
        'Unlimited community practice runs',
      ],
      cta: 'Start Free Practice',
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'Pro Career Suite',
      price: billingCycle === 'monthly' ? '$29' : '$19',
      period: 'per month, billed annually',
      description: 'Advanced role calibration, system design IDE, and full persona selection.',
      features: [
        'All 3 AI Avatars (Alex, Sophia, Marcus)',
        'Monaco DSA & Architecture Live Code IDE',
        'Groq Whisper Low-Latency Audio Streaming',
        'Peer Percentile Ranking vs Real Candidates',
        'Personalized 4-Week Skill Gap Roadmap',
      ],
      cta: 'Unlock Pro Studio',
      isPopular: true,
      badge: 'Most Popular',
    },
    {
      id: 'enterprise',
      name: 'Enterprise & Teams',
      price: 'Custom',
      period: 'For hiring teams & bootcamps',
      description: 'High-volume screening pipeline, rubric authoring, and candidate audit logs.',
      features: [
        'Custom Job Description & Rubric Builder',
        'Recruiter Assessment Link Generation',
        'Anti-Cheat & Tab Integrity Telemetry',
        'Multi-Seat RBAC & ATS Integration',
        'Dedicated Enterprise SLA & Support',
      ],
      cta: 'Contact Sales',
      isPopular: false,
    },
  ]

  const handleSelect = (planId) => {
    navigate('/v2/interview')
  }

  return (
    <div className="min-h-screen bg-[#050811] text-[#f8fafc] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden dark-canvas selection:bg-cyan-500/25 selection:text-cyan-300">
      
      {/* Background ambient drifting blobs */}
      <div className="ambient-blob bg-cyan-500/12 w-[600px] h-[600px] -top-32 left-1/4" />
      <div className="ambient-blob bg-indigo-500/10 w-[550px] h-[550px] bottom-10 right-1/4" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />

      {/* Navbar */}
      <Navbar />

      <main className="pt-36 pb-24 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <SectionReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="cyan" icon={BsStars} className="mb-4">
              Transparent Career Investment
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-['Outfit']">
              Predictable Pricing, <span className="font-calligraphy italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Zero Surprises</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
              Level up your interview performance with calibrated AI simulation. Choose the plan tailored to your career milestones.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-emerald-500/30">
                  Save 35%
                </span>
              </button>
            </div>
          </div>
        </SectionReveal>

        {/* 3-Tier Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => {
            const isMiddle = plan.isPopular

            return (
              <SectionReveal key={plan.id} delay={idx * 0.1} className="flex">
                <div
                  className={`w-full rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                    isMiddle
                      ? 'bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-cyan-500 shadow-[0_20px_70px_-10px_rgba(6,182,212,0.3)] lg:-translate-y-3'
                      : 'glass-card-static border border-white/8 bg-slate-950/60'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30 uppercase tracking-widest font-mono text-[10px]">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white font-['Outfit'] mb-2">{plan.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-white/8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
                          {plan.price}
                        </span>
                        {plan.price !== 'Custom' && (
                          <span className="text-xs text-slate-400 font-semibold">/ mo</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">{plan.period}</p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3.5 mb-8">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Included Capabilities</p>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed font-medium">
                          <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${isMiddle ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-slate-300'}`}>
                            <FaCheck size={9} />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div>
                    {isMiddle ? (
                      <GradientButton
                        onClick={() => handleSelect(plan.id)}
                        className="w-full"
                        size="md"
                      >
                        {plan.cta}
                      </GradientButton>
                    ) : (
                      <SecondaryButton
                        onClick={() => handleSelect(plan.id)}
                        className="w-full"
                        size="md"
                      >
                        {plan.cta}
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              </SectionReveal>
            )
          })}
        </div>

        {/* Bottom Guarantee */}
        <div className="mt-16 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300">
            <BsStars className="text-cyan-400" /> Instant Access
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            🔒 256-Bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            🔄 Cancel Anytime Without Penalty
          </span>
        </div>
      </main>
    </div>
  )
}

export default Pricing
