'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import SupportButton from '@/components/SupportButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
      else setReady(true)
    })
  }, [])

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,var(--ac),#5b4de0)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s ease-in-out infinite', boxShadow: '0 0 20px rgba(124,106,247,.4)' }}>
        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      </div>
      <p style={{ color: 'var(--tx3)', fontSize: 12.5 }}>Yükleniyor...</p>
    </div>
  )

  return (
    <>
      <style>{`
        .dw{display:flex;height:100vh;overflow:hidden}
        .dsb{display:flex}
        .dm{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
        .mm-mobile{display:none}
        @media(max-width:768px){
          .dw{flex-direction:column}
          .dsb{display:none}
          .dm{height:100vh;padding-top:0}
          .mm-mobile{display:block}
          .topbar{padding-left:56px!important}
        }
      `}</style>
      <div className="dw">
        <div className="dsb"><Sidebar /></div>
        <div className="mm-mobile"><MobileMenu /></div>
        <main className="dm">{children}</main>
      </div>
      {/* Her sayfada görünen bileşenler */}
      <SupportButton />
    </>
  )
}
