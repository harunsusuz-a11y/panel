'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck, X, AlertCircle, CheckCircle2, MessageSquare, UserCog } from 'lucide-react'
import { fmtRelative } from '@/lib/utils'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  task_assigned:    { icon: UserCog,      color: 'var(--ac)',    bg: 'var(--ac2)'    },
  task_overdue:     { icon: AlertCircle,  color: 'var(--red)',   bg: 'var(--red2)'   },
  approval_approved:{ icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green2)' },
  approval_rejected:{ icon: X,            color: 'var(--red)',   bg: 'var(--red2)'   },
  approval_pending: { icon: AlertCircle,  color: 'var(--amber)', bg: 'var(--amber2)' },
  comment_added:    { icon: MessageSquare,color: 'var(--blue)',  bg: 'var(--blue2)'  },
  client_response:  { icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green2)' },
}

export default function NotificationBell() {
  const [notifs,  setNotifs]  = useState<any[]>([])
  const [open,    setOpen]    = useState(false)
  const [myId,    setMyId]    = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  async function load(uid: string) {
    const { data } = await createClient().from('notifications')
      .select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(20)
    setNotifs(data || [])
  }

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setMyId(user.id)
      load(user.id)
      // Realtime
      channelRef.current = sb.channel(`notif-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          async (payload: any) => {
            load(user.id)
            // Push notification gönder (sayfa arka planda olabilir)
            if (Notification.permission === 'granted' && payload.new) {
              const n = payload.new
              // Service worker üzerinden push (eğer kayıtlıysa)
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready.catch(() => null)
                if (reg) {
                  reg.showNotification(n.title || 'Daydream', {
                    body: n.body || '',
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-192.png',
                    vibrate: [200, 100, 200],
                    tag: n.id,
                    data: { url: '/dashboard/onay' }
                  }).catch(() => {})
                }
              }
            }
          })
        .subscribe()
    })
    // Close on outside click
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      if (channelRef.current) sb.removeChannel(channelRef.current)
    }
  }, [])

  async function markRead(id: string) {
    await createClient().from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await createClient().from('notifications').update({ is_read: true }).eq('user_id', myId).eq('is_read', false)
    setNotifs(ns => ns.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <style>{`
        .nb-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:320px;background:var(--s1);border:1px solid var(--bdr2);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999;overflow:hidden;animation:popIn .18s ease both}
        .nb-item{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s}
        .nb-item:last-child{border-bottom:none}
        .nb-item:hover{background:var(--s2)}
        .nb-item.unread{background:rgba(124,106,247,.04)}
        @media(max-width:480px){.nb-dropdown{width:calc(100vw - 32px);right:-80px}}
      `}</style>

      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 9, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bdr2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}>
        <Bell size={15} style={{ color: unread > 0 ? 'var(--amber)' : 'var(--tx3)' }} strokeWidth={unread > 0 ? 2.5 : 1.8} />
        {unread > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--bg)' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--bdr)' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Bildirimler {unread > 0 && <span style={{ color: 'var(--ac)', fontSize: 11 }}>({unread} okunmamış)</span>}</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--tx3)', fontSize: 11.5, cursor: 'pointer' }}>
                <CheckCheck size={12} />Tümünü oku
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                <Bell size={24} style={{ opacity: .2, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                Bildirim yok
              </div>
            ) : notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.task_assigned
              const Icon = cfg.icon
              return (
                <div key={n.id} className={`nb-item${!n.is_read ? ' unread' : ''}`} onClick={() => markRead(n.id)}>
                  {!n.is_read && <div style={{ position: 'absolute', left: 6, width: 5, height: 5, borderRadius: '50%', background: 'var(--ac)', marginTop: 4 }} />}
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: cfg.color }} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: n.is_read ? 400 : 600, lineHeight: 1.4, marginBottom: 2 }}>{n.title}</p>
                    {n.body && <p style={{ fontSize: 11.5, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                    <p style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 3 }}>{fmtRelative(n.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
