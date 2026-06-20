'use client'
import { ReactNode } from 'react'

export default function TopBar({
  title, subtitle, action
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="erp-topbar">
      <div className="flex-1 min-w-0 flex items-baseline gap-2.5">
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.15px', flexShrink: 0 }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-sm truncate" style={{ color: 'var(--text-3)' }}>
            {subtitle}
          </span>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}