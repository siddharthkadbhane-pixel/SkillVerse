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
        // SkillVerse Design Tokens
        'sv-bg':       '#09090b',
        'sv-surface':  '#111113',
        'sv-surface2': '#18181b',
        'sv-border':   '#27272a',
        'sv-accent':   '#3b82f6',
        'sv-success':  '#10b981',
        'sv-warning':  '#f59e0b',
        'sv-danger':   '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px',  { lineHeight: '1.4' }],
        'xs':  ['11px',  { lineHeight: '1.4' }],
        'sm':  ['12.5px',{ lineHeight: '1.5' }],
        'base':['13px',  { lineHeight: '1.5' }],
        'md':  ['14px',  { lineHeight: '1.5' }],
        'lg':  ['15px',  { lineHeight: '1.4' }],
        'xl':  ['17px',  { lineHeight: '1.3' }],
        '2xl': ['20px',  { lineHeight: '1.2' }],
        '3xl': ['24px',  { lineHeight: '1.2' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        'md':    '8px',
        'lg':    '10px',
        'xl':    '12px',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'spin-slow': {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 150ms ease forwards',
        'shimmer':  'shimmer 1.4s infinite',
        'spin-slow':'spin-slow 0.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
