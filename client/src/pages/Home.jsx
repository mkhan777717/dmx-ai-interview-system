import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HiArrowUpRight, HiCheck, HiXMark } from 'react-icons/hi2'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StepTimeline from '../components/ui/StepTimeline'
import Accordion from '../components/ui/Accordion'
import SectionReveal from '../components/ui/SectionReveal'
import BrowserMockup from '../components/ui/BrowserMockup'

export default function Home() {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  const handleStart = () => {
    if (userData) {
      navigate('/v2/interview')
    } else {
      navigate('/auth')
    }
  }

  const workflowSteps = [
    {
      num: '01',
      title: 'Upload Profile & Resume',
      desc: 'Parse your PDF resume or paste target job descriptions. Semantic vectors extract your tech stacks and project history.',
      bullets: ['Automated PDF Parsing', 'Target Role Calibration', 'Custom Tech Stack Matrix'],
    },
    {
      num: '02',
      title: 'AI Persona & Question Calibration',
      desc: 'Our engine generates adaptive coding, architecture, and behavioral prompts configured to your experience tier.',
      bullets: ['DSA & Algorithms', 'System Architecture', 'STAR Behavioral Framework'],
    },
    {
      num: '03',
      title: 'Live Interactive Avatar Session',
      desc: 'Converse with real-time video avatars with voice recognition, live Monaco code IDE, and follow-up prompts.',
      bullets: ['Low-Latency Voice Stream', 'Live Monaco Code IDE', 'Contextual Follow-Up Qs'],
    },
    {
      num: '04',
      title: 'Rubric Scorecard & Study Plan',
      desc: 'Receive deep feedback across technical depth, communication pacing, and a personalized 4-week study plan.',
      bullets: ['Multi-Dimensional Scores', 'Speech WPM & Confidence', 'Actionable Study Roadmap'],
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
      className="min-h-screen relative font-body transition-colors duration-150"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <Navbar />

      <main className="pt-32 pb-20 relative z-10 space-y-24 sm:space-y-32">

        {/* ── HERO SECTION (Matching Eduvantix Image 2 & 3) ────────────────── */}
        <section className="px-6 max-w-6xl mx-auto pt-6 sm:pt-12">
          <SectionReveal>
            {/* Clean Eyebrow Text (NO capsule pill) */}
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>
              AI CAREER PLATFORM
            </p>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-extrabold tracking-tight leading-[1.03] max-w-4xl text-left font-display" style={{ color: 'var(--text-primary)' }}>
              From Learning<br />to Getting Hired.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl text-left mt-6 mb-8 font-normal" style={{ color: 'var(--text-secondary)' }}>
              InterviewIQ is an AI-powered career platform that takes you from zero to hired. Personalized roadmaps, real projects, AI mentorship, and direct employer connections — all in one place.
            </p>

            {/* Clean Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-20">
              <button
                onClick={handleStart}
                className="btn-primary rounded-full px-6 py-3.5 text-sm font-semibold cursor-pointer shadow-sm"
              >
                Start Learning Free →
              </button>

              <button
                onClick={() => navigate('/pricing')}
                className="btn-secondary rounded-2xl px-6 py-3.5 text-sm font-semibold cursor-pointer"
              >
                Book a Demo
              </button>
            </div>

            {/* Clean Stats Row (Direct Flat Row with Divider, NO Tablets) */}
            <div className="pt-10 border-t grid grid-cols-2 sm:grid-cols-4 gap-8 text-left" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>10,000+</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Active Students</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>500+</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Partner Institutes</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>100+</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Hiring Partners</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>94%</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Placement Rate</p>
              </div>
            </div>
          </SectionReveal>

          {/* ── BROWSER DASHBOARD PREVIEW ─────────────────────────────────── */}
          <SectionReveal delay={0.2} className="mt-20">
            <BrowserMockup>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* Left Live Avatar Mock */}
                <div
                  className="lg:col-span-7 rounded-2xl border p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                      Live AI Interviewer
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>01:45 / 03:00</span>
                  </div>

                  <div className="my-auto py-6 text-left">
                    <h4 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Sophia — Technical Lead Interviewer</h4>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      "Could you walk me through how you would architect cache invalidation across distributed database replicas?"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                      Mic Active (Echo-Cancelled)
                    </span>
                    <span className="font-mono text-[11px]">WebRTC 60 FPS</span>
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
                    <p className="text-[11px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>
                      Real-Time Telemetry
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
                          <span className="font-bold font-display" style={{ color: 'var(--accent)' }}>Optimal</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full w-[88%]" style={{ backgroundColor: 'var(--accent)' }} />
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
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>Tests Passing</span>
                    </div>
                  </div>
                </div>

              </div>
            </BrowserMockup>
          </SectionReveal>
        </section>

        {/* ── 4-STAGE STRUCTURED TIMELINE ─────────────────────────────────── */}
        <section id="stages" className="px-6 max-w-6xl mx-auto scroll-mt-28 sm:scroll-mt-32">
          <SectionReveal>
            <div className="text-left max-w-3xl mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
                HOW IT WORKS
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Structured 4-Stage Interview Process.
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A seamless workflow that moves candidates from raw resume upload to offer-ready confidence.
              </p>
            </div>

            <StepTimeline steps={workflowSteps} />
          </SectionReveal>
        </section>

        {/* ── TRADITIONAL VS INTERVIEWIQ COMPARISON ────────────────────────── */}
        <section id="features" className="px-6 max-w-6xl mx-auto scroll-mt-28 sm:scroll-mt-32">
          <SectionReveal>
            <div className="text-left max-w-3xl mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
                THE COMPETITIVE EDGE
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Traditional Prep vs. InterviewIQ.
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Why static question flashcards fail and dynamic conversational AI delivers results.
              </p>
            </div>

            <div
              className="rounded-3xl border overflow-hidden shadow-sm"
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
                <div className="md:col-span-5" style={{ color: 'var(--accent)' }}>InterviewIQ Platform</div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {comparisonItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 p-5 gap-4 items-center text-sm transition-colors hover:opacity-90">
                    <div className="md:col-span-3 font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                      {item.feature}
                    </div>
                    <div className="md:col-span-4 flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <HiXMark className="text-rose-500 shrink-0 mt-0.5" size={16} />
                      <span>{item.traditional}</span>
                    </div>
                    <div className="md:col-span-5 flex items-start gap-2 text-xs font-semibold leading-relaxed" style={{ color: 'var(--accent)' }}>
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
        <section id="faq" className="px-6 max-w-4xl mx-auto scroll-mt-28 sm:scroll-mt-32">
          <SectionReveal>
            <div className="text-left mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
                FAQ
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                Frequently Asked Questions.
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Everything you need to know about the AI interview platform.
              </p>
            </div>

            <Accordion items={faqItems} />
          </SectionReveal>
        </section>

        {/* ── BOTTOM CTA BANNER ───────────────────────────────────────────── */}
        <section className="px-6 max-w-6xl mx-auto pb-16">
          <SectionReveal>
            <div
              className="rounded-3xl border p-8 sm:p-14 text-left relative overflow-hidden shadow-sm"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="max-w-2xl space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                  GET STARTED TODAY
                </p>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                  Ready to Ace Your Next Interview?
                </h2>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Join thousands of candidates who practice daily with our conversational AI avatars and step into real interviews fully prepared.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button onClick={handleStart} className="btn-primary rounded-full px-6 py-3.5 text-sm font-semibold cursor-pointer">
                    Start Learning Free →
                  </button>
                  <button onClick={() => navigate('/pricing')} className="btn-secondary rounded-2xl px-6 py-3.5 text-sm font-semibold cursor-pointer">
                    Book a Demo
                  </button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
