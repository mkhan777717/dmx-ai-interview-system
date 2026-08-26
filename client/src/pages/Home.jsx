import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from '../components/Navbar'
import AuthModel from '../components/AuthModel'
import SectionReveal from '../components/ui/SectionReveal'
import StatCounter from '../components/ui/StatCounter'
import BrowserMockup from '../components/ui/BrowserMockup'
import StepTimeline from '../components/ui/StepTimeline'
import Accordion from '../components/ui/Accordion'
import GradientButton from '../components/ui/GradientButton'
import SecondaryButton from '../components/ui/SecondaryButton'
import Badge from '../components/ui/Badge'
import Eyebrow from '../components/ui/Eyebrow'
import {
  BsStars, BsPlayFill, BsLightningChargeFill,
} from 'react-icons/bs'
import { HiArrowUpRight, HiCheck, HiXMark } from 'react-icons/hi2'

export default function Home() {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)

  const handleStart = () => {
    if (userData) {
      navigate('/v2/interview')
    } else {
      setShowAuth(true)
    }
  }

  const workflowSteps = [
    {
      title: 'Resume & Context Parsing',
      shortDesc: 'Instant skill vectorization',
      heading: 'Deep Profile & Context Extraction',
      description: 'Upload your PDF resume or paste a target Job Description. Our semantic engine vectorizes your technical skills, seniority tiers, and role expectations in under 3 seconds.',
      bullets: ['Semantic Vector Skill Matching', 'Job Description Keyword Alignment', 'Experience Tier Calibration', 'Instant Profile Matrix'],
      codeSnippet: `> resume_engine.parse("alex_resume.pdf")\n✓ Detected Role: Senior Backend Engineer\n✓ Top Skills: Python, FastAPI, Distributed Systems, Redis\n✓ Experience Tier: Senior (6+ Years)`,
    },
    {
      title: 'Role-Adaptive Engine',
      shortDesc: 'Dynamically calibrated prompts',
      heading: 'Custom Questions Tailored to Your Stack',
      description: 'Generates calibrated DSA, System Design, and STAR behavioral questions matched to your exact background, preventing generic interview questions.',
      bullets: ['DSA Coding with Monaco IDE', 'System Design Scalability Rounds', 'Behavioral STAR Frameworks', 'Real-Time Hint Generator'],
      codeSnippet: `> question_engine.generate(role="Full-Stack", mode="Technical")\n✓ Question: "Design an idempotent webhook dispatcher with dead-letter queue."\n✓ Estimated Time: 3 mins | Difficulty: Hard`,
    },
    {
      title: 'Live Avatar Interview',
      shortDesc: 'Voice, video & live code',
      heading: 'Real-Time Conversational AI Avatar',
      description: 'Engage with photorealistic AI avatar interviewers powered by high-speed speech-to-text, low-latency LLMs, and natural audio synthesis with echo-cancellation.',
      bullets: ['Cloud Video Stream & Lip-Sync', 'Ultra-fast Groq Whisper Transcription', 'Interactive Live Coding Editor', 'Anti-Cheat Tab Integrity Auditing'],
      codeSnippet: `> livekit_session.connect(room="interview_iq_v2")\n✓ WebRTC Stream Active: 60 FPS\n✓ Audio Engine: Whisper STT (280ms latency)\n✓ AI Interviewer: Speaking...`,
    },
    {
      title: 'Rubric Scorecard',
      shortDesc: 'Granular AI feedback',
      heading: 'Instant Scorecard & Coaching Plan',
      description: 'Get deep breakdowns across correctness, technical depth, communication pacing (WPM), confidence index, and personalized improvement roadmap.',
      bullets: ['Per-Question Strengths & Gaps', 'Speech Pacing & Confidence Index', 'Percentile Ranking vs Peers', 'Personalized Resource Roadmap'],
      codeSnippet: `> evaluation_engine.finish(interview_id=4021)\n✓ Overall Score: 8.8 / 10 (Top 8% for Role)\n✓ Technical: 9.1 | Delivery: 8.5 | Correctness: 8.9\n✓ Generated 4-week personalized study roadmap.`,
    },
  ]

  const comparisonItems = [
    {
      feature: 'Question Generation',
      traditional: 'Static generic question lists or memorized flashcards',
      interviewIQ: 'Role-adaptive dynamic generation matching your resume & JD',
    },
    {
      feature: 'Interviewer Experience',
      traditional: 'Solo reading of text prompts with no speech feedback',
      interviewIQ: 'Live interactive conversational avatar with voice & audio playback',
    },
    {
      feature: 'Coding & Architecture',
      traditional: 'Pen & paper or disconnected local scratchpads',
      interviewIQ: 'Built-in Monaco IDE with multi-language code & system design modes',
    },
    {
      feature: 'Evaluation & Coaching',
      traditional: 'Vague self-assessment or expensive $250/hr human mock services',
      interviewIQ: 'Instant scoring across technical depth, WPM pacing, and confidence',
    },
    {
      feature: 'Integrity & Benchmarking',
      traditional: 'No peer comparison or performance analytics',
      interviewIQ: 'Role percentile rankings, progression analytics, and recruiter sharing',
    },
  ]

  const faqItems = [
    {
      question: 'How does InterviewIQ personalize questions to my profile?',
      answer: 'When you upload your resume or paste a target Job Description, InterviewIQ parses your technical skills, projects, and career level. It feeds these semantic vectors into our question generation engine to construct calibrated DSA, architecture, and behavioral prompts tailored precisely to your background.',
    },
    {
      question: 'Can I choose specific interview formats like DSA, System Design, or Behavioral?',
      answer: 'Yes! InterviewIQ supports specialized modes including Data Structures & Algorithms (with an integrated live Monaco code editor), Distributed System Design, and Behavioral rounds following the STAR methodology.',
    },
    {
      question: 'How realistic is the AI avatar conversation?',
      answer: 'Our AI avatars feature ultra-low latency speech-to-text, context-aware reasoning, and high-fidelity video stream lip-sync, creating a lifelike conversational environment that simulates real-world hiring loops.',
    },
    {
      question: 'How does the scoring rubric work?',
      answer: 'Your performance is assessed across technical accuracy, architectural depth, clarity, speech pacing (WPM), and problem decomposition. You receive an instant comprehensive scorecard with line-by-line feedback.',
    },
  ]

  return (
    <div
      className="min-h-screen relative overflow-hidden dark-canvas font-body transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background ambient lighting */}
      <div className="ambient-blob bg-[var(--accent)]/12 w-[650px] h-[650px] -top-40 left-1/2 -translate-x-1/2" />
      <div className="ambient-blob bg-[var(--toggle-knob)]/10 w-[550px] h-[550px] top-1/3 left-[-10%]" />
      <div className="ambient-blob bg-[var(--accent)]/10 w-[550px] h-[550px] top-2/3 right-[-10%]" />

      {/* Grid texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <Navbar />

      <main className="pt-32 relative z-10 space-y-28 lg:space-y-36">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto text-center">
          <SectionReveal>
            {/* Top Pill Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-8 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <span
                className="px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-widest uppercase shadow-xs"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text-on)',
                }}
              >
                AI Studio 2.0
              </span>
              <span className="font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Next-Gen Real-Time Avatar Interviewer
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[74px] font-extrabold leading-[1.06] tracking-tight max-w-5xl mx-auto mb-8 font-display" style={{ color: 'var(--text-primary)' }}>
              Master Technical Screens with{' '}
              <span className="text-[var(--accent)] font-bold">
                Real-Time AI
              </span>{' '}
              Avatar Interviewers
            </h1>

            {/* Sub-heading */}
            <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10 font-normal" style={{ color: 'var(--text-secondary)' }}>
              Role-calibrated algorithmic rounds, photorealistic voice synthesis, and instant rubric diagnostics tailored for elite engineering candidates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
              <GradientButton
                onClick={handleStart}
                size="lg"
                iconRight={HiArrowUpRight}
              >
                Start Practice Free
              </GradientButton>

              <SecondaryButton
                onClick={() => {
                  const el = document.getElementById('stages')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                size="lg"
                icon={BsPlayFill}
              >
                Explore How It Works
              </SecondaryButton>
            </div>

            {/* Social Proof Stack */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex -space-x-2.5 overflow-hidden">
                {['alex', 'sarah', 'michael', 'elena'].map((name, i) => (
                  <img
                    key={name}
                    src={`https://ui-avatars.com/api/?name=${name}&background=${['4e9c6e','7c6fea','3b82f6','10b981'][i]}&color=ffffff&size=64`}
                    alt="User"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--bg-page)] object-cover"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-amber-500 mb-0.5 text-xs">
                  {'★'.repeat(5)}
                  <span className="font-bold ml-1 font-display" style={{ color: 'var(--text-primary)' }}>4.9 / 5 Rating</span>
                </div>
                <p className="text-[11px] font-normal tracking-wide" style={{ color: 'var(--text-muted)' }}>Over 10,000+ candidates screened & prepared</p>
              </div>
            </div>
          </SectionReveal>

          {/* ── BROWSER DASHBOARD PREVIEW ─────────────────────────────────── */}
          <SectionReveal delay={0.2} className="mt-16 max-w-6xl mx-auto">
            <BrowserMockup url="app.interviewiq.ai/v2/interview-studio">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* Left Live Avatar Mock */}
                <div
                  className="lg:col-span-7 rounded-2xl border p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px]"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between z-10">
                    <span
                      className="px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 tracking-wide uppercase text-[10px]"
                      style={{
                        backgroundColor: 'rgba(78, 156, 110, 0.12)',
                        borderColor: 'rgba(78, 156, 110, 0.3)',
                        color: 'var(--accent)',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent)' }} />
                      Live AI Interviewer
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>01:45 / 03:00</span>
                  </div>

                  <div className="my-auto py-8 text-center relative z-10">
                    <div
                      className="w-20 h-20 mx-auto rounded-3xl p-0.5 shadow-md mb-4"
                      style={{
                        backgroundColor: 'rgba(78, 156, 110, 0.25)',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-[22px] flex items-center justify-center border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border)',
                          color: 'var(--accent)',
                        }}
                      >
                        <BsStars size={36} />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Sophia — Lead AI Interviewer</h4>
                    <p className="text-xs mt-2 max-w-md mx-auto italic font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      "Could you walk me through how you would architect cache invalidation across distributed database replicas?"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t text-xs z-10" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mic Active (Echo-Cancelled)
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>WebRTC 60 FPS</span>
                  </div>
                </div>

                {/* Right Metrics & Code IDE Mock */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div
                    className="rounded-2xl border p-5 space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-muted)' }}>
                      Real-Time Evaluation Telemetry
                    </p>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span style={{ color: 'var(--text-secondary)' }}>Technical Correctness</span>
                          <span className="font-bold font-display" style={{ color: 'var(--accent)' }}>92%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full w-[92%]" style={{ backgroundColor: 'var(--accent)' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span style={{ color: 'var(--text-secondary)' }}>Speech Pacing (142 WPM)</span>
                          <span className="font-bold font-display text-emerald-600 dark:text-emerald-400">Optimal</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                          <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4 font-mono text-xs flex-1 flex flex-col justify-between"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <span>solution.py</span>
                      <span style={{ color: 'var(--accent)' }}>Python 3.13</span>
                    </div>
                    <p className="leading-relaxed py-2 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      def invalidate_cache(key: str) -&gt; bool:<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;redis_client.delete(key)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;publish_event("cache:evict", key)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;return True
                    </p>
                    <div className="pt-2 border-t flex justify-between items-center text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <span>✓ Syntax Verified</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Tests Passing</span>
                    </div>
                  </div>
                </div>

              </div>
            </BrowserMockup>
          </SectionReveal>
        </section>

        {/* ── STAT COUNTERS ───────────────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto">
          <SectionReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCounter
                value={10000}
                suffix="+"
                label="Interviews Completed"
                subtitle="Across 40+ countries"
              />
              <StatCounter
                value={94.8}
                suffix="%"
                decimals={1}
                label="Offer Conversion Rate"
                subtitle="Within 60 days of prep"
              />
              <StatCounter
                value={350}
                suffix="+"
                label="Calibrated Tech Roles"
                subtitle="DSA, Full-Stack, ML, DevOps"
              />
              <StatCounter
                value={4.9}
                suffix="★"
                decimals={1}
                label="Candidate Satisfaction"
                subtitle="Verified user scorecards"
              />
            </div>
          </SectionReveal>
        </section>

        {/* ── HOW IT WORKS / 4-STAGE INTERACTIVE TIMELINE ──────────────────── */}
        <section id="stages" className="px-6 max-w-7xl mx-auto scroll-mt-28">
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <Eyebrow icon={BsLightningChargeFill} className="mb-3">
                Structured Workflow
              </Eyebrow>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Engineering Your <span className="text-[var(--accent)] font-semibold">Offer-Ready</span> Confidence
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A seamless 4-stage engine that moves you from raw resume to peak interview readiness.
              </p>
            </div>

            <StepTimeline steps={workflowSteps} />
          </SectionReveal>
        </section>

        {/* ── TRADITIONAL VS INTERVIEWIQ COMPARISON ────────────────────────── */}
        <section id="features" className="px-6 max-w-7xl mx-auto">
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <Eyebrow icon={BsStars} className="mb-3">
                The Competitive Edge
              </Eyebrow>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Traditional Prep vs. <span className="text-[var(--accent)] font-semibold">InterviewIQ</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Why static question banks fail and dynamic conversational AI delivers results.
              </p>
            </div>

            <div
              className="rounded-3xl border overflow-hidden shadow-xl"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="grid grid-cols-1 md:grid-cols-12 border-b p-5 font-display font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <div className="md:col-span-3">Assessment Pillar</div>
                <div className="md:col-span-4 text-rose-500">Traditional Mock Prep</div>
                <div className="md:col-span-5" style={{ color: 'var(--accent)' }}>InterviewIQ Studio</div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {comparisonItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 p-5 gap-4 items-center text-sm transition-colors hover:opacity-90">
                    <div className="md:col-span-3 font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                      {item.feature}
                    </div>
                    <div className="md:col-span-4 flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <HiXMark className="text-rose-500 shrink-0 mt-0.5" size={16} />
                      <span>{item.traditional}</span>
                    </div>
                    <div
                      className="md:col-span-5 flex items-start gap-2.5 text-xs font-semibold leading-relaxed p-3 rounded-2xl border"
                      style={{
                        backgroundColor: 'rgba(78, 156, 110, 0.08)',
                        borderColor: 'rgba(78, 156, 110, 0.2)',
                        color: 'var(--accent)',
                      }}
                    >
                      <HiCheck className="shrink-0 mt-0.5" size={16} />
                      <span>{item.interviewIQ}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* ── FAQ SECTION ─────────────────────────────────────────────────── */}
        <section id="faq" className="px-6 max-w-4xl mx-auto">
          <SectionReveal>
            <div className="text-center mb-12">
              <Eyebrow className="mb-3">FAQ</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Answers to <span className="text-[var(--accent)] font-semibold">Common Questions</span>
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Everything you need to know about the AI interview engine.
              </p>
            </div>

            <Accordion items={faqItems} />
          </SectionReveal>
        </section>

        {/* ── BOTTOM CTA BANNER ───────────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto pb-24">
          <SectionReveal>
            <div
              className="rounded-3xl border p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15" style={{ backgroundColor: 'var(--accent)' }} />
              
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <Badge variant="accent" icon={BsStars}>Get Started Today</Badge>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                  Ready to <span className="text-[var(--accent)] font-semibold">Ace</span> Your Next Interview?
                </h2>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Join thousands of candidates who practice daily with our conversational AI avatars and step into real interviews fully prepared.
                </p>

                <div className="pt-2 flex flex-wrap justify-center gap-4">
                  <GradientButton onClick={handleStart} size="lg" iconRight={HiArrowUpRight}>
                    Launch Free Session
                  </GradientButton>
                  <SecondaryButton onClick={() => navigate('/pricing')} size="lg">
                    View Plan Tiers
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-12 text-xs relative z-10 transition-colors" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: 'var(--accent)' }}>
              <BsStars />
            </div>
            <span className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
              Interview<span className="text-[var(--accent)] font-semibold">IQ</span>.AI
            </span>
          </div>
          <p>© {new Date().getFullYear()} InterviewIQ. All rights reserved. Universal AI Interview Studio.</p>
          <div className="flex gap-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
            <a href="#" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--accent)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--accent)] transition-colors">Security</a>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
