'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const STATUS_MAP: Record<string,any> = {
  pending:  {l:'Bekliyor',   c:'var(--amber)', bg:'var(--amber-d)'},
  approved: {l:'Onaylandı',  c:'var(--green)', bg:'var(--green-d)'},
  rejected: {l:'Reddedildi', c:'var(--red)',   bg:'var(--red-d)'},
}
const TYPE_MAP: Record<string,string> = { content:'İçerik', project:'Proje', invoice:'Fatura', other:'Diğer' }
const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }

export default function OnayPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('pending')
  const [form, setForm] = useState({ title:'', type:'content', notes:'' })
  const [currentUser, setCurrentUser] = useState<any>(null)

  async function load() {
    const sb = createClient()
    const [a, u] = await Promise.all([
      sb.from('approvals').select('*, requester:profiles!approvals_requested_by_fkey(full_name), approver:profiles!approvals_approved_by_fkey(full_name)').order('created_at',{ascending:false}),
      sb.auth.getUser(),
    ])
    setItems(a.data||[])
    if (u.data.user) {
      const {data:p} = await sb.from('profiles').select('*').eq('id',u.data.user.id).single()
      setCurrentUser(p)
    }
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.title) return
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('approvals').insert({...form,requested_by:user?.id,status:'pending'})
    if (error) { setToast('Hata: '+error.message) }
    else { setToast('Onay talebi oluşturuldu!'); setModal(false); load(); setForm({title:'',type:'content',notes:''}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function resolve(id: string, status: 'approved'|'rejected') {
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    await sb.from('approvals').update({status,approved_by:user?.id,resolved_at:new Date().toISOString()}).eq('id',id)
    load()
  }

  const filtered = filter==='all'?items:items.filter(i=>i.status===filter)
  const pendingCount = items.filter(i=>i.status==='pending').length

  return (
    <>
      <style>{`.onay-grid{display:grid;grid-template-columns:1fr;gap:10px;}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Onay Yönetimi" subtitle={pendingCount>0?`${pendingCount} bekleyen`:undefined} action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ Talep Oluştur</button>
        }/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}

          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {['all','pending','approved','rejected'].map(s=>{
              const count = s==='all'?items.length:items.filter(i=>i.status===s).length
              return <button key={s} onClick={()=>setFilter(s)} style={{padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                background:filter===s?'var(--gold)':'var(--s2)',color:filter===s?'#000':'var(--t2)'}}>
                {s==='all'?`Tümü (${count})`:`${STATUS_MAP[s]?.l} (${count})`}
              </button>
            })}
          </div>

          {loading ? <div style={{color:'var(--t3)',padding:20,fontSize:12}}>Yükleniyor...</div> : filtered.length===0 ? (
            <div style={{padding:60,textAlign:'center',color:'var(--t3)',fontSize:13}}>Onay talebi bulunamadı.</div>
          ) : (
            <div className="onay-grid">
              {filtered.map(item=>{
                const st = STATUS_MAP[item.status]
                const isAdmin = currentUser?.role==='admin'||currentUser?.role==='manager'
                return (
                  <div key={item.id} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'16px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{item.title}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--blue-d)',color:'var(--blue)',fontWeight:600}}>{TYPE_MAP[item.type]||item.type}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:st.bg,color:st.c}}>{st.l}</span>
                        </div>
                      </div>
                    </div>
                    {item.notes && <div style={{fontSize:11,color:'var(--t3)',marginBottom:10,padding:'8px 10px',background:'var(--s2)',borderRadius:6,lineHeight:1.5}}>{item.notes}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:item.status==='pending'&&isAdmin?12:0}}>
                      <div style={{fontSize:10,color:'var(--t3)'}}>
                        Talep eden: <strong style={{color:'var(--t2)'}}>{item.requester?.full_name||'—'}</strong>
                        {item.approver?.full_name && <> · Onaylayan: <strong style={{color:'var(--t2)'}}>{item.approver.full_name}</strong></>}
                      </div>
                      <div style={{fontSize:10,color:'var(--t3)',fontFamily:'JetBrains Mono'}}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                    {item.status==='pending' && isAdmin && (
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>resolve(item.id,'approved')} style={{flex:1,background:'var(--green-d)',border:'1px solid rgba(34,214,110,0.2)',borderRadius:8,color:'var(--green)',fontWeight:700,fontSize:12,padding:'8px',cursor:'pointer'}}>
                          ✓ Onayla
                        </button>
                        <button onClick={()=>resolve(item.id,'rejected')} style={{flex:1,background:'var(--red-d)',border:'1px solid rgba(240,68,68,0.2)',borderRadius:8,color:'var(--red)',fontWeight:700,fontSize:12,padding:'8px',cursor:'pointer'}}>
                          ✕ Reddet
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Onay Talebi Oluştur</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Başlık</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Onay konusu..." style={inp}/></div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Tür</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                  {Object.entries(TYPE_MAP).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Açıklama (opsiyonel)</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Detaylar..." rows={3} style={{...inp,resize:'vertical'}}/></div>
              <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Talep Gönder</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}