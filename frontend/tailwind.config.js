/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Landing page palette requested by user
        canvas: '#f8f9fa',
        heading: '#252422',
        'accent-orange': '#eb5e28',
        'brand-orange': '#eb5e28',
        'brand-dark': '#252422',

        // Light theme (marketing / landing)
        surface: '#FFFFFF',
        'text-primary': '#252422',
        'text-secondary': '#64748B',
        'text-tertiary': '#94A3B8',
        'brand-blue': '#2457D6',
        'brand-teal': '#0F766E',
        'brand-amber': '#D97706',
        'border-light': '#E5E7EB',

        // Dark workspace theme (app interior)
        workspace: {
          bg: '#101827',
          surface: '#1B293B',
          surface2: '#243044',
          text: '#F1F5F9',
          muted: '#94A3B8',
          accent: '#38BDF8',
          border: '#243044',
        },

        // Extended blue palette
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Legacy dark palette (preserve for existing app pages)
        dark: {
          900: '#0a0f1e',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23252422' fill-opacity='0.04' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
