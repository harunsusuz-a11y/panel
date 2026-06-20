import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        bg:        '#09090b',
        surface:   '#111113',
        'surface-2':'#18181b',
        'surface-3':'#1f1f23',
        'surface-4':'#27272a',
        // Borders
        border:    'rgba(255,255,255,0.07)',
        'border-2':'rgba(255,255,255,0.11)',
        // Text
        text:      '#fafafa',
        'text-2':  '#a1a1aa',
        'text-3':  '#52525b',
        // Accent — indigo 500
        accent:    '#6366f1',
        'accent-2':'rgba(99,102,241,0.15)',
        'accent-3':'rgba(99,102,241,0.08)',
        // Semantic
        success:   '#22c55e',
        'success-2':'rgba(34,197,94,0.12)',
        warning:   '#f59e0b',
        'warning-2':'rgba(245,158,11,0.12)',
        danger:    '#ef4444',
        'danger-2':'rgba(239,68,68,0.12)',
        info:      '#3b82f6',
        'info-2':  'rgba(59,130,246,0.12)',
      },
      fontFamily: {
        sans:  ['Inter','system-ui','sans-serif'],
        mono:  ['JetBrains Mono','monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
      fontSize: {
        xs:   ['11px',  { lineHeight:'16px' }],
        sm:   ['12.5px',{ lineHeight:'18px' }],
        base: ['13.5px',{ lineHeight:'20px' }],
        md:   ['14px',  { lineHeight:'20px' }],
        lg:   ['16px',  { lineHeight:'24px' }],
        xl:   ['18px',  { lineHeight:'28px' }],
        '2xl':['22px',  { lineHeight:'32px' }],
      },
    },
  },
  plugins: [],
}
export default config