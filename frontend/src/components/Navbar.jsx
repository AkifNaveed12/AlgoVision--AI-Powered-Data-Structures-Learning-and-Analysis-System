import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  BookOpen,
  BrainCircuit,
  Code2,
  FileText,
  GitBranch,
  LogIn,
  LogOut,
  Menu,
  SortDesc,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'

// Navigation shown to authenticated users (app pages)
const appNavLinks = [
  { path: '/visualizer',   label: 'Visualizer',  icon: Zap },
  { path: '/trees-graphs', label: 'Trees',        icon: GitBranch },
  { path: '/sorting',      label: 'Sorting',      icon: SortDesc },
  { path: '/compiler',     label: 'Compiler',     icon: Code2 },
  { path: '/ai-tutor',     label: 'AI Tutor',     icon: BrainCircuit },
  { path: '/practice',     label: 'Practice',     icon: BookOpen },
  { path: '/performance',  label: 'Analytics',    icon: TrendingUp },
  { path: '/reports',      label: 'Reports',      icon: FileText },
]

// Public navigation links (landing page sections + auth)
const publicNavLinks = [
  { href: '#features',   label: 'Features' },
  { href: '#visualizer', label: 'Visualizer' },
  { href: '#how-it-works', label: 'How It Works' },
]

function NavLogo({ isLight = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" aria-label="AlgoVision home">
      {/* Geometric logo mark */}
      <div className="w-8 h-8 relative flex-shrink-0" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
          <rect width="32" height="32" rx="8" fill="#eb5e28"/>
          {/* Binary tree shape */}
          <circle cx="16" cy="8" r="2.5" fill="white" fillOpacity="0.95"/>
          <circle cx="10" cy="18" r="2.5" fill="white" fillOpacity="0.8"/>
          <circle cx="22" cy="18" r="2.5" fill="white" fillOpacity="0.8"/>
          <circle cx="7"  cy="26" r="2" fill="white" fillOpacity="0.6"/>
          <circle cx="13" cy="26" r="2" fill="white" fillOpacity="0.6"/>
          <circle cx="25" cy="26" r="2" fill="white" fillOpacity="0.6"/>
          <line x1="16" y1="10.5" x2="10" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
          <line x1="16" y1="10.5" x2="22" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
          <line x1="10" y1="20.5" x2="7"  y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
          <line x1="10" y1="20.5" x2="13" y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
          <line x1="22" y1="20.5" x2="25" y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
        </svg>
      </div>
      <span
        className={`font-display font-black text-lg tracking-tight hidden sm:block ${
          isLight ? 'text-[#252422]' : 'text-white'
        }`}
        style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
      >
        AlgoVision
      </span>
    </Link>
  )
}

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
  const isLandingLight = location.pathname === '/' && !user

  return (
    <nav
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        isLandingLight
          ? 'bg-[#f8f9fa]/95 backdrop-blur-md border-b border-[#E5E7EB]'
          : 'bg-[#101827]/95 backdrop-blur-md border-b border-[#243044]'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLogo isLight={isLandingLight} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center mx-6">
            {user ? (
              /* Authenticated: show app pages */
              <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                {appNavLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive(path)
                        ? 'bg-[#eb5e28]/15 text-[#eb5e28] border border-[#eb5e28]/30'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
                    }`}
                    aria-current={isActive(path) ? 'page' : undefined}
                  >
                    <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            ) : (
              /* Public: show landing page anchor links */
              <div className="flex items-center gap-1">
                {publicNavLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={location.pathname === '/' ? href : `/${href}`}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isLandingLight
                        ? 'text-[#525252] hover:text-[#252422] hover:bg-black/5'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Auth actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {/* User email indicator */}
                <span
                  className="hidden lg:block text-[#64748B] text-sm font-medium max-w-[160px] truncate"
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-1.5 px-3"
                  aria-label="Sign out"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-semibold transition-colors px-3.5 py-2 rounded-lg ${
                    isLandingLight
                      ? 'text-[#525252] hover:text-[#252422] hover:bg-black/5'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#eb5e28] hover:bg-[#d44d18] text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className={`md:hidden p-2 rounded-lg transition-all ${
                isLandingLight
                  ? 'text-[#252422] hover:bg-black/5'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <div
            id="mobile-nav"
            className={`md:hidden border-t py-3 pb-4 space-y-1 animate-fadeIn ${
              isLandingLight ? 'border-[#E5E7EB]' : 'border-[#243044]'
            }`}
            role="menu"
          >
            {user ? (
              <>
                {appNavLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(path)
                        ? 'bg-[#eb5e28]/15 text-[#eb5e28]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
                    }`}
                    aria-current={isActive(path) ? 'page' : undefined}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-[#243044] pt-3 mt-3 px-4">
                  <p className="text-[#64748B] text-xs mb-2 truncate">{user.email}</p>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-red-400 font-medium transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                {publicNavLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={location.pathname === '/' ? href : `/${href}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isLandingLight
                        ? 'text-[#525252] hover:text-[#252422] hover:bg-black/5'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1B293B]'
                    }`}
                  >
                    {label}
                  </a>
                ))}
                <div className={`border-t pt-3 mt-1 px-4 flex flex-col gap-2 ${
                  isLandingLight ? 'border-[#E5E7EB]' : 'border-[#243044]'
                }`}>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`text-sm py-2 w-full justify-center flex items-center gap-2 rounded-lg font-semibold border ${
                      isLandingLight
                        ? 'bg-white border-[#E5E7EB] text-[#252422] hover:bg-slate-50'
                        : 'bg-[#243044] border-[#334155] text-white'
                    }`}
                  >
                    <LogIn size={15} /> Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="bg-[#eb5e28] hover:bg-[#d44d18] text-white text-sm font-semibold py-2 w-full justify-center flex items-center rounded-lg shadow-sm"
                  >
                    Get Started Free
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
