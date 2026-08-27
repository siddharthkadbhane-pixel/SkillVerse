import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Global Visual System Surfaces
        canvas:      '#070A0F',
        surface:     '#0D121A',
        elevated:    '#111722',
        hover:       '#151B26',
        subtle:      '#1C2433',
        'muted-bg':  '#222B3D',
        border:      'rgba(255, 255, 255, 0.08)',
        'border-strong': 'rgba(255, 255, 255, 0.14)',
        'border-glow': 'rgba(124, 58, 237, 0.25)',

        // Primary: Electric Violet / Indigo
        primary:     '#7C3AED',
        'primary-hover': '#8B5CF6',
        'primary-light': '#A78BFA',
        accent:      '#8B5CF6',
        'accent-hover': '#A78BFA',
        'accent-dim': 'rgba(124, 58, 237, 0.12)',
        'accent-muted': 'rgba(124, 58, 237, 0.24)',
        'accent-glow': 'rgba(124, 58, 237, 0.35)',

        // Secondary: Blue / Cyan
        secondary:   '#38BDF8',
        'secondary-hover': '#0EA5E9',
        accent2:     '#06B6D4',
        'accent2-dim': 'rgba(6, 182, 212, 0.12)',

        // Semantic
        success:     '#10B981',
        'success-dim': 'rgba(16, 185, 129, 0.12)',
        warning:     '#F59E0B',
        'warning-dim': 'rgba(245, 158, 11, 0.12)',
        danger:      '#EF4444',
        'danger-dim': 'rgba(239, 68, 68, 0.12)',
        info:        '#3B82F6',
        'info-dim':  'rgba(59, 130, 246, 0.12)',

        // Text
        'text-primary':   '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted':     '#64748B',
        'text-dim':       '#475569',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        heading: ['var(--font-outfit)', 'var(--font-inter)', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs':  ['11px',  { lineHeight: '14px' }],
        'xs':   ['12px',  { lineHeight: '16px' }],
        'sm':   ['13px',  { lineHeight: '18px' }],
        'base': ['14px',  { lineHeight: '20px' }],
        'md':   ['15px',  { lineHeight: '22px' }],
        'lg':   ['16px',  { lineHeight: '24px' }],
        'xl':   ['18px',  { lineHeight: '26px' }],
        '2xl':  ['22px',  { lineHeight: '28px' }],
        '3xl':  ['28px',  { lineHeight: '34px' }],
        '4xl':  ['36px',  { lineHeight: '42px' }],
        '5xl':  ['48px',  { lineHeight: '52px' }],
        '6xl':  ['60px',  { lineHeight: '64px' }],
        '7xl':  ['72px',  { lineHeight: '76px' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        'sm':    '6px',
        'md':    '10px',
        'lg':    '12px',
        'xl':    '16px',
        '2xl':   '20px',
        '3xl':   '24px',
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)',
        'elevated': '0 10px 40px rgba(0,0,0,0.6)',
        'glow-sm':  '0 0 16px rgba(124,58,237,0.15)',
        'glow-md':  '0 0 32px rgba(124,58,237,0.22)',
        'glow-cyan': '0 0 24px rgba(6,182,212,0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':      'fade-in 180ms ease-out forwards',
        'fade-up':      'fade-up 240ms ease-out forwards',
        'slide-in':     'slide-in-right 180ms ease-out forwards',
        'scale-in':     'scale-in 180ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
