import React, { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SectionReveal from '../components/ui/SectionReveal'

export default function Pricing() {
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

  const handleSelect = () => {
    navigate('/v2/interview')
  }

  return (
    <div
      className="min-h-screen font-body relative transition-colors duration-150"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Navbar */}
      <Navbar />

      <main className="pt-36 pb-24 px-6 max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Header */}
        <SectionReveal>
          <div className="text-left max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
              TRANSPARENT PRICING
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
              Predictable Pricing, Zero Surprises.
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Level up your interview performance with calibrated AI simulation. Choose the plan tailored to your career milestones.
            </p>

            {/* Monthly / Annual Toggle */}
            <div
              className="mt-8 inline-flex items-center p-1 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: billingCycle === 'monthly' ? 'var(--accent)' : 'transparent',
                  color: billingCycle === 'monthly' ? 'var(--accent-text-on)' : 'var(--text-secondary)',
                }}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: billingCycle === 'annual' ? 'var(--accent)' : 'transparent',
                  color: billingCycle === 'annual' ? 'var(--accent-text-on)' : 'var(--text-secondary)',
                }}
              >
                <span>Annual Billing</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: billingCycle === 'annual' ? 'rgba(255,255,255,0.2)' : 'rgba(78, 156, 110, 0.15)',
                    color: billingCycle === 'annual' ? '#ffffff' : 'var(--accent)',
                  }}
                >
                  Save 35%
                </span>
              </button>
            </div>
          </div>
        </SectionReveal>

        {/* 3-Tier Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => {
            const isMiddle = plan.isPopular

            return (
              <SectionReveal key={plan.id} delay={idx * 0.1} className="flex">
                <div
                  className="w-full rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-200 border shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: isMiddle ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 right-8">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-display shadow-sm"
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

                    {/* Feature List */}
                    <div className="space-y-3.5 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>
                        Included Features
                      </p>
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2.5 text-xs">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: 'rgba(78, 156, 110, 0.15)',
                              color: 'var(--accent)',
                            }}
                          >
                            <FaCheck size={9} />
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleSelect}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition cursor-pointer shadow-sm ${
                      isMiddle ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </SectionReveal>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
