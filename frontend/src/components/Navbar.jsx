import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const navLinks = [
  { path: '/visualizer', label: 'Visualizer', icon: '⚡' },
  { path: '/trees-graphs', label: 'Trees & Graphs', icon: '🌳' },
  { path: '/sorting', label: 'Sorting', icon: '🔢' },
  { path: '/compiler', label: 'Compiler', icon: '💻' },
  { path: '/ai-tutor', label: 'AI Tutor', icon: '🤖' },
  { path: '/practice', label: 'Practice', icon: '📚' },
  { path: '/performance', label: 'Performance', icon: '📊' },
  { path: '/reports', label: 'Reports', icon: '📄' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              AV
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">AlgoVision</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(path)
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-slate-500 text-sm truncate max-w-32">
                  {user.email}
                </span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                className="md:hidden p-2 text-slate-400 hover:text-slate-200"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && menuOpen && (
          <div className="md:hidden border-t border-slate-700/50 py-3 space-y-1 animate-fadeIn">
            {navLinks.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
