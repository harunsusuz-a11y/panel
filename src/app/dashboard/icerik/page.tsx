'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus } from 'lucide-react'

const ST: Record<string,any> = {
  draft:    {l:'Taslak',         cls:'badge-muted'},
  pending:  {l:'Onay Bekliyor',  cls:'badge-amber'},
  approved: {l:'Onaylandı',      cls:'badge-green'},
  revision: {l:'Revizyon',       cls:'badge-red'},
  published:{l:'Yayında',        cls:'badge-ac'},
}
const TYPE: Record<string,string> = {post:'Post',story:'Story',blog:'Blog',ad:'Reklam',other:'Diğer'}

export default function IcerikPage() {
  const [items, setItems]     = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [filter, setFilter]   = useState('all')
  const [modal, setModal]     = useState(false)
  const [toast, setToast]     = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({title:'',client_id:'',type:'post',status:'draft',assigned_to:'',publish_date:''})

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    const [a,b,c] = await Promise.all([
      sb.from('contents').select('*').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name'),
      sb.from('profiles').select('id,full_name'),
    ])
    setItems(a.data||[]); setClients(b.data||[]); setProfiles(c.data||[]); setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function add() {
    if (!form.title.trim()) return
    const {error} = await createClient().from('contents').insert({...form,client_id:form.client_id||null,assigned_to:form.assigned_to||null,publish_date:form.publish_date||null})
    if (error) showToast('Hata: '+error.message)
    else {showToast('İçerik eklendi!');setModal(false);load();setForm({title:'',client_id:'',type:'post',status:'draft',assigned_to:'',publish_date:''})}
  }

  async function changeStatus(id:string, status:string) {
    await createClient().from('contents').update({status}).eq('id',id); load()
  }

  const filtered = filter==='all' ? items : items.filter(i=>i.status===filter)

  return (
    <>
      <style>{`.ic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:900px){.ic-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.ic-grid{grid-template-columns:1fr}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="İçerik Merkezi" action={<button className="btn" onClick={()=>setModal(true)}><Plus size={13} strokeWidth={2}/>İçerik Ekle</button>}/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:14}}>
            {['all',...Object.keys(ST)].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className={filter===s?'btn':'btn-ghost'} style={{fontSize:12}}>
                {s==='all'?`Tümü (${items.length})`:ST[s]?.l}
              </button>
            ))}
          </div>
          {loading?<p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>:filtered.length===0?<p style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>İçerik bulunamadı.</p>:(
            <div className="ic-grid">
              {filtered.map(item=>{
                const st = ST[item.status]||ST.draft
                return (
                  <div key={item.id} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:12,padding:'14px',transition:'border-color .15s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--bdr2)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--bdr)')}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                      <span className="badge badge-ac">{TYPE[item.type]||item.type}</span>
                      <span className={`badge ${st.cls}`}>{st.l}</span>
                    </div>
                    <p style={{fontSize:13.5,fontWeight:600,marginBottom:5,lineHeight:1.4}}>{item.title}</p>
                    {item.publish_date&&<p style={{fontSize:11,color:'var(--amber)',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>📅 {item.publish_date}</p>}
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      {Object.keys(ST).filter(s=>s!==item.status).map(s=>(
                        <button key={s} onClick={()=>changeStatus(item.id,s)} style={{fontSize:10.5,padding:'2px 8px',borderRadius:5,border:'1px solid var(--bdr)',background:'var(--s2)',color:ST[s].cls.includes('green')?'var(--green)':ST[s].cls.includes('amber')?'var(--amber)':ST[s].cls.includes('red')?'var(--red)':ST[s].cls.includes('ac')?'var(--ac)':'var(--tx2)',cursor:'pointer'}}>→ {ST[s].l}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <p className="modal-title">Yeni İçerik</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Başlık *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="inp" autoFocus/></div>
              <div className="modal-grid">
                <div><label className="label">Tür</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="inp">
                    {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="inp">
                    {Object.entries(ST).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
                  </select>
                </div>
                <div><label className="label">Müşteri</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Sorumlu</label>
                  <select value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Yayın Tarihi</label><input type="date" value={form.publish_date} onChange={e=>setForm(p=>({...p,publish_date:e.target.value}))} className="inp"/></div>
              <button className="btn" onClick={add} style={{width:'100%',justifyContent:'center',padding:'10px',marginTop:4}}>İçerik Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
