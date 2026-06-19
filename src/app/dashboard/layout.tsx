'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
      else setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--t2)', fontSize: 13 }}>Yükleniyor...</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dashboard-wrap { display: flex; height: 100vh; overflow: hidden; }
        .sidebar-wrap { display: flex; }
        .main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .bottom-nav-wrap { display: none; }
        @media (max-width: 768px) {
          .dashboard-wrap { flex-direction: column; }
          .sidebar-wrap { display: none; }
          .main-content { height: calc(100vh - 56px); padding-bottom: 0; }
          .bottom-nav-wrap { display: flex; }
        }
      `}</style>
      <div className="dashboard-wrap">
        <div className="sidebar-wrap">
          <Sidebar />
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
      <div className="bottom-nav-wrap" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        <BottomNav />
      </div>
    </>
  )
}