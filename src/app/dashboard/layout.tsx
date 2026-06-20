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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dash-wrap  { display: flex; height: 100vh; overflow: hidden; }
        .dash-sb    { display: flex; }
        .dash-main  { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .dash-bnav  { display: none; }
        @media (max-width: 768px) {
          .dash-wrap { flex-direction: column; }
          .dash-sb   { display: none; }
          .dash-main { height: calc(100vh - 54px); }
          .dash-bnav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; }
        }
      `}</style>
      <div className="dash-wrap">
        <div className="dash-sb"><Sidebar /></div>
        <main className="dash-main">{children}</main>
      </div>
      <div className="dash-bnav"><BottomNav /></div>
    </>
  )
}