import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const signupSchema = z.object({
  full_name: z
    .string()
    .max(60, 'Name must be under 60 characters')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be under 72 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function PasswordStrength({ password }) {
  if (!password) return null
  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length >= 6 ? 1 : 0
  const labels = ['', 'Weak', 'Good', 'Strong']
  const colors = ['', '#D97706', '#0F766E', '#16a34a']
  const widths = ['0%', '33%', '66%', '100%']

  return (
    <div className="mt-1.5">
      <div className="h-1 bg-[#243044] rounded-full overflow-hidden">
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: widths[strength], background: colors[strength] }}
        />
      </div>
      {strength > 0 && (
        <p className="text-xs mt-1" style={{ color: colors[strength] }}>
          {labels[strength]} password
        </p>
      )}
    </div>
  )
}

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

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  const passwordValue = watch('password', '')

  const onSubmit = async (data) => {
    setServerError('')
    setSuccessMessage('')
    try {
      await signup(data.email, data.password, data.full_name || '')
      setSuccessMessage(
        'Account created! Check your email for a confirmation link, then sign in.'
      )
      setTimeout(() => navigate('/login'), 4000)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('already registered') || detail.toLowerCase().includes('already been registered')) {
          setServerError('This email is already registered. Try signing in instead.')
        } else if (detail.toLowerCase().includes('signup failed')) {
          setServerError(
            'Account creation failed. This may be a temporary issue — please try again or use a different email.'
          )
        } else {
          setServerError(detail)
        }
      } else {
        setServerError('Account creation failed. Please try again.')
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
            Create your account
          </h1>
          <p className="text-[#64748B] text-sm">
            Join AlgoVision — completely free, no credit card
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
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div
              className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg mb-5 text-sm"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Full Name (optional) */}
            <div>
              <label htmlFor="signup-name" className="input-label">
                Full Name{' '}
                <span className="text-[#475569] font-normal">(optional)</span>
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                aria-describedby={errors.full_name ? 'name-error' : undefined}
                className={`input-field ${errors.full_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p id="name-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="input-label">
                Email Address
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="input-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
              {errors.password ? (
                <p id="password-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {errors.password.message}
                </p>
              ) : (
                <PasswordStrength password={passwordValue} />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="input-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  aria-invalid={!!errors.confirmPassword}
                  className={`input-field pr-11 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors p-1"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isSubmitting || !!successMessage}
              className="btn-primary w-full py-3 text-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={16} aria-hidden="true" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Switch to login */}
          <p className="text-center text-[#64748B] text-sm mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#eb5e28] hover:text-[#d44d18] font-semibold transition-colors"
            >
              Sign in
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
