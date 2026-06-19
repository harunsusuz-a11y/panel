'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NAV = [
  { group: 'Ana', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  ]},
  { group: 'İş Yönetimi', items: [
    { href: '/dashboard/musteriler', label: 'CRM / Müşteriler', icon: '🏢' },
    { href: '/dashboard/projeler', label: 'Projeler', icon: '📁' },
    { href: '/dashboard/gorevler', label: 'Görev Yönetimi', icon: '✓' },
    { href: '/dashboard/takvim', label: 'Takvim', icon: '📅' },
  ]},
  { group: 'İçerik & Operasyon', items: [
    { href: '/dashboard/icerik', label: 'İçerik Merkezi', icon: '✏' },
    { href: '/dashboard/operasyon', label: 'Operasyon Merkezi', icon: '⚡' },
  ]},
  { group: 'Finans', items: [
    { href: '/dashboard/muhasebe', label: 'Muhasebe', icon: '🧾' },
    { href: '/dashboard/finans', label: 'Finans', icon: '💰' },
  ]},
  { group: 'Sistem', items: [
    { href: '/dashboard/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
    { href: '/dashboard/otomasyonlar', label: 'Otomasyonlar', icon: '🤖' },
    { href: '/dashboard/entegrasyonlar', label: 'Entegrasyonlar', icon: '🔌' },
    { href: '/dashboard/ayarlar', label: 'Sistem Ayarları', icon: '⚙' },
  ]},
]

export default function Sidebar({ user: _user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<{name:string, email:string} | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserInfo({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
          email: user.email || ''
        })
      } else {
        router.push('/login')
      }
    })
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userInfo?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '??'
  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside style={{width:220,background:'var(--s1)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100vh',flexShrink:0}}>
      <div style={{padding:'16px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:9}}>
        <div style={{width:28,height:28,background:'var(--gold)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><rect x="3" y="3" width="7" height="11" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Agency ERP</div>
          <div style={{fontSize:9,color:'var(--t3)'}}>Ajans Yönetim Sistemi</div>
        </div>
      </div>

      <nav style={{flex:1,overflowY:'auto',padding:'4px 0 12px'}}>
        {NAV.map(section => (
          <div key={section.group}>
            <div style={{padding:'14px 12px 3px',fontSize:9,fontWeight:700,letterSpacing:'0.08em',color:'var(--t3)',textTransform:'uppercase'}}>
              {section.group}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href)
              return (
                <div key={item.href} onClick={() => router.push(item.href)}
                  style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',margin:'1px 5px',borderRadius:6,
                    cursor:'pointer',fontSize:12,fontWeight:active?500:400,
                    color:active?'var(--gold)':'var(--t2)',
                    background:active?'var(--gold-d)':'transparent',
                    position:'relative',transition:'all .1s'}}>
                  {active && <div style={{position:'absolute',left:-5,top:'50%',transform:'translateY(-50%)',width:2.5,height:14,background:'var(--gold)',borderRadius:'0 2px 2px 0'}}/>}
                  <span style={{fontSize:14,width:16,textAlign:'center',flexShrink:0}}>{item.icon}</span>
                  <span style={{flex:1,lineHeight:1.2}}>{item.label}</span>
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div onClick={logout} title="Çıkış yap"
        style={{padding:'10px 12px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
        <div style={{width:26,height:26,borderRadius:'50%',background:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#000',flexShrink:0}}>
          {initials}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:500,color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {userInfo?.name || 'Yükleniyor...'}
          </div>
          <div style={{fontSize:9,color:'var(--t3)'}}>Çıkış için tıkla</div>
        </div>
      </div>
    </aside>
  )
}
