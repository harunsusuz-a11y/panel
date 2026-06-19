'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }

export default function MusterilerPage() {
  const [clients, setClients] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', status:'active', notes:'' })
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  async function load() {
    const {data} = await createClient().from('clients').select('*').order('created_at',{ascending:false})
    setClients(data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.name) return
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('clients').insert({...form,created_by:user?.id})
    if (error) setToast('Hata: '+error.message)
    else { setToast('Müşteri eklendi!'); setModal(false); load(); setForm({name:'',email:'',phone:'',company:'',status:'active',notes:''}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function update() {
    if (!selected) return
    const {error} = await createClient().from('clients').update(editForm).eq('id',selected.id)
    if (error) setToast('Hata: '+error.message)
    else { setToast('Güncellendi!'); setEditing(false); load(); setSelected({...selected,...editForm}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function del(id:string) {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return
    await createClient().from('clients').delete().eq('id',id)
    setClients(c=>c.filter(x=>x.id!==id)); setSelected(null)
  }

  const filtered = clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()))

  function selectClient(c:any) {
    setSelected(c); setEditing(false)
    setEditForm({name:c.name,email:c.email||'',phone:c.phone||'',company:c.company||'',status:c.status,notes:c.notes||''})
  }

  return (
    <>
      <style>{`
        .mus-wrap{flex:1;display:flex;overflow:hidden;}
        .mus-list{width:300px;border-right:1px solid var(--glass-border);display:flex;flex-direction:column;overflow:hidden;}
        .mus-detail{flex:1;overflow-y:auto;padding:20px;}
        @media(max-width:768px){
          .mus-wrap{flex-direction:column;}
          .mus-list{width:100%;border-right:none;flex:1;}
          .mus-detail{position:fixed;inset:0;z-index:200;background:var(--bg);padding:0;display:flex;flex-direction:column;}
          .mus-dh{height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid var(--glass-border);background:var(--s1);flex-shrink:0;}
          .mus-di{flex:1;overflow-y:auto;padding:16px;}
        }
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="CRM / Müşteriler" subtitle={`${clients.length} müşteri`} action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer'}}>+ Yeni</button>
        }/>
        {toast && <div style={{margin:'8px 14px',padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600,flexShrink:0}}>{toast}</div>}
        <div className="mus-wrap">
          <div className="mus-list">
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--glass-border)'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Müşteri ara..." style={inp}/>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <div style={{padding:20,color:'var(--t3)',fontSize:12}}>Yükleniyor...</div> : filtered.map(c=>(
                <div key={c.id} onClick={()=>selectClient(c)}
                  style={{padding:'12px 14px',borderBottom:'1px solid var(--glass-border)',cursor:'pointer',
                    background:selected?.id===c.id?'var(--gold-d)':'transparent',
                    borderLeft:selected?.id===c.id?'2px solid var(--gold)':'2px solid transparent'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:selected?.id===c.id?'var(--gold)':'var(--text)'}}>{c.name}</span>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:c.status==='active'?'var(--green-d)':'var(--s3)',color:c.status==='active'?'var(--green)':'var(--t3)',fontWeight:600}}>
                      {c.status==='active'?'Aktif':'Pasif'}
                    </span>
                  </div>
                  <div style={{fontSize:11,color:'var(--t2)'}}>{c.company||c.email||'—'}</div>
                </div>
              ))}
              {!loading && filtered.length===0 && <div style={{padding:20,color:'var(--t3)',fontSize:12,textAlign:'center'}}>Müşteri bulunamadı</div>}
            </div>
          </div>

          {selected ? (
            <div className="mus-detail">
              <div className="mus-dh">
                <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'var(--t2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Geri
                </button>
                <span style={{fontSize:14,fontWeight:700,flex:1}}>{selected.name}</span>
                <button onClick={()=>setEditing(!editing)} style={{background:editing?'var(--gold)':'var(--s2)',color:editing?'#000':'var(--t2)',fontWeight:600,fontSize:11,padding:'5px 12px',borderRadius:7,border:'1px solid var(--glass-border)',cursor:'pointer'}}>
                  {editing?'İptal':'Düzenle'}
                </button>
              </div>
              <div className="mus-di" style={{padding:20}}>
                {!editing ? (
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                      {[{l:'Firma',v:selected.company||'—'},{l:'E-posta',v:selected.email||'—'},{l:'Telefon',v:selected.phone||'—'},{l:'Durum',v:selected.status==='active'?'Aktif':'Pasif'}].map(f=>(
                        <div key={f.l} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:10,padding:'12px 14px'}}>
                          <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>{f.l}</div>
                          <div style={{fontSize:13,fontWeight:500}}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    {selected.notes && <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:10,padding:'12px 14px',marginBottom:12}}>
                      <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>Notlar</div>
                      <div style={{fontSize:12,lineHeight:1.6,color:'var(--t2)'}}>{selected.notes}</div>
                    </div>}
                    <button onClick={()=>del(selected.id)} style={{background:'var(--red-d)',border:'1px solid rgba(240,68,68,0.2)',borderRadius:8,color:'var(--red)',fontWeight:700,fontSize:12,padding:'8px 16px',cursor:'pointer'}}>Müşteriyi Sil</button>
                  </>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[{l:'Firma Adı',k:'name'},{l:'Şirket',k:'company'},{l:'E-posta',k:'email'},{l:'Telefon',k:'phone'}].map(f=>(
                      <div key={f.k}><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>{f.l}</label>
                        <input value={editForm[f.k]||''} onChange={e=>setEditForm((p:any)=>({...p,[f.k]:e.target.value}))} style={inp}/>
                      </div>
                    ))}
                    <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Durum</label>
                      <select value={editForm.status} onChange={e=>setEditForm((p:any)=>({...p,status:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                        <option value="active">Aktif</option><option value="passive">Pasif</option>
                      </select>
                    </div>
                    <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Notlar</label>
                      <textarea value={editForm.notes||''} onChange={e=>setEditForm((p:any)=>({...p,notes:e.target.value}))} rows={3} style={{...inp,resize:'vertical'}}/>
                    </div>
                    <button onClick={update} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:11,borderRadius:9,border:'none',cursor:'pointer'}}>Kaydet</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>Müşteri seçin</div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Yeni Müşteri</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              {[{l:'Müşteri Adı *',k:'name'},{l:'Şirket',k:'company'},{l:'E-posta',k:'email'},{l:'Telefon',k:'phone'}].map(f=>(
                <div key={f.k}><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>{f.l}</label>
                  <input value={(form as any)[f.k]} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={inp}/>
                </div>
              ))}
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Notlar</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{...inp,resize:'vertical'}}/>
              </div>
              <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Müşteri Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}