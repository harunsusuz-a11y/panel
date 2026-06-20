'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, Building2, FolderOpen, CheckSquare, Receipt, TrendingUp, Phone, Mail, FileText } from 'lucide-react'
import { fmtDateTime, fmtDeadline } from '@/lib/utils'

export default function MusterilerPage() {
  const [clients,  setClients]  = useState<any[]>([])
  const [sel,      setSel]      = useState<any>(null)
  const [detail,   setDetail]   = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [tab,      setTab]      = useState<'projeler'|'gorevler'|'icerik'|'finans'>('projeler')
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', status:'active', notes:'' })

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  const load = useCallback(async () => {
    const { data } = await createClient().from('clients').select('*').order('name')
    setClients(data||[]); setLoading(false)
  },[])
  useEffect(()=>{ load() },[load])

  async function loadDetail(c: any) {
    setSel(c); setTab('projeler')
    const sb = createClient()
    const [p, t, ct, tr] = await Promise.all([
      sb.from('projects').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('tasks').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('contents').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('transactions').select('*').eq('client_id',c.id).order('date',{ascending:false}),
    ])
    setDetail({ projects: p.data||[], tasks: t.data||[], contents: ct.data||[], transactions: tr.data||[] })
  }

  async function add() {
    if (!form.name.trim()) { showToast('Hata: İsim zorunlu'); return }
    setSaving(true)
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('clients').insert({...form, created_by:user?.id})
    setSaving(false)
    if (error) showToast('Hata: '+error.message)
    else { showToast('Müşteri eklendi!'); setModal(false); load(); setForm({name:'',email:'',phone:'',company:'',status:'active',notes:''}) }
  }

  async function update(id:string, data:any) {
    await createClient().from('clients').update(data).eq('id',id)
    setClients(cs => cs.map(c => c.id===id ? {...c,...data} : c))
    if (sel?.id===id) setSel((s:any) => s ? {...s,...data} : null)
    showToast('Güncellendi!')
  }

  const income  = (detail?.transactions||[]).filter((t:any)=>t.type==='income').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const expense = (detail?.transactions||[]).filter((t:any)=>t.type==='expense').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const fmt = (v:number) => `₺${Math.round(v).toLocaleString('tr-TR')}`

  const ST_PROJ: Record<string,any> = { active:{l:'Aktif',c:'var(--green)'}, paused:{l:'Duraklatıldı',c:'var(--amber)'}, completed:{l:'Tamamlandı',c:'var(--blue)'}, cancelled:{l:'İptal',c:'var(--red)'} }
  const ST_TASK: Record<string,any> = { todo:{l:'Bekliyor',c:'var(--tx3)'}, in_progress:{l:'Devam',c:'var(--blue)'}, review:{l:'Kontrol',c:'var(--amber)'}, done:{l:'Tamam',c:'var(--green)'} }
  const ST_CONT: Record<string,any> = { draft:{l:'Taslak',c:'var(--tx3)'}, pending:{l:'İç Onay',c:'var(--amber)'}, approved:{l:'Onaylandı',c:'var(--green)'}, revision:{l:'Revizyon',c:'var(--red)'}, published:{l:'Yayında',c:'var(--ac)'} }

  return (
    <>
      <style>{`
        .ms-wrap{flex:1;display:flex;overflow:hidden}
        .ms-l{width:240px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .ms-d{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .ms-card{padding:10px 12px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:2.5px solid transparent}
        .ms-card:hover:not(.sel){background:var(--s2)}
        .ms-card.sel{background:var(--ac2);border-left-color:var(--ac)}
        .ms-stat{background:var(--s2);border-radius:9px;padding:12px 14px;border:1px solid var(--bdr);text-align:center}
        .ms-tab{padding:9px 14px;font-size:12.5px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap;transition:color .12s;display:flex;align-items:center;gap:5px}
        .ms-tab:hover{color:var(--tx)}
        .ms-tab.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:700}
        @media(max-width:768px){.ms-wrap{flex-direction:column}.ms-l{width:100%;border-right:none;border-bottom:1px solid var(--bdr);max-height:220px}.ms-d{min-height:0}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Müşteriler" subtitle={`${clients.length} müşteri`} action={
          <button className="btn" onClick={()=>setModal(true)}><Plus size={14} strokeWidth={2}/>Müşteri Ekle</button>
        }/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        <div className="ms-wrap">
          {/* Liste */}
          <div className="ms-l">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <p style={{padding:16,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
              : clients.map(c=>(
                <div key={c.id} className={`ms-card${sel?.id===c.id?' sel':''}`} onClick={()=>loadDetail(c)}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:30,height:30,borderRadius:8,background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>
                      {(c.name||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:sel?.id===c.id?'var(--ac)':'var(--tx)'}}>{c.name}</p>
                      <p style={{fontSize:10.5,color:c.status==='active'?'var(--green)':'var(--tx3)',marginTop:1}}>{c.status==='active'?'Aktif':'Pasif'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="ms-d">
              {/* Header */}
              <div style={{padding:'14px 16px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                <div style={{width:42,height:42,borderRadius:10,background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,flexShrink:0}}>
                  {(sel.name||'?').slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:15,fontWeight:700}}>{sel.name}</p>
                  <div style={{display:'flex',gap:10,marginTop:3,flexWrap:'wrap'}}>
                    {sel.email&&<span style={{fontSize:11.5,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Mail size={10} strokeWidth={2}/>{sel.email}</span>}
                    {sel.phone&&<span style={{fontSize:11.5,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Phone size={10} strokeWidth={2}/>{sel.phone}</span>}
                  </div>
                </div>
                <select value={sel.status} onChange={e=>update(sel.id,{status:e.target.value})} className="inp" style={{width:'auto',fontSize:11.5,padding:'4px 8px',height:'auto'}}>
                  <option value="active">Aktif</option><option value="passive">Pasif</option>
                </select>
                <button onClick={()=>{setSel(null);setDetail(null)}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18}}>✕</button>
              </div>

              {/* Özet stats */}
              {detail && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'12px 16px',borderBottom:'1px solid var(--bdr)',flexShrink:0}}>
                  <div className="ms-stat">
                    <p style={{fontSize:20,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--blue)',lineHeight:1}}>{detail.projects.length}</p>
                    <p style={{fontSize:10,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>Proje</p>
                  </div>
                  <div className="ms-stat">
                    <p style={{fontSize:20,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--ac)',lineHeight:1}}>{detail.tasks.length}</p>
                    <p style={{fontSize:10,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>Görev</p>
                  </div>
                  <div className="ms-stat">
                    <p style={{fontSize:20,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--amber)',lineHeight:1}}>{detail.contents.length}</p>
                    <p style={{fontSize:10,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>İçerik</p>
                  </div>
                  <div className="ms-stat">
                    <p style={{fontSize:14,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--green)',lineHeight:1}}>{fmt(income)}</p>
                    <p style={{fontSize:10,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>Gelir</p>
                  </div>
                </div>
              )}

              {/* Sekmeler */}
              <div style={{display:'flex',borderBottom:'1px solid var(--bdr)',overflowX:'auto',background:'var(--s1)',flexShrink:0}}>
                {[
                  {k:'projeler', l:'Projeler',    Icon:FolderOpen },
                  {k:'gorevler', l:'Görevler',    Icon:CheckSquare},
                  {k:'icerik',   l:'İçerik',      Icon:FileText   },
                  {k:'finans',   l:'Finans',       Icon:Receipt    },
                ].map(({k,l,Icon})=>(
                  <button key={k} className={`ms-tab${tab===k?' on':''}`} onClick={()=>setTab(k as any)}>
                    <Icon size={12} strokeWidth={1.8}/>{l}
                    {detail && <span style={{fontSize:10,color:tab===k?'var(--ac)':'var(--tx3)',fontWeight:700}}>
                      ({k==='projeler'?detail.projects.length:k==='gorevler'?detail.tasks.length:k==='icerik'?detail.contents.length:detail.transactions.length})
                    </span>}
                  </button>
                ))}
              </div>

              <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px'}}>
                {!detail ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p> : (<>
                  {/* Projeler */}
                  {tab==='projeler'&&(<>
                    {detail.projects.length===0?<p style={{color:'var(--tx3)',fontSize:13,padding:'20px 0',textAlign:'center'}}>Proje yok</p>
                    :detail.projects.map((p:any)=>{
                      const s=ST_PROJ[p.status]||ST_PROJ.active
                      return (
                        <div key={p.id} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <p style={{fontSize:13,fontWeight:600,flex:1}}>{p.name}</p>
                            <span style={{fontSize:10.5,fontWeight:700,color:s.c,background:`${s.c}15`,padding:'2px 8px',borderRadius:5}}>{s.l}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="prog" style={{flex:1}}><div className="prog-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--ac)':'var(--red)'}}/></div>
                            <span style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--tx3)'}}>{p.progress||0}%</span>
                          </div>
                          {p.deadline&&<p style={{fontSize:11,color:'var(--tx3)',marginTop:5}}>Bitiş: {fmtDeadline(p.deadline)}</p>}
                        </div>
                      )
                    })}
                  </>)}
                  {/* Görevler */}
                  {tab==='gorevler'&&(<>
                    {detail.tasks.length===0?<p style={{color:'var(--tx3)',fontSize:13,padding:'20px 0',textAlign:'center'}}>Görev yok</p>
                    :detail.tasks.map((t:any)=>{
                      const s=ST_TASK[t.status]||ST_TASK.todo
                      const overdue=t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()
                      return (
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:9,marginBottom:7}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:overdue?'var(--red)':s.c,flexShrink:0}}/>
                          <p style={{flex:1,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                          <span style={{fontSize:10.5,color:s.c,fontWeight:600,flexShrink:0}}>{s.l}</span>
                          {t.due_date&&<span style={{fontSize:10.5,color:overdue?'var(--red)':'var(--tx3)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{fmtDeadline(t.due_date)}</span>}
                        </div>
                      )
                    })}
                  </>)}
                  {/* İçerik */}
                  {tab==='icerik'&&(<>
                    {detail.contents.length===0?<p style={{color:'var(--tx3)',fontSize:13,padding:'20px 0',textAlign:'center'}}>İçerik yok</p>
                    :detail.contents.map((c:any)=>{
                      const s=ST_CONT[c.status]||ST_CONT.draft
                      return (
                        <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:9,marginBottom:7}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:s.c,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</p>
                            <p style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{c.type} · {fmtDeadline(c.publish_date)}</p>
                          </div>
                          <span style={{fontSize:10.5,color:s.c,fontWeight:600,flexShrink:0}}>{s.l}</span>
                        </div>
                      )
                    })}
                  </>)}
                  {/* Finans */}
                  {tab==='finans'&&(
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
                        <div style={{background:'var(--green2)',borderRadius:9,padding:'10px',textAlign:'center'}}>
                          <p style={{fontSize:14,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{fmt(income)}</p>
                          <p style={{fontSize:10,color:'var(--tx3)',marginTop:2}}>Gelir</p>
                        </div>
                        <div style={{background:'var(--red2)',borderRadius:9,padding:'10px',textAlign:'center'}}>
                          <p style={{fontSize:14,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{fmt(expense)}</p>
                          <p style={{fontSize:10,color:'var(--tx3)',marginTop:2}}>Gider</p>
                        </div>
                        <div style={{background:'var(--ac2)',borderRadius:9,padding:'10px',textAlign:'center'}}>
                          <p style={{fontSize:14,fontWeight:700,color:'var(--ac)',fontFamily:'JetBrains Mono,monospace'}}>{fmt(income-expense)}</p>
                          <p style={{fontSize:10,color:'var(--tx3)',marginTop:2}}>Net</p>
                        </div>
                      </div>
                      {detail.transactions.length===0?<p style={{color:'var(--tx3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>İşlem yok</p>
                      :detail.transactions.map((t:any)=>(
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:9,marginBottom:6}}>
                          <span style={{fontSize:16,flexShrink:0}}>{t.type==='income'?'↑':'↓'}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description}</p>
                            <p style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{fmtDeadline(t.date)}</p>
                          </div>
                          <span style={{fontSize:13,fontWeight:700,color:t.type==='income'?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                            {t.type==='income'?'+':'−'}₺{Number(t.amount).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>)}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)',fontSize:13,flexDirection:'column',gap:8}}>
              <Building2 size={28} strokeWidth={1.5} style={{opacity:.3}}/>Müşteri seçin
            </div>
          )}
        </div>
      </div>

      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Müşteri Ekle</p>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Müşteri Adı *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="inp" autoFocus/></div>
              <div className="modal-grid">
                <div><label className="label">E-posta</label><input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="inp"/></div>
                <div><label className="label">Telefon</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="inp"/></div>
                <div><label className="label">Şirket</label><input value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} className="inp"/></div>
                <div><label className="label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="inp">
                    <option value="active">Aktif</option><option value="passive">Pasif</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Notlar</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="inp" rows={2}/></div>
              <button className="btn" onClick={add} disabled={saving} style={{width:'100%',justifyContent:'center',padding:'10px'}}>{saving?'Kaydediliyor...':'Müşteri Ekle'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
