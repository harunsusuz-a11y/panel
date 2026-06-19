'use client'
import { useState } from 'react'

export default function TopBar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{height:52,background:'var(--s1)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 20px',gap:10,flexShrink:0}}>
      <div>
        <span style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{title}</span>
        {subtitle && <span style={{fontSize:12,color:'var(--t3)',marginLeft:8}}>{subtitle}</span>}
      </div>
      {action && <div style={{marginLeft:'auto'}}>{action}</div>}
    </div>
  )
}
