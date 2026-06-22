'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // localStorage'dan oku
    const saved = localStorage.getItem('daydream-theme') as 'dark'|'light' || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
    setMounted(true)
  }, [])

  async function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('daydream-theme', next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      style={{
        width: 34, height: 34,
        borderRadius: 9,
        background: 'var(--s2)',
        border: '1px solid var(--bdr)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all .15s',
        flexShrink: 0,
      }}
    >
      {theme === 'dark'
        ? <Sun size={15} style={{color:'var(--amber)'}} strokeWidth={2}/>
        : <Moon size={15} style={{color:'var(--ac)'}} strokeWidth={2}/>
      }
    </button>
  )
}
