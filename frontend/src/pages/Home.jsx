import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Code2,
  FileText,
  GitBranch,
  Layers,
  Network,
  Play,
  SortDesc,
  TrendingUp,
  Zap,
} from 'lucide-react'

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: 'Step-by-Step Visualizer',
    description: 'Watch arrays and linked lists animate in real time as operations execute — with full playback controls.',
    path: '/visualizer',
    color: '#eb5e28',
    bg: 'rgba(235,94,40,0.1)',
  },
  {
    icon: GitBranch,
    title: 'Trees & Graphs',
    description: 'BST insert, search, traversal and Graph BFS/DFS with full SVG tree rendering and step annotations.',
    path: '/trees-graphs',
    color: '#0F766E',
    bg: 'rgba(15,118,110,0.1)',
  },
  {
    icon: SortDesc,
    title: 'Sorting & Search',
    description: 'Bubble, Selection, Insertion, Merge, Quick Sort + Binary Search with algorithm race mode.',
    path: '/sorting',
    color: '#eb5e28',
    bg: 'rgba(235,94,40,0.1)',
  },
  {
    icon: Code2,
    title: 'In-Browser Compiler',
    description: 'Write and execute Python, C++, Java and more directly in your browser — no setup required.',
    path: '/compiler',
    color: '#252422',
    bg: 'rgba(37,36,34,0.08)',
  },
  {
    icon: BrainCircuit,
    title: 'AI Tutor',
    description: 'Ask anything about data structures and algorithms. Powered by LLaMA 3 70B via Groq.',
    path: '/ai-tutor',
    color: '#0F766E',
    bg: 'rgba(15,118,110,0.1)',
  },
  {
    icon: BookOpen,
    title: 'Practice Problems',
    description: 'Curated problems with progressive difficulty, hints, and AI-assisted feedback on your solutions.',
    path: '/practice',
    color: '#eb5e28',
    bg: 'rgba(235,94,40,0.1)',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Compare execution time and memory usage across algorithms with interactive Chart.js visualizations.',
    path: '/performance',
    color: '#252422',
    bg: 'rgba(37,36,34,0.08)',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description: 'Download your complete learning progress and algorithm performance as a formatted PDF report.',
    path: '/reports',
    color: '#eb5e28',
    bg: 'rgba(235,94,40,0.1)',
  },
]

const dataStructures = [
  { name: 'Arrays',       path: '/visualizer',   icon: Layers,    desc: 'Dynamic arrays, insertion, deletion, search' },
  { name: 'Linked Lists', path: '/visualizer',   icon: Network,   desc: 'Singly linked lists with pointer visualization' },
  { name: 'Binary Trees', path: '/trees-graphs', icon: GitBranch, desc: 'BST operations with SVG tree rendering' },
  { name: 'Graphs',       path: '/trees-graphs', icon: Network,   desc: 'BFS, DFS traversal with adjacency lists' },
  { name: 'Sorting',      path: '/sorting',      icon: SortDesc,  desc: '5 sorting algorithms with comparisons' },
  { name: 'Searching',    path: '/sorting',      icon: BarChart2, desc: 'Binary search with step-by-step animation' },
]

const learningSteps = [
  { step: '01', label: 'Learn',      desc: 'Study the concept with the AI Tutor. Ask questions in natural language and get detailed explanations.' },
  { step: '02', label: 'Execute',    desc: 'Write code in the in-browser compiler. Run Python, C++, Java — no installation needed.' },
  { step: '03', label: 'Visualize',  desc: 'Watch the algorithm animate step by step. Pause, rewind, adjust speed.' },
  { step: '04', label: 'Analyze',    desc: 'Review execution time and memory performance charts. Compare algorithms side-by-side.' },
  { step: '05', label: 'Improve',    desc: 'Solve curated problems with progressive hints and AI-assisted feedback.' },
]

// ─── Inline Array Visualizer Preview ────────────────────────────────────────

function ArrayPreview() {
  const values = [12, 34, 7, 56, 23, 45]
  const highlighted = 2 // index being searched

  return (
    <div className="w-full">
      <div className="text-xs font-mono text-[#94A3B8] mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#eb5e28] rounded-full animate-pulse" />
        Binary Search — target: 7 — step 2 of 4
      </div>
      <div className="flex gap-2 justify-start flex-wrap">
        {values.map((val, idx) => {
          const isHighlight = idx === highlighted
          const isEliminated = idx > highlighted + 1
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg border font-mono font-semibold text-sm transition-all ${
                  isHighlight
                    ? 'bg-[#eb5e28]/20 border-[#eb5e28] text-[#eb5e28] scale-110 shadow-lg'
                    : isEliminated
                    ? 'bg-[#1B293B]/30 border-[#243044] text-[#475569]'
                    : 'bg-[#1B293B] border-[#334155] text-[#F1F5F9]'
                }`}
              >
                {val}
              </div>
              <span className="text-[#64748B] text-[10px] font-mono">[{idx}]</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 text-xs font-mono text-[#94A3B8]">
        mid = 2 → arr[2] = 7 → <span className="text-[#eb5e28] font-bold">Target Found!</span>
      </div>
    </div>
  )
}

// ─── Product Preview Card ────────────────────────────────────────────────────

function ProductPreviewCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#243044]"
      style={{
        background: 'linear-gradient(135deg, #1B293B 0%, #101827 100%)',
        boxShadow: '0 25px 60px rgba(37,36,34,0.18), 0 0 0 1px rgba(37,36,34,0.08)',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#243044] bg-[#101827]/80">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-[#1B293B] rounded px-3 py-1 text-[#94A3B8] text-xs font-mono text-center">
            AlgoVision — Step-by-Step Visualizer
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['Array', 'Linked List', 'BST'].map((tab, i) => (
            <button
              key={tab}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                i === 0
                  ? 'bg-[#eb5e28]/20 text-[#eb5e28] border border-[#eb5e28]/40'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Array visualization */}
        <ArrayPreview />

        {/* Controls */}
        <div className="mt-5 flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#eb5e28] hover:bg-[#d44d18] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors">
            <Play size={12} fill="white" /> Run
          </button>
          <div className="flex gap-1">
            {['⏮', '⏸', '⏭'].map((ctrl, i) => (
              <button key={i} className="w-7 h-7 rounded flex items-center justify-center bg-[#243044] text-[#94A3B8] text-xs hover:text-white transition-colors">
                {ctrl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[#64748B] text-xs font-mono">Speed</span>
            <div className="w-16 h-1.5 bg-[#243044] rounded-full">
              <div className="w-9 h-1.5 bg-[#eb5e28] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Code panel */}
      <div className="border-t border-[#243044] p-4 bg-[#0d1526]">
        <div className="text-[10px] font-mono text-[#64748B] mb-1.5 uppercase tracking-wider">AI Tutor Complexity Analysis</div>
        <div className="text-xs font-mono text-[#F1F5F9] leading-5">
          <span className="text-[#eb5e28] font-semibold">Binary search</span> divides search space by half each iteration.
          <br />
          Time Complexity: <span className="text-[#eb5e28] font-bold">O(log n)</span> — Space Complexity: <span className="text-[#0F766E] font-bold">O(1)</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#252422]">

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-4 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-28"
        aria-label="Hero"
      >
        {/* Subtle dot pattern background on #f8f9fa */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(37,36,34,0.08) 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
          aria-hidden="true"
        />

        {/* Ambient bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8f9fa)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">

            {/* Left — Headline */}
            <div>
              {/* Category label */}
              <div className="inline-flex items-center gap-2 bg-[#eb5e28]/10 border border-[#eb5e28]/25 text-[#eb5e28] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-[#eb5e28] rounded-full animate-pulse" aria-hidden="true" />
                AI-Powered DSA Learning Platform
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#252422] mb-6 leading-[1.12]"
                style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.03em' }}
              >
                Understand{' '}
                <span className="text-[#eb5e28]">Algorithms.</span>
                <br />
                Visualize Every Step.
              </h1>

              <p className="text-[#403d39] text-lg sm:text-xl leading-relaxed mb-10 max-w-lg font-normal">
                Learn data structures and algorithms through interactive visualizations,
                hands-on coding, and intelligent learning assistance.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5">
                {user ? (
                  <button
                    onClick={() => navigate('/visualizer')}
                    className="btn-cta text-base"
                    id="hero-visualizer-btn"
                  >
                    <Zap size={18} aria-hidden="true" />
                    Open Visualizer
                  </button>
                ) : (
                  <>
                    <Link to="/signup" className="btn-cta text-base" id="hero-signup-btn">
                      Start Learning Free
                      <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                    <Link to="/visualizer" className="btn-cta-outline text-base" id="hero-visualizer-btn">
                      <Play size={16} className="text-[#eb5e28]" aria-hidden="true" />
                      Explore Visualizer
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-5 mt-9">
                <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
                  <div className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
                  <div className="w-2 h-2 rounded-full bg-[#eb5e28]" />
                  8 integrated tools
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
                  <div className="w-2 h-2 rounded-full bg-[#252422]" />
                  Real-time visualization
                </div>
              </div>
            </div>

            {/* Right — Product Preview */}
            <div className="relative" id="visualizer">
              <ProductPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — STREAK (authenticated only)
          ═══════════════════════════════════════════════════ */}
      {user && (
        <section className="py-6 px-4 sm:px-6" aria-label="Learning streak">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(235,94,40,0.12)', border: '1px solid rgba(235,94,40,0.25)' }}
                  aria-hidden="true"
                >
                  <TrendingUp size={22} color="#eb5e28" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#252422]">
                    {user.current_streak > 0
                      ? `${user.current_streak}-Day Streak — Keep it up!`
                      : 'Start your learning streak today'}
                  </h3>
                  <p className="text-[#64748B] text-sm">
                    Practice daily to build momentum and deepen retention.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[#64748B] text-xs mb-0.5 font-medium">Best streak</div>
                <div className="text-xl font-black text-[#eb5e28]">
                  {user.longest_streak || 0}d
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — DATA STRUCTURES EXPLORER
          ═══════════════════════════════════════════════════ */}
      <section
        className="py-20 px-4 sm:px-6 border-t border-[#E5E7EB]"
        id="features"
        aria-label="Explore data structures"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#eb5e28]/10 border border-[#eb5e28]/25 text-[#eb5e28] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              Explore Topics
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black text-[#252422] text-center mb-4"
              style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.025em' }}
            >
              Every Core <span className="text-[#eb5e28]">Data Structure</span> & Algorithm
            </h2>
            <p className="text-[#64748B] text-lg max-w-2xl mx-auto leading-relaxed">
              All topics covered with step-by-step animation, complexity analysis, and
              interactive code execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dataStructures.map(({ name, path, icon: Icon, desc }) => (
              <Link
                key={name}
                to={user ? path : '/signup'}
                className="group flex items-start gap-4 p-5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#eb5e28]/50 hover:shadow-md transition-all duration-200"
                aria-label={`Explore ${name}`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: 'rgba(235,94,40,0.1)', border: '1px solid rgba(235,94,40,0.2)' }}
                >
                  <Icon size={18} color="#eb5e28" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-[#252422] mb-1 group-hover:text-[#eb5e28] transition-colors">{name}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{desc}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="ml-auto text-[#CBD5E1] group-hover:text-[#eb5e28] transition-colors flex-shrink-0 mt-1"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4 — PLATFORM FEATURES
          ═══════════════════════════════════════════════════ */}
      <section
        className="py-20 px-4 sm:px-6 border-t border-[#E5E7EB]"
        aria-label="Platform features"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#eb5e28]/10 border border-[#eb5e28]/25 text-[#eb5e28] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              Platform Features
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black text-[#252422] text-center mb-4"
              style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.025em' }}
            >
              Everything You Need to <span className="text-[#eb5e28]">Master DSA</span>
            </h2>
            <p className="text-[#64748B] text-lg max-w-2xl mx-auto leading-relaxed">
              Eight integrated tools — one seamless learning experience, built for
              engineering students and self-taught developers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <Link
                  key={f.path}
                  to={user ? f.path : '/signup'}
                  id={`feature-${f.title.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, '')}`}
                  className="feature-card"
                  aria-label={f.title}
                >
                  <div
                    className="icon-container mb-4 group-hover:scale-105 transition-transform"
                    style={{ background: f.bg, border: `1px solid ${f.color}25` }}
                    aria-hidden="true"
                  >
                    <Icon size={20} color={f.color} />
                  </div>
                  <h3 className="font-bold text-[#252422] mb-2 text-sm leading-snug group-hover:text-[#eb5e28] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[#64748B] text-xs leading-relaxed">
                    {f.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — LEARNING METHODOLOGY
          ═══════════════════════════════════════════════════ */}
      <section
        className="py-20 px-4 sm:px-6 border-t border-[#E5E7EB]"
        id="how-it-works"
        aria-label="Learning methodology"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#eb5e28]/10 border border-[#eb5e28]/25 text-[#eb5e28] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              Methodology
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black text-[#252422] text-center mb-4"
              style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.025em' }}
            >
              The AlgoVision <span className="text-[#eb5e28]">Learning Loop</span>
            </h2>
            <p className="text-[#64748B] text-lg max-w-xl mx-auto leading-relaxed">
              A structured five-step cycle that takes you from concept to mastery —
              with AI assistance and real execution at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5"
              style={{ background: 'linear-gradient(to right, transparent, #eb5e28, transparent)' }}
              aria-hidden="true"
            />

            {learningSteps.map((s) => (
              <div
                key={s.step}
                className="relative flex flex-col items-center text-center p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Step number badge */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4 relative z-10 font-mono font-bold text-sm text-white"
                  style={{
                    background: '#252422',
                    border: '2px solid #eb5e28',
                    boxShadow: '0 4px 14px rgba(235,94,40,0.25)',
                  }}
                >
                  {s.step}
                </div>
                <h3
                  className="font-bold text-[#252422] mb-2 text-base"
                  style={{ fontFamily: 'Manrope, system-ui' }}
                >
                  {s.label}
                </h3>
                <p className="text-[#64748B] text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6 — FINAL CTA (unauthenticated)
          ═══════════════════════════════════════════════════ */}
      {!user && (
        <section
          className="py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#f8f9fa] to-white border-t border-[#E5E7EB]"
          aria-label="Get started"
        >
          {/* Subtle radial highlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(235,94,40,0.06) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-2xl mx-auto text-center">
            <h2
              className="text-3xl sm:text-4xl font-black text-[#252422] mb-5"
              style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.03em' }}
            >
              Build a Deeper Understanding of <span className="text-[#eb5e28]">DSA</span>
            </h2>
            <p className="text-[#64748B] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join AlgoVision — it's completely free. No installation. No credit card.
              Start visualizing algorithms in seconds.
            </p>
            <Link to="/signup" id="bottom-cta-btn" className="btn-cta text-base">
              Start Learning
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer
        className="bg-[#252422] text-white border-t border-[#34322e] py-14 px-4 sm:px-6"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 relative flex-shrink-0">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="8" fill="#eb5e28"/>
                    <circle cx="16" cy="8" r="2.5" fill="white" fillOpacity="0.95"/>
                    <circle cx="10" cy="18" r="2.5" fill="white" fillOpacity="0.75"/>
                    <circle cx="22" cy="18" r="2.5" fill="white" fillOpacity="0.75"/>
                    <line x1="16" y1="10.5" x2="10" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
                    <line x1="16" y1="10.5" x2="22" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
                  </svg>
                </div>
                <span className="font-black text-xl text-white tracking-tight" style={{ fontFamily: 'Manrope' }}>AlgoVision</span>
              </div>
              <p className="text-[#9ca3af] text-sm leading-relaxed">
                An AI-powered data structures and algorithms learning platform. 
                Learn, visualize, and master DSA with technical precision.
              </p>
            </div>

            {/* Learn */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[#eb5e28]" style={{ fontFamily: 'Manrope' }}>Learn</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Visualizer', path: '/visualizer' },
                  { label: 'Trees & Graphs', path: '/trees-graphs' },
                  { label: 'Sorting & Search', path: '/sorting' },
                ].map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-[#9ca3af] text-sm hover:text-[#eb5e28] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[#eb5e28]" style={{ fontFamily: 'Manrope' }}>Tools</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'In-Browser Compiler', path: '/compiler' },
                  { label: 'AI Tutor', path: '/ai-tutor' },
                  { label: 'Practice Problems', path: '/practice' },
                  { label: 'Performance Analytics', path: '/performance' },
                  { label: 'PDF Reports', path: '/reports' },
                ].map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-[#9ca3af] text-sm hover:text-[#eb5e28] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[#eb5e28]" style={{ fontFamily: 'Manrope' }}>Account</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/login" className="text-[#9ca3af] text-sm hover:text-[#eb5e28] transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-[#9ca3af] text-sm hover:text-[#eb5e28] transition-colors">
                    Create Account
                  </Link>
                </li>
              </ul>
              <div className="mt-6">
                <h4 className="text-[#9ca3af] font-semibold text-xs mb-2 uppercase tracking-wider">Engineered with</h4>
                <p className="text-[#6b7280] text-xs leading-relaxed">
                  React 18 · FastAPI · Groq LLaMA 3 · Supabase · Chart.js · Tailwind CSS
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#34322e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[#6b7280] text-xs">
              © 2026 AlgoVision v3.0 — Built by Akif · Arslan · Ruman
            </p>
            <p className="text-[#6b7280] text-xs">
              For educational use — Arrays · Linked Lists · Trees · Graphs · Sorting
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
