'use client'
import { useEffect, useRef, useState } from 'react'

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return val
}

interface StatCardProps {
  label: string
  value: string
  chip?: string
  accent: string
  icon: string
  trend?: number   // +/- percent
  sparkline?: number[]
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 72, h = 28
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
  const path = 'M' + pts.join(' L')
  const fill = 'M' + pts[0] + ' L' + pts.join(' L') + ` L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace('#','')})`}/>
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="2.5" fill={color}/>
    </svg>
  )
}

export default function StatCard({ label, value, chip, accent, icon, trend, sparkline }: StatCardProps) {
  const numericVal = parseInt(value.replace(/\D/g,'')) || 0
  const prefix = value.match(/^[^\d]*/)?.[0] || ''
  const suffix = value.match(/[^\d]*$/)?.[0] || ''
  const animated = useCountUp(numericVal)

  return (
    <div className="stat-card" style={{
      background: 'var(--s1)',
      border: '1px solid var(--glass-border)',
      borderRadius: 14,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      cursor: 'default',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`
      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'
      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
    }}>
      {/* Top glow accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
        borderRadius: '14px 14px 0 0'
      }}/>
      {/* Subtle bg glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18, transparent 70%)`,
        pointerEvents: 'none'
      }}/>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          flexShrink: 0
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            padding: '2px 7px', borderRadius: 20,
            background: trend >= 0 ? 'var(--green-d)' : 'var(--red-d)',
            color: trend >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {chip && !trend && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            padding: '2px 7px', borderRadius: 20,
            background: `${accent}18`, color: accent
          }}>{chip}</span>
        )}
      </div>

      <div style={{
        fontSize: 28, fontWeight: 800,
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '-0.5px',
        color: 'var(--text)',
        lineHeight: 1,
        marginBottom: 4
      }}>
        {prefix}{animated}{suffix}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t2)', fontWeight: 500, letterSpacing: '0.03em' }}>
        {label}
      </div>

      {sparkline && (
        <div style={{ marginTop: 10 }}>
          <Sparkline data={sparkline} color={accent} />
        </div>
      )}
    </div>
  )
}