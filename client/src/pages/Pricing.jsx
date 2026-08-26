import React, { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { BsStars } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
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
    <div
      className="min-h-screen font-body relative overflow-hidden dark-canvas transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background ambient drifting blobs */}
      <div className="ambient-blob bg-[var(--accent)]/12 w-[600px] h-[600px] -top-32 left-1/4" />
      <div className="ambient-blob bg-[var(--toggle-knob)]/10 w-[550px] h-[550px] bottom-10 right-1/4" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />

      {/* Navbar */}
      <Navbar />

      <main className="pt-36 pb-24 px-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <SectionReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="accent" icon={BsStars} className="mb-4">
              Transparent Career Investment
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
              Predictable Pricing, <span className="text-[var(--accent)] font-semibold">Zero Surprises</span>
            </h1>
            <p className="mt-4 text-base max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Level up your interview performance with calibrated AI simulation. Choose the plan tailored to your career milestones.
            </p>

            {/* Monthly / Annual Toggle */}
            <div
              className="mt-8 inline-flex items-center p-1.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'btn-primary shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  color: billingCycle === 'monthly' ? 'var(--accent-text-on)' : 'var(--text-secondary)',
                }}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'btn-primary shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  color: billingCycle === 'annual' ? 'var(--accent-text-on)' : 'var(--text-secondary)',
                }}
              >
                <span>Annual Billing</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: 'rgba(78, 156, 110, 0.15)',
                    borderColor: 'rgba(78, 156, 110, 0.3)',
                    color: 'var(--accent)',
                  }}
                >
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
                  className={`w-full rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 border shadow-lg ${
                    isMiddle ? 'lg:-translate-y-3' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: isMiddle ? 'var(--accent)' : 'var(--border)',
                    boxShadow: isMiddle ? '0 20px 60px -10px rgba(78, 156, 110, 0.25)' : undefined,
                  }}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="px-4 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-widest font-display text-[10px]"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text-on)',
                        }}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {plan.price}
                        </span>
                        {plan.price !== 'Custom' && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>/ mo</span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{plan.period}</p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3.5 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>Included Capabilities</p>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
                          <div
                            className="p-0.5 rounded-full shrink-0 mt-0.5"
                            style={{
                              backgroundColor: 'rgba(78, 156, 110, 0.15)',
                              color: 'var(--accent)',
                            }}
                          >
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
        <div className="mt-16 text-center text-xs flex flex-wrap items-center justify-center gap-6 font-medium" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <BsStars style={{ color: 'var(--accent)' }} /> Instant Access
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            🔒 256-Bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            🔄 Cancel Anytime Without Penalty
          </span>
        </div>
      </main>
    </div>
  )
}

export default Pricing
