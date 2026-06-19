import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0e14',
        s1: '#111318',
        s2: '#16181f',
        s3: '#1c1f28',
        s4: '#242733',
        gold: '#e9a825',
        t1: '#dde1f0',
        t2: '#7b8099',
        t3: '#3e4258',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
