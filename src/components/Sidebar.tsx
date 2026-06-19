'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, Calendar,
  FileEdit, Zap, Clock, ClipboardCheck, FileText, DollarSign,
  TrendingUp, UserCog, Bot, Plug, Settings, LogOut
} from 'lucide-react'

const NAV = [
  { group: 'Genel', items: [
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ]},
  { group: 'İş Yönetimi', items: [
    { href: '/dashboard/musteriler',  label: 'CRM / Müşteriler', Icon: Users },
    { href: '/dashboard/projeler',    label: 'Projeler',         Icon: FolderKanban },
    { href: '/dashboard/gorevler',    label: 'Görev Yönetimi',   Icon: CheckSquare },
    { href: '/dashboard/takvim',      label: 'Takvim',           Icon: Calendar },
  ]},
  { group: 'İçerik & Operasyon', items: [
    { href: '/dashboard/icerik',      label: 'İçerik Merkezi',   Icon: FileEdit },
    { href: '/dashboard/operasyon',   label: 'Operasyon',        Icon: Zap },
    { href: '/dashboard/gecikmeler',  label: 'Gecikmeler',       Icon: Clock },
    { href: '/dashboard/onay',        label: 'Onay Bekleyen',    Icon: ClipboardCheck },
  ]},
  { group: 'Finans', items: [
    { href: '/dashboard/muhasebe',    label: 'Muhasebe',         Icon: FileText },
    { href: '/dashboard/finans',      label: 'Finans',           Icon: DollarSign },
    { href: '/dashboard/performans',  label: 'Performans',       Icon: TrendingUp },
  ]},
  { group: 'Sistem', items: [
    { href: '/dashboard/kullanicilar',   label: 'Kullanıcılar',    Icon: UserCog },
    { href: '/dashboard/otomasyonlar',   label: 'Otomasyonlar',    Icon: Bot },
    { href: '/dashboard/entegrasyonlar', label: 'Entegrasyonlar',  Icon: Plug },
    { href: '/dashboard/ayarlar',        label: 'Ayarlar',         Icon: Settings },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('?')
  const [role, setRole] = useState('Admin')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
        setName(n)
        setInitials(n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2))
        setRole(user.user_metadata?.role || 'Admin')
      }
    })
  }, [])

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <style>{`
        .sb{width:216px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--glass-border);display:flex;flex-direction:column;height:100vh}
        .sb-logo{padding:13px 13px 11px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;gap:9px;flex-shrink:0}
        .sb-mark{width:28px;height:28px;border-radius:7px;background:var(--gold-g);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sb-name{font-size:12.5px;font-weight:700;color:var(--text);letter-spacing:-0.2px;line-height:1.2}
        .sb-sub{font-size:9px;color:var(--t3);font-weight:500;margin-top:1px}
        .sb-nav{flex:1;overflow-y:auto;padding:4px 7px 8px}
        .sb-nav::-webkit-scrollbar{width:2px}
        .sb-nav::-webkit-scrollbar-thumb{background:var(--s5)}
        .sb-group{font-size:8.5px;font-weight:700;letter-spacing:0.09em;color:var(--t3);text-transform:uppercase;padding:9px 7px 3px}
        .sb-item{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--t2);border:1px solid transparent;margin:1px 0;text-decoration:none;transition:background 0.1s,color 0.1s}
        .sb-item:hover{color:var(--text);background:var(--s3)}
        .sb-item.act{color:var(--gold);background:var(--gold-d);border-color:rgba(230,168,23,0.13);font-weight:600}
        .sb-icon{flex-shrink:0;opacity:0.5;display:flex}
        .sb-item.act .sb-icon{opacity:1}
        .sb-dot{width:4px;height:4px;border-radius:50%;background:var(--gold);margin-left:auto;flex-shrink:0}
        .sb-user{padding:9px 11px;border-top:1px solid var(--glass-border);display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0;transition:background 0.1s}
        .sb-user:hover{background:var(--s3)}
        .sb-avatar{width:26px;height:26px;border-radius:50%;background:var(--gold-g);display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;color:#000;flex-shrink:0}
      `}</style>
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-mark">
            <LayoutDashboard size={13} color="#000" strokeWidth={2.2}/>
          </div>
          <div>
            <div className="sb-name">Agency ERP</div>
            <div className="sb-sub">Operasyon Yönetimi</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(section => (
            <div key={section.group}>
              <div className="sb-group">{section.group}</div>
              {section.items.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} className={`sb-item${active ? ' act' : ''}`}>
                    <span className="sb-icon"><Icon size={13} strokeWidth={1.8}/></span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <div className="sb-dot"/>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sb-user" onClick={logout}>
          <div className="sb-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || '...'}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{role} · Çıkış yap</div>
          </div>
          <LogOut size={12} color="var(--t3)" strokeWidth={1.8}/>
        </div>
      </aside>
    </>
  )
}
