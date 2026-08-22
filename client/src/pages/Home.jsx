import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
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
import {
  BsStars, BsPlayFill, BsCheck2Circle, BsLightningChargeFill,
  BsShieldCheck, BsGraphUpArrow, BsArrowRight
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
      question: 'Do I need a webcam and microphone?',
      answer: 'A microphone is recommended to practice spoken responses with Whisper transcription. The avatar video interviewer streams directly in your browser. If you prefer typing, you can also write your answers directly in text or through the integrated Monaco code editor.',
    },
    {
      question: 'Can recruiters and hiring teams use InterviewIQ for candidate screening?',
      answer: 'Yes! InterviewIQ includes a full Recruiter Screening Pipeline. Hiring managers can create custom assessment links, define target rubrics, invite candidates, and review standardized scoring reports with full audit logs and anti-cheat telemetry.',
    },
    {
      question: 'What types of interview modes are supported?',
      answer: 'InterviewIQ natively supports Technical (Coding & DSA), System Design (Architecture & Scalability), HR & Behavioral (STAR framework), and Data Science / Machine Learning interview rounds.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#050811] text-[#f8fafc] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-cyan-500/25 selection:text-cyan-300 relative overflow-hidden dark-canvas">

      {/* Ambient background drifting blobs */}
      <div className="ambient-blob bg-cyan-500/12 w-[650px] h-[650px] -top-40 left-1/2 -translate-x-1/2" />
      <div className="ambient-blob bg-indigo-500/10 w-[550px] h-[550px] top-1/3 left-[-10%]" />
      <div className="ambient-blob bg-blue-500/10 w-[550px] h-[550px] top-2/3 right-[-10%]" />

      {/* Grid texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <Navbar />

      <main className="pt-32 relative z-10 space-y-28 lg:space-y-36">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto text-center">
          <SectionReveal>
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent border border-cyan-500/30 text-xs font-semibold mb-8 shadow-lg shadow-cyan-500/5">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[10px] tracking-widest uppercase shadow-xs">
                AI Studio 2.0
              </span>
              <span className="text-slate-300 font-medium tracking-wide">Next-Gen Real-Time Avatar Interviewer</span>
            </div>

            {/* Main Headline with Calligraphy Accent */}
            <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-extrabold text-white leading-[1.06] tracking-tight max-w-5xl mx-auto mb-8 font-['Outfit']">
              Master Technical Screens with{' '}
              <span className="font-calligraphy italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 pr-1.5 drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                Real-Time AI
              </span>{' '}
              Avatar Interviewers
            </h1>

            {/* Sub-heading */}
            <p className="text-lg sm:text-xl text-slate-300/90 leading-relaxed max-w-2xl mx-auto mb-10 font-normal tracking-[-0.01em]">
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
            <div className="flex items-center justify-center gap-4 text-xs text-slate-300 font-medium">
              <div className="flex -space-x-2.5 overflow-hidden">
                {['alex', 'sarah', 'michael', 'elena'].map((name, i) => (
                  <img
                    key={name}
                    src={`https://ui-avatars.com/api/?name=${name}&background=${['06b6d4','3b82f6','6366f1','0d9488'][i]}&color=050811&size=64`}
                    alt="User"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-amber-400 mb-0.5 text-xs">
                  {'★'.repeat(5)}
                  <span className="font-bold text-white ml-1 font-['Outfit']">4.9 / 5 Rating</span>
                </div>
                <p className="text-slate-400 text-[11px] font-normal tracking-wide">Over 10,000+ candidates screened & prepared</p>
              </div>
            </div>
          </SectionReveal>

          {/* ── BROWSER DASHBOARD PREVIEW ─────────────────────────────────── */}
          <SectionReveal delay={0.2} className="mt-16 max-w-6xl mx-auto">
            <BrowserMockup url="app.interviewiq.ai/v2/interview-studio">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* Left Live Avatar Mock */}
                <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-white/10 p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                  <div className="flex items-center justify-between z-10">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full border border-cyan-500/30 flex items-center gap-1.5 tracking-wide uppercase text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      Live AI Interviewer
                    </span>
                    <span className="text-xs text-slate-400 font-mono">01:45 / 03:00</span>
                  </div>

                  <div className="my-auto py-8 text-center relative z-10">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 mb-4">
                      <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-cyan-300">
                        <BsStars size={36} />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white font-['Outfit']">Sophia — Lead AI Interviewer</h4>
                    <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto italic font-['Plus_Jakarta_Sans'] font-medium leading-relaxed">
                      "Could you walk me through how you would architect cache invalidation across distributed database replicas?"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs z-10">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Mic Active (Echo-Cancelled)
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">WebRTC 60 FPS</span>
                  </div>
                </div>

                {/* Right Metrics & Code IDE Mock */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-slate-950/80 rounded-2xl border border-white/10 p-5 space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Real-Time Evaluation Telemetry</p>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-300">Technical Correctness</span>
                          <span className="text-cyan-400 font-bold font-['Outfit']">92%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-[92%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-300">Speech Pacing (142 WPM)</span>
                          <span className="text-emerald-400 font-bold font-['Outfit']">Optimal</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-2xl border border-white/10 p-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-slate-400">
                      <span>solution.py</span>
                      <span className="text-cyan-400">Python 3.13</span>
                    </div>
                    <p className="text-cyan-300/90 leading-relaxed py-2 font-mono text-[11px]">
                      def invalidate_cache(key: str) -&gt; bool:<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;redis_client.delete(key)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;publish_event("cache:evict", key)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;return True
                    </p>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
                      <span>✓ Syntax Verified</span>
                      <span className="text-emerald-400 font-bold">Tests Passing</span>
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
              <Badge variant="cyan" icon={BsLightningChargeFill} className="mb-4">
                Structured Workflow
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-['Outfit']">
                Engineering Your <span className="font-calligraphy italic font-normal text-cyan-400">Offer-Ready</span> Confidence
              </h2>
              <p className="mt-3 text-slate-400 text-base leading-relaxed">
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
              <Badge variant="indigo" icon={BsStars} className="mb-4">
                The Competitive Edge
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-['Outfit']">
                Traditional Prep vs. <span className="font-calligraphy italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">InterviewIQ</span>
              </h2>
              <p className="mt-3 text-slate-400 text-base leading-relaxed">
                Why static question banks fail and dynamic conversational AI delivers results.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10 bg-slate-900/60 p-5 font-['Outfit'] font-bold text-xs uppercase tracking-widest text-slate-400 font-mono">
                <div className="md:col-span-3">Assessment Pillar</div>
                <div className="md:col-span-4 text-rose-400/90">Traditional Mock Prep</div>
                <div className="md:col-span-5 text-cyan-300">InterviewIQ Studio</div>
              </div>

              <div className="divide-y divide-white/5">
                {comparisonItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 p-5 gap-4 items-center text-sm transition-colors hover:bg-white/2">
                    <div className="md:col-span-3 font-bold text-white font-['Outfit']">
                      {item.feature}
                    </div>
                    <div className="md:col-span-4 flex items-start gap-2.5 text-slate-400 text-xs leading-relaxed">
                      <HiXMark className="text-rose-500 shrink-0 mt-0.5" size={16} />
                      <span>{item.traditional}</span>
                    </div>
                    <div className="md:col-span-5 flex items-start gap-2.5 text-cyan-200 text-xs font-semibold leading-relaxed bg-cyan-500/5 p-3 rounded-2xl border border-cyan-500/15">
                      <HiCheck className="text-cyan-400 shrink-0 mt-0.5" size={16} />
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
              <Badge variant="cyan" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
                Answers to <span className="font-calligraphy italic font-normal text-cyan-400">Common Questions</span>
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                Everything you need to know about the AI interview engine.
              </p>
            </div>

            <Accordion items={faqItems} />
          </SectionReveal>
        </section>

        {/* ── BOTTOM CTA BANNER ───────────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto pb-24">
          <SectionReveal>
            <div className="rounded-3xl bg-gradient-to-r from-cyan-900/30 via-slate-900 to-indigo-950/40 border border-cyan-500/30 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <Badge variant="cyan" icon={BsStars}>Get Started Today</Badge>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-['Outfit']">
                  Ready to <span className="font-calligraphy italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">Ace</span> Your Next Interview?
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
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
      <footer className="border-t border-white/8 bg-slate-950/80 px-6 py-12 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs">
              <BsStars />
            </div>
            <span className="font-bold text-white text-sm font-['Outfit']">
              Interview<span className="font-calligraphy italic font-normal text-cyan-400">IQ</span>.AI
            </span>
          </div>
          <p>© {new Date().getFullYear()} InterviewIQ. All rights reserved. Universal AI Interview Studio.</p>
          <div className="flex gap-6 font-medium text-slate-400">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
