'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, FolderOpen, CheckSquare, Users, FileText, X } from 'lucide-react'

const ICONS: Record<string,any> = { projects: FolderOpen, tasks: CheckSquare, clients: Users, contents: FileText }
const LABELS: Record<string,string> = { projects:'Proje', tasks:'Görev', clients:'Müşteri', contents:'İçerik' }
const ROUTES: Record<string,string> = { projects:'/dashboard/projeler', tasks:'/dashboard/gorevler', clients:'/dashboard/musteriler', contents:'/dashboard/icerik' }

export default function GlobalSearch() {
  const router = useRouter()
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref    = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    const kbHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', kbHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', kbHandler) }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true); setOpen(true)
      const sb = createClient()
      const term = `%${q.trim()}%`
      const [p, t, c, ct] = await Promise.all([
        sb.from('projects').select('id,name').ilike('name', term).limit(3),
        sb.from('tasks').select('id,title,status').ilike('title', term).limit(3),
        sb.from('clients').select('id,name').ilike('name', term).limit(3),
        sb.from('contents').select('id,title,status').ilike('title', term).limit(3),
      ])
      const merged = [
        ...(p.data||[]).map((x:any) => ({ ...x, _type:'projects', _label: x.name })),
        ...(t.data||[]).map((x:any) => ({ ...x, _type:'tasks',    _label: x.title })),
        ...(c.data||[]).map((x:any) => ({ ...x, _type:'clients',  _label: x.name })),
        ...(ct.data||[]).map((x:any) => ({ ...x, _type:'contents',_label: x.title })),
      ]
      setResults(merged)
      setLoading(false)
    }, 280)
  }, [q])

  function go(item: any) {
    router.push(ROUTES[item._type])
    setQ(''); setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <style>{`
        .gs-drop{position:absolute;top:calc(100%+6px);left:50%;transform:translateX(-50%);width:340px;background:var(--s1);border:1px solid var(--bdr2);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999;overflow:hidden;animation:popIn .15s ease both}
        .gs-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s}
        .gs-item:hover{background:var(--s2)}
        .gs-group{font-size:9.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;padding:8px 14px 4px}
        @media(max-width:600px){.gs-drop{width:calc(100vw - 24px);left:50%;transform:translateX(-50%)}}
      `}</style>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--tx3)', pointerEvents: 'none' }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          placeholder="Ara... (Proje, görev, müşteri)"
          style={{ padding: '6px 28px 6px 30px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 12.5, outline: 'none', width: 220, transition: 'border-color .15s, width .2s' }}
          
        />
        {q && <button onClick={() => { setQ(''); setOpen(false) }} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={12} /></button>}
      </div>

      {open && (
        <div className="gs-drop">
          {loading ? (
            <div style={{ padding: '14px', textAlign: 'center', color: 'var(--tx3)', fontSize: 12.5 }}>Aranıyor...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: 'var(--tx3)', fontSize: 12.5 }}>Sonuç bulunamadı</div>
          ) : (
            (() => {
              const grouped: Record<string, any[]> = {}
              results.forEach(r => { if (!grouped[r._type]) grouped[r._type] = []; grouped[r._type].push(r) })
              return Object.entries(grouped).map(([type, items]) => {
                const Icon = ICONS[type] || Search
                return (
                  <div key={type}>
                    <div className="gs-group">{LABELS[type]}</div>
                    {items.map(item => (
                      <div key={item.id} className="gs-item" onClick={() => go(item)}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={13} style={{ color: 'var(--tx3)' }} strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item._label}</p>
                          <p style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 1 }}>{LABELS[type]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
            })()
          )}
        </div>
      )}
    </div>
  )
}
