import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: '⚡',
    title: 'Step-by-Step Visualizer',
    description: 'Watch arrays and linked lists animate in real time as operations execute.',
    path: '/visualizer',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🌳',
    title: 'Trees & Graphs',
    description: 'BST insert/search/traversal and Graph BFS/DFS with full SVG tree rendering.',
    path: '/trees-graphs',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: '🔢',
    title: 'Sorting & Search',
    description: 'Bubble, Selection, Insertion, Merge, Quick Sort + Binary Search with race mode.',
    path: '/sorting',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: '💻',
    title: 'In-Browser Compiler',
    description: 'Write and run Python, C++, Java, and more right in your browser.',
    path: '/compiler',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: '🤖',
    title: 'AI Tutor',
    description: 'Ask anything about data structures. Powered by LLaMA 3 70B via Groq.',
    path: '/ai-tutor',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '📚',
    title: 'Practice Problems',
    description: '10 curated problems with progressive hints and AI assistance.',
    path: '/practice',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: '📊',
    title: 'Performance Analytics',
    description: 'Compare execution time and memory across algorithms with Chart.js graphs.',
    path: '/performance',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: '📄',
    title: 'PDF Reports',
    description: 'Download your complete learning progress as a formatted PDF report.',
    path: '/reports',
    color: 'from-indigo-500 to-blue-500',
  },
]

const steps = [
  { step: '01', label: 'Learn', desc: 'Study the concept with the AI Tutor' },
  { step: '02', label: 'Execute', desc: 'Write code in the in-browser compiler' },
  { step: '03', label: 'Visualize', desc: 'Watch the algorithm animate step by step' },
  { step: '04', label: 'Analyze', desc: 'Review performance metrics and charts' },
  { step: '05', label: 'Improve', desc: 'Practice problems with AI hints' },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Learning Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="gradient-text">AlgoVision</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-400 font-light mb-4 max-w-3xl mx-auto">
            Learn data structures the way they were meant to be learned
          </p>
          <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">
            Real-time step-by-step visualization, AI tutoring, in-browser code execution,
            and performance analytics — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                id="hero-visualizer-btn"
                onClick={() => navigate('/visualizer')}
                className="btn-primary text-lg px-8 py-3 glow-blue"
              >
                ⚡ Open Visualizer
              </button>
            ) : (
              <>
                <Link to="/signup" id="hero-signup-btn" className="btn-primary text-lg px-8 py-3 glow-blue">
                  Get Started — Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Learning Loop */}
      <section className="py-16 px-6 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-300 mb-10">
            The AlgoVision Learning Loop
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="card flex flex-col items-center text-center p-5 min-w-32 hover:border-blue-500/50 transition-all">
                  <span className="text-blue-400 text-xs font-mono font-bold mb-1">{s.step}</span>
                  <span className="font-bold text-white text-lg mb-1">{s.label}</span>
                  <span className="text-slate-500 text-xs">{s.desc}</span>
                </div>
                {i < steps.length - 1 && (
                  <span className="text-slate-600 text-xl hidden sm:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            Everything you need to master DSA
          </h2>
          <p className="text-center text-slate-400 mb-12 text-lg">
            Eight integrated tools — one seamless experience
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Link
                key={f.path}
                to={user ? f.path : '/signup'}
                id={`feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="card group hover:border-slate-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-20 px-6 bg-gradient-to-r from-blue-900/30 to-violet-900/30 border-y border-slate-800">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to level up your DSA skills?</h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join AlgoVision today — it's completely free.
            </p>
            <Link to="/signup" id="bottom-cta-btn" className="btn-primary text-lg px-10 py-3 glow-blue">
              Start Learning →
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center">
        <p className="text-slate-600 text-sm">
          AlgoVision v3.0 — Arrays · Linked Lists · BST · Graphs · Sorting | Built by Akif · Arslan · Ruman | Powered by FastAPI, React, Groq & Supabase
        </p>
      </footer>
    </div>
  )
}
