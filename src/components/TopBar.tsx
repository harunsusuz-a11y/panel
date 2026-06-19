'use client'

export default function TopBar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <>
      <style>{`
        .topbar { height: 52px; background: rgba(13,15,24,0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); display: flex; align-items: center; padding: 0 20px; gap: 10px; flex-shrink: 0; position: sticky; top: 0; z-index: 10; }
        @media (max-width: 768px) { .topbar { padding: 0 14px; } }
      `}</style>
      <div className="topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 8, fontWeight: 400 }}>{subtitle}</span>}
        </div>
        {action && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{action}</div>}
      </div>
    </>
  )
}