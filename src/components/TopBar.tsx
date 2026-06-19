'use client'

export default function TopBar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{
      height: 54,
      background: 'rgba(13,15,24,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 22px',
      gap: 10,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 10, fontWeight: 400 }}>{subtitle}</span>
        )}
      </div>
      {action && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{action}</div>}
    </div>
  )
}