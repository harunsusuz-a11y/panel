'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
      else setReady(true)
    })
  }, [])

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
    </div>
  )

  return (
    <>
      <style>{`
        .dw{display:flex;height:100vh;overflow:hidden}
        .dsb{display:flex}
        .dm{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
        .dbn{display:none}
        @media(max-width:768px){
          .dw{flex-direction:column}
          .dsb{display:none}
          .dm{height:calc(100vh - 54px)}
          .dbn{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:100}
        }
      `}</style>
      <div className="dw">
        <div className="dsb"><Sidebar /></div>
        <main className="dm">{children}</main>
      </div>
      <div className="dbn"><BottomNav /></div>
    </>
  )
}
