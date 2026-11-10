import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

function NavLogo() {
  return (
    <div className="flex items-center gap-2.5 justify-center">
      <div className="w-9 h-9 relative flex-shrink-0">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
          <rect width="32" height="32" rx="8" fill="#eb5e28"/>
          <circle cx="16" cy="8" r="2.5" fill="white" fillOpacity="0.95"/>
          <circle cx="10" cy="18" r="2.5" fill="white" fillOpacity="0.75"/>
          <circle cx="22" cy="18" r="2.5" fill="white" fillOpacity="0.75"/>
          <circle cx="7"  cy="26" r="2" fill="white" fillOpacity="0.5"/>
          <circle cx="13" cy="26" r="2" fill="white" fillOpacity="0.5"/>
          <circle cx="25" cy="26" r="2" fill="white" fillOpacity="0.5"/>
          <line x1="16" y1="10.5" x2="10" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
          <line x1="16" y1="10.5" x2="22" y2="15.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
          <line x1="10" y1="20.5" x2="7"  y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
          <line x1="10" y1="20.5" x2="13" y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
          <line x1="22" y1="20.5" x2="25" y2="24"   stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
        </svg>
      </div>
      <span
        className="font-black text-xl text-white tracking-tight"
        style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.02em' }}
      >
        AlgoVision
      </span>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('confirm')) {
          setServerError('Please confirm your email address before signing in. Check your inbox.')
        } else if (detail.toLowerCase().includes('invalid') || detail.toLowerCase().includes('password')) {
          setServerError('Incorrect email or password. Please try again.')
        } else {
          setServerError(detail)
        }
      } else {
        setServerError('Sign in failed. Please check your credentials and try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#101827' }}>
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <NavLogo />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'Manrope, system-ui', letterSpacing: '-0.025em' }}
          >
            Welcome back
          </h1>
          <p className="text-[#64748B] text-sm">
            Sign in to your AlgoVision account
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-7 border border-[#243044]"
          style={{ background: '#1B293B', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Server error */}
          {serverError && (
            <div
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="input-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="input-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  className={`input-field pr-11 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Switch to signup */}
          <p className="text-center text-[#64748B] text-sm mt-6">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-[#eb5e28] hover:text-[#d44d18] font-semibold transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <Link to="/" className="text-[#475569] text-xs hover:text-[#64748B] transition-colors">
            ← Back to AlgoVision
          </Link>
        </div>
      </div>
    </div>
  )
}
