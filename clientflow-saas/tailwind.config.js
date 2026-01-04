/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1e40af',
        },
        'success-green': '#10b981',
        'warning-amber': '#f59e0b',
        'error-red': '#ef4444',
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        }
      },
      fontSize: {
        'display': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-1': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-large': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '4.5': '18px',
        '15': '60px',
        '18': '72px',
      },
      borderRadius: {
        'button': '6px',
        'card': '8px',
        'modal': '16px',
        'pill': '12px',
      },
      boxShadow: {
        'small': '0 1px 2px rgba(0,0,0,0.05)',
        'medium': '0 4px 6px rgba(0,0,0,0.07)',
        'large': '0 10px 15px rgba(0,0,0,0.10)',
        'focus-ring': '0 0 0 3px rgba(37,99,235,0.1)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      transitionDuration: {
        'micro': '150ms',
        'panel': '200ms',
        'page': '300ms',
      },
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
      },
      maxWidth: {
        'container': '1200px',
      }
    },
  },
  plugins: [],
}