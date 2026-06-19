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
    { href:'/dashboard',               label:'Dashboard',      Icon:LayoutDashboard },
  ]},
  { group: 'İş Yönetimi', items: [
    { href:'/dashboard/musteriler',    label:'Müşteriler',     Icon:Users },
    { href:'/dashboard/projeler',      label:'Projeler',       Icon:FolderKanban },
    { href:'/dashboard/gorevler',      label:'Görevler',       Icon:CheckSquare },
    { href:'/dashboard/takvim',        label:'Takvim',         Icon:Calendar },
  ]},
  { group: 'İçerik', items: [
    { href:'/dashboard/icerik',        label:'İçerik Merkezi', Icon:FileEdit },
    { href:'/dashboard/operasyon',     label:'Operasyon',      Icon:Zap },
    { href:'/dashboard/gecikmeler',    label:'Gecikmeler',     Icon:Clock },
    { href:'/dashboard/onay',          label:'Onay Bekleyen',  Icon:ClipboardCheck },
  ]},
  { group: 'Finans', items: [
    { href:'/dashboard/muhasebe',      label:'Muhasebe',       Icon:FileText },
    { href:'/dashboard/finans',        label:'Finans',         Icon:DollarSign },
    { href:'/dashboard/performans',    label:'Performans',     Icon:TrendingUp },
  ]},
  { group: 'Sistem', items: [
    { href:'/dashboard/kullanicilar',  label:'Kullanıcılar',   Icon:UserCog },
    { href:'/dashboard/otomasyonlar',  label:'Otomasyonlar',   Icon:Bot },
    { href:'/dashboard/entegrasyonlar',label:'Entegrasyonlar', Icon:Plug },
    { href:'/dashboard/ayarlar',       label:'Ayarlar',        Icon:Settings },
  ]},
]

const ROLE_LABEL: Record<string,string> = { admin:'Yönetici', manager:'Müdür', member:'Üye' }

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('?')
  const [role, setRole] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name,role').eq('id', user.id).single().then(({ data }) => {
        const n = data?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
        setName(n)
        setInitials(n.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2))
        setRole(ROLE_LABEL[data?.role] || data?.role || '')
      })
    })
  }, [])

  const isActive = (href:string) => href==='/dashboard' ? pathname===href : pathname.startsWith(href)

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <style>{`
        .sb{width:216px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--glass-border);display:flex;flex-direction:column;height:100vh}
        .sb-logo{padding:13px 14px 12px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;gap:9px;flex-shrink:0}
        .sb-mark{width:28px;height:28px;border-radius:7px;background:var(--gold-g);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sb-nav{flex:1;overflow-y:auto;padding:8px 6px}
        .sb-nav::-webkit-scrollbar{width:0}
        .sb-group{font-size:9px;font-weight:600;letter-spacing:.08em;color:var(--t3);padding:10px 8px 3px;text-transform:uppercase}
        .sb-item{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:6px;font-size:12px;color:var(--t2);margin:1px 0;text-decoration:none;transition:background .1s,color .1s;position:relative;font-weight:400}
        .sb-item:hover:not(.act){color:var(--text);background:var(--s3)}
        .sb-item.act{color:var(--text);background:var(--s3);font-weight:500}
        .sb-item.act::before{content:'';position:absolute;left:-6px;top:5px;bottom:5px;width:2px;background:var(--gold);border-radius:0 2px 2px 0}
        .sb-icon{flex-shrink:0;color:var(--t3)}
        .sb-item.act .sb-icon{color:var(--gold)}
        .sb-user{padding:10px 12px;border-top:1px solid var(--glass-border);display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0;transition:background .1s}
        .sb-user:hover{background:var(--s3)}
        .sb-avatar{width:26px;height:26px;border-radius:50%;background:var(--gold-g);display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;color:#000;flex-shrink:0}
      `}</style>
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-mark">
            <LayoutDashboard size={13} color="#000" strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{fontSize:12.5,fontWeight:700,color:'var(--text)',letterSpacing:'-.2px',lineHeight:1.3}}>Agency ERP</div>
            <div style={{fontSize:9,color:'var(--t3)',marginTop:1}}>Operasyon Yönetimi</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(section => (
            <div key={section.group}>
              <div className="sb-group">{section.group}</div>
              {section.items.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} className={`sb-item${active?' act':''}`}>
                    <span className="sb-icon"><Icon size={13} strokeWidth={1.8}/></span>
                    <span style={{flex:1}}>{label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sb-user" onClick={logout}>
          <div className="sb-avatar">{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11.5,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name||'...'}</div>
            <div style={{fontSize:9.5,color:'var(--t3)',marginTop:1}}>{role}</div>
          </div>
          <LogOut size={12} color="var(--t3)" strokeWidth={1.8}/>
        </div>
      </aside>
    </>
  )
}