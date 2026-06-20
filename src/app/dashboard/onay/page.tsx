'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus } from 'lucide-react'

const ST: Record<string,any> = {
  pending:  {l:'Bekliyor',   cls:'badge-amber'},
  approved: {l:'Onaylandı',  cls:'badge-green'},
  rejected: {l:'Reddedildi', cls:'badge-red'},
}
const TYPE: Record<string,string> = { content:'İçerik', project:'Proje', invoice:'Fatura', other:'Diğer' }

export default function OnayPage() {
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState('pending')
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [form, setForm] = useState({ title:'', type:'content', notes:'' })

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    const [a, u] = await Promise.all([
      sb.from('approvals').select('*').order('created_at',{ascending:false}),
      sb.auth.getUser(),
    ])
    setItems(a.data||[])
    if (u.data.user) {
      const {data:p} = await sb.from('profiles').select('role').eq('id',u.data.user.id).single()
      setCurrentUser({...u.data.user,...p})
    }
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function add() {
    if (!form.title.trim()) return
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('approvals').insert({...form,requested_by:user?.id,status:'pending'})
    if (error) showToast('Hata: '+error.message)
    else { showToast('Talep oluşturuldu!'); setModal(false); load(); setForm({title:'',type:'content',notes:''}) }
  }

  async function resolve(id:string, status:'approved'|'rejected') {
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    await sb.from('approvals').update({status,approved_by:user?.id,resolved_at:new Date().toISOString()}).eq('id',id)
    load()
  }

  const isAdmin = currentUser?.role==='admin'||currentUser?.role==='manager'
  const filtered = filter==='all' ? items : items.filter(i=>i.status===filter)
  const pendingCount = items.filter(i=>i.status==='pending').length

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Onay Yönetimi" subtitle={pendingCount>0?`${pendingCount} bekliyor`:undefined} action={
          <button className="btn" onClick={()=>setModal(true)}><Plus size={14} strokeWidth={2}/>Talep Oluştur</button>
        }/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap'}}>
            {['all','pending','approved','rejected'].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className={filter===s?'btn':'btn-ghost'} style={{fontSize:12}}>
                {s==='all'?`Tümü (${items.length})`:`${ST[s]?.l} (${items.filter(i=>i.status===s).length})`}
              </button>
            ))}
          </div>
          {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
          : filtered.length===0 ? <p style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>Onay talebi bulunamadı.</p>
          : <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(item=>(
              <div key={item.id} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:12,padding:'16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13.5,fontWeight:600,marginBottom:5}}>{item.title}</p>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <span className="badge badge-ac">{TYPE[item.type]||item.type}</span>
                      <span className={`badge ${ST[item.status]?.cls}`}>{ST[item.status]?.l}</span>
                    </div>
                  </div>
                  <span style={{fontSize:11,color:'var(--tx3)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                {item.notes&&<p style={{fontSize:12.5,color:'var(--tx2)',marginBottom:10,padding:'8px 10px',background:'var(--s2)',borderRadius:7,lineHeight:1.6}}>{item.notes}</p>}
                {item.status==='pending'&&isAdmin&&(
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>resolve(item.id,'approved')} style={{flex:1,background:'var(--green2)',border:'1px solid rgba(34,211,160,.2)',borderRadius:8,color:'var(--green)',fontWeight:700,fontSize:13,padding:8,cursor:'pointer'}}>✓ Onayla</button>
                    <button onClick={()=>resolve(item.id,'rejected')} style={{flex:1,background:'var(--red2)',border:'1px solid rgba(242,87,87,.2)',borderRadius:8,color:'var(--red)',fontWeight:700,fontSize:13,padding:8,cursor:'pointer'}}>✕ Reddet</button>
                  </div>
                )}
              </div>
            ))}
          </div>}
        </div>
      </div>
      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <p className="modal-title">Onay Talebi</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Başlık *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="inp" autoFocus/></div>
              <div><label className="label">Tür</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="inp">
                  {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="label">Açıklama</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="inp" rows={3}/></div>
              <button className="btn" onClick={add} style={{width:'100%',justifyContent:'center',padding:'10px',marginTop:4}}>Talep Gönder</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
