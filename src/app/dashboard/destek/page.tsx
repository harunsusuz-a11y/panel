'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { LifeBuoy, Clock, CheckCircle2, CircleDot, X } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

const TYPE_MAP: Record<string,{label:string;color:string;bg:string}> = {
  oneri:   { label:'💡 Öneri',   color:'var(--blue)',  bg:'var(--blue2)'  },
  hata:    { label:'🐛 Hata',    color:'var(--red)',   bg:'var(--red2)'   },
  sikayet: { label:'😤 Şikayet', color:'var(--amber)', bg:'var(--amber2)' },
  diger:   { label:'💬 Diğer',   color:'var(--tx2)',   bg:'var(--s3)'     },
}
const STATUS_MAP: Record<string,{label:string;color:string;Icon:any}> = {
  open:       { label:'Açık',        color:'var(--amber)', Icon:Clock         },
  inprogress: { label:'İnceleniyor', color:'var(--blue)',  Icon:CircleDot     },
  resolved:   { label:'Çözüldü',     color:'var(--green)', Icon:CheckCircle2  },
}

export default function DestekPage() {
  const [tickets, setTickets]   = useState<any[]>([])
  const [profiles,setProfiles]  = useState<Record<string,any>>({})
  const [loading, setLoading]   = useState(true)
  const [sel,     setSel]       = useState<any>(null)
  const [filter,  setFilter]    = useState<'all'|'open'|'inprogress'|'resolved'>('all')
  const [toast,   setToast]     = useState('')

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }

  async function load() {
    const sb = createClient()
    const { data: t } = await sb
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    const { data: pr } = await sb
      .from('profiles')
      .select('id,full_name,department,role')
    const prMap: Record<string,any> = {}
    ;(pr||[]).forEach((p:any) => { prMap[p.id] = p })
    setProfiles(prMap)
    setTickets(t||[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id:string, status:string) {
    const {error} = await createClient()
      .from('support_tickets').update({status, updated_at: new Date().toISOString()}).eq('id',id)
    if (error) { showToast('Hata: '+error.message); return }
    setTickets(ts => ts.map(t => t.id===id ? {...t,status} : t))
    if (sel?.id===id) setSel((s:any) => s ? {...s,status} : null)
    showToast('✓ Durum güncellendi')
  }

  const filtered = filter==='all' ? tickets : tickets.filter(t=>t.status===filter)

  const counts = {
    all:        tickets.length,
    open:       tickets.filter(t=>t.status==='open').length,
    inprogress: tickets.filter(t=>t.status==='inprogress').length,
    resolved:   tickets.filter(t=>t.status==='resolved').length,
  }

  return (
    <>
      <style>{`
        .dk-wrap{flex:1;display:flex;overflow:hidden}
        .dk-l{width:320px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .dk-r{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .dk-item{padding:13px 14px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:3px solid transparent}
        .dk-item:hover:not(.sel){background:var(--s2)}
        .dk-item.sel{background:var(--ac2);border-left-color:var(--ac)}
        @media(max-width:768px){.dk-wrap{flex-direction:column}.dk-l{width:100%;max-height:260px}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Destek Talepleri" subtitle={`${counts.all} toplam talep`} />
        {toast && <div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        {/* Filtre */}
        <div style={{display:'flex',gap:6,padding:'10px 14px',borderBottom:'1px solid var(--bdr)',background:'var(--s1)',overflowX:'auto',flexShrink:0}}>
          {(['all','open','inprogress','resolved'] as const).map(f => {
            const labels = {all:'Tümü',open:'Açık',inprogress:'İnceleniyor',resolved:'Çözüldü'}
            const colors = {all:'var(--tx2)',open:'var(--amber)',inprogress:'var(--blue)',resolved:'var(--green)'}
            return (
              <button key={f} onClick={()=>setFilter(f)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:8,border:`1px solid ${filter===f?colors[f]:'var(--bdr)'}`,background:filter===f?`${colors[f]}15`:'var(--s2)',color:filter===f?colors[f]:'var(--tx2)',fontSize:12.5,fontWeight:filter===f?700:400,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                {labels[f]}
                <span style={{fontSize:11,fontWeight:700,background:filter===f?`${colors[f]}25`:'var(--s3)',color:filter===f?colors[f]:'var(--tx3)',padding:'0px 6px',borderRadius:4}}>{counts[f]}</span>
              </button>
            )
          })}
        </div>

        <div className="dk-wrap">
          {/* Liste */}
          <div className="dk-l">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <p style={{padding:16,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
              : filtered.length===0 ? <p style={{padding:16,color:'var(--tx3)',fontSize:13,textAlign:'center'}}>Talep yok</p>
              : filtered.map(t => {
                const tp = TYPE_MAP[t.type]||TYPE_MAP.diger
                const st = STATUS_MAP[t.status]||STATUS_MAP.open
                const pr = profiles[t.user_id]
                return (
                  <div key={t.id} className={`dk-item${sel?.id===t.id?' sel':''}`} onClick={()=>setSel(t)}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',flex:1,minWidth:0}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:5,background:tp.bg,color:tp.color,flexShrink:0}}>{tp.label}</span>
                        <span style={{fontSize:11,fontWeight:700,color:st.color,flexShrink:0}}>· {st.label}</span>
                      </div>
                      <span style={{fontSize:10,color:'var(--tx3)',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{new Date(t.created_at).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'})}</span>
                    </div>
                    <p style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{t.title}</p>
                    <p style={{fontSize:11,color:'var(--tx3)'}}>
                      {pr?.full_name || 'Bilinmeyen'} · {pr?.department || pr?.role || '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detay */}
          {sel ? (() => {
            const tp = TYPE_MAP[sel.type]||TYPE_MAP.diger
            const st = STATUS_MAP[sel.status]||STATUS_MAP.open
            const pr = profiles[sel.user_id]
            return (
              <div className="dk-r">
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--s2)'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:5,background:tp.bg,color:tp.color}}>{tp.label}</span>
                      <span style={{fontSize:12,fontWeight:700,color:st.color}}>· {st.label}</span>
                    </div>
                    <p style={{fontSize:15,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sel.title}</p>
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',flexShrink:0}}><X size={16}/></button>
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
                  {/* Kişi bilgisi */}
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'var(--s2)',borderRadius:10,border:'1px solid var(--bdr)',marginBottom:14}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>
                      {(pr?.full_name||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{fontSize:13.5,fontWeight:700}}>{pr?.full_name||'Bilinmeyen'}</p>
                      <p style={{fontSize:11.5,color:'var(--tx3)'}}>{pr?.department||pr?.role||'—'}</p>
                    </div>
                    <div style={{marginLeft:'auto',textAlign:'right'}}>
                      <p style={{fontSize:11,color:'var(--tx3)'}}>Tarih</p>
                      <p style={{fontSize:12,fontWeight:600,fontFamily:'JetBrains Mono,monospace'}}>{fmtDateTime(sel.created_at)}</p>
                    </div>
                  </div>

                  {/* Not */}
                  {sel.note ? (
                    <div style={{background:'var(--s2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'14px',marginBottom:16}}>
                      <p style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Detay / Not</p>
                      <p style={{fontSize:13.5,color:'var(--tx)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{sel.note}</p>
                    </div>
                  ) : (
                    <div style={{background:'var(--s2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'14px',marginBottom:16}}>
                      <p style={{fontSize:13,color:'var(--tx3)',fontStyle:'italic'}}>Not eklenmemiş</p>
                    </div>
                  )}

                  {/* Durum güncelle */}
                  <div>
                    <p style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>Durumu Güncelle</p>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {Object.entries(STATUS_MAP).map(([k,v]) => {
                        const active = sel.status===k
                        return (
                          <button key={k} onClick={()=>!active&&updateStatus(sel.id,k)}
                            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:`1px solid ${active?v.color:'var(--bdr)'}`,background:active?`${v.color}20`:'var(--s2)',color:active?v.color:'var(--tx2)',fontSize:13,fontWeight:active?700:400,cursor:active?'default':'pointer',transition:'all .12s'}}>
                            <v.Icon size={13} strokeWidth={2}/>
                            {v.label}
                            {active && <span style={{fontSize:10,fontWeight:700}}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--tx3)',fontSize:13}}>
              <LifeBuoy size={28} strokeWidth={1.5} style={{opacity:.3}}/>
              Talep seçin
            </div>
          )}
        </div>
      </div>
    </>
  )
}
