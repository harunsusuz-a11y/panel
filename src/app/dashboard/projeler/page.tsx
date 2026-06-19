'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { FolderOpen, Plus, Link2, ChevronRight, Trash2, Upload, Download } from 'lucide-react'

const STATUS: Record<string,{l:string;cls:string}> = {
  active:    {l:'Aktif',         cls:'badge badge-green'},
  paused:    {l:'Duraklatıldı',  cls:'badge badge-amber'},
  completed: {l:'Tamamlandı',    cls:'badge badge-blue'},
  cancelled: {l:'İptal',         cls:'badge badge-red'},
}
const STAGE_S: Record<string,{l:string;color:string}> = {
  pending:          {l:'Bekliyor',      color:'var(--text-faint)'},
  in_progress:      {l:'Devam',         color:'var(--blue)'},
  waiting_approval: {l:'Onay Bekliyor', color:'var(--amber)'},
  approved:         {l:'Onaylandı',     color:'var(--green)'},
  done:             {l:'Tamamlandı',    color:'var(--green)'},
}

export default function ProjelerPage() {
  const [projects,  setProjects]  = useState<any[]>([])
  const [clients,   setClients]   = useState<any[]>([])
  const [sel,       setSel]       = useState<any>(null)
  const [stages,    setStages]    = useState<any[]>([])
  const [files,     setFiles]     = useState<any[]>([])
  const [tab,       setTab]       = useState<'detail'|'stages'|'files'>('detail')
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [stageModal,setStageModal]= useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast,     setToast]     = useState('')
  const [portalLink,setPortalLink]= useState('')

  const [form, setForm] = useState({
    name:'', client_id:'', description:'', deadline:'', budget:'', priority:'normal', status:'active'
  })
  const [stageForm, setStageForm] = useState({
    title:'', description:'', requires_approval:false, due_date:'', order_index:0
  })

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    // client join'i ayrı çek — güvenilir yol
    const [p, c] = await Promise.all([
      sb.from('projects').select('*').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name,status').order('name'),  // status filtresi YOK — hepsini getir
    ])
    const clientMap: Record<string,any> = {}
    ;(c.data||[]).forEach((cl:any) => { clientMap[cl.id] = cl })
    
    // client bilgisini manuel ekle
    const enriched = (p.data||[]).map((proj:any) => ({
      ...proj,
      client: proj.client_id ? clientMap[proj.client_id] : null
    }))
    
    setProjects(enriched)
    setClients(c.data||[])  // hepsini göster — filtre yok
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function loadProject(p:any) {
    setSel(p); setTab('detail'); setPortalLink('')
    const sb = createClient()
    const [st, fi] = await Promise.all([
      sb.from('project_stages').select('*').eq('project_id',p.id).order('order_index'),
      sb.from('project_files').select('*').eq('project_id',p.id).order('created_at',{ascending:false}),
    ])
    setStages(st.data||[]); setFiles(fi.data||[])
  }

  async function addProject() {
    if (!form.name.trim()) { showToast('Hata: Proje adı zorunlu'); return }
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    const {data,error} = await sb.from('projects').insert({
      name: form.name.trim(),
      client_id: form.client_id || null,
      description: form.description || null,
      deadline: form.deadline || null,
      budget: form.budget ? Number(form.budget) : null,
      priority: form.priority,
      status: form.status,
      progress: 0,
      created_by: user?.id,
    }).select().single()

    if (error) { showToast('Hata: '+error.message); return }
    showToast('Proje oluşturuldu!')
    setModal(false)
    setForm({name:'',client_id:'',description:'',deadline:'',budget:'',priority:'normal',status:'active'})
    await load()
    if (data) loadProject({...data, client: clients.find(c=>c.id===data.client_id)||null})
  }

  async function updateProgress(id:string, progress:number) {
    await createClient().from('projects').update({progress}).eq('id',id)
    setProjects(ps => ps.map(p => p.id===id ? {...p,progress} : p))
    if (sel?.id===id) setSel((s:any) => ({...s, progress}))
  }

  async function addStage() {
    if (!stageForm.title.trim() || !sel) return
    const {data,error} = await createClient().from('project_stages').insert({
      ...stageForm, project_id:sel.id, status:'pending'
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    setStages(s => [...s, data]); setStageModal(false)
    setStageForm({title:'',description:'',requires_approval:false,due_date:'',order_index:stages.length})
  }

  async function updateStageStatus(id:string, status:string) {
    const sb = createClient()
    const upd:any = {status}
    if (status==='approved') { const {data:{user}} = await sb.auth.getUser(); upd.approved_by=user?.id; upd.approved_at=new Date().toISOString() }
    await sb.from('project_stages').update(upd).eq('id',id)
    setStages(ss => ss.map(s => s.id===id ? {...s,...upd} : s))
  }

  async function deleteStage(id:string) {
    await createClient().from('project_stages').delete().eq('id',id)
    setStages(ss => ss.filter(s => s.id!==id))
  }

  async function uploadFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file||!sel) return
    setUploading(true)
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const path = `${sel.id}/${Date.now()}_${file.name}`
    const {error:ue} = await sb.storage.from('project-files').upload(path, file)
    if (ue) { showToast('Yükleme hatası: '+ue.message); setUploading(false); return }
    const {data:{publicUrl}} = sb.storage.from('project-files').getPublicUrl(path)
    const {data:fd} = await sb.from('project_files').insert({
      project_id:sel.id, name:file.name, file_path:publicUrl,
      file_size:file.size, mime_type:file.type, uploaded_by:user?.id, is_client_visible:true
    }).select().single()
    if (fd) setFiles(fs => [fd,...fs])
    setUploading(false); showToast('Dosya yüklendi!')
    e.target.value = ''
  }

  async function deleteFile(id:string, path:string) {
    const sb = createClient()
    const urlPath = path.split('/project-files/')[1]
    if (urlPath) await sb.storage.from('project-files').remove([urlPath])
    await sb.from('project_files').delete().eq('id',id)
    setFiles(fs => fs.filter(f => f.id!==id))
  }

  async function generatePortalLink() {
    if (!sel) return
    const cid = sel.client_id || sel.client?.id
    if (!cid) { showToast('Hata: Projeye müşteri atanmamış'); return }
    const sb = createClient()
    const {data} = await sb.from('client_portal_tokens').insert({client_id:cid,project_id:sel.id}).select().single()
    if (data) {
      const link = `${window.location.origin}/portal/${data.token}`
      setPortalLink(link)
      navigator.clipboard.writeText(link)
      showToast('Portal linki kopyalandı!')
    }
  }

  const fmtSize = (b:number) => !b?'': b<1024?`${b}B`: b<1048576?`${(b/1024).toFixed(0)}KB`:`${(b/1048576).toFixed(1)}MB`

  return (
    <>
      <style>{`
        .prj-wrap{flex:1;display:flex;overflow:hidden;}
        .prj-list{width:260px;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;}
        .prj-detail{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .prj-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}
        .prj-tab{padding:11px 16px;font-size:13px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--text-dim);border-bottom:2px solid transparent;transition:color .12s;}
        .prj-tab:hover{color:var(--text);}
        .prj-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600;}
        @media(max-width:768px){
          .prj-wrap{flex-direction:column;}
          .prj-list{width:100%;border-right:none;max-height:240px;}
        }
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Projeler" subtitle={`${projects.length} proje`} action={
          <button onClick={()=>setModal(true)} className="btn"><Plus size={14} strokeWidth={2}/>Yeni Proje</button>
        }/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'err':'ok'}`}>{toast}</div>}

        <div className="prj-wrap">
          {/* Liste */}
          <div className="prj-list">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <div style={{padding:20,color:'var(--text-faint)',fontSize:13}}>Yükleniyor...</div>
              : projects.length===0 ? <div style={{padding:20,color:'var(--text-faint)',fontSize:13,textAlign:'center'}}>Proje yok.<br/>+ Yeni Proje ile başlayın.</div>
              : projects.map(p => {
                const s = STATUS[p.status]||STATUS.active
                return (
                  <div key={p.id} onClick={()=>loadProject(p)}
                    style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',
                      background:sel?.id===p.id?'var(--accent-soft)':'transparent',
                      borderLeft:sel?.id===p.id?'3px solid var(--accent)':'3px solid transparent',
                      transition:'background .1s'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,
                        color:sel?.id===p.id?'var(--accent)':'var(--text)'}}>{p.name}</span>
                      <span className={s.cls} style={{marginLeft:6,flexShrink:0}}>{s.l}</span>
                    </div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginBottom:6}}>
                      {p.client?.name || '— Müşteri atanmadı'}
                    </div>
                    <div className="pb-track">
                      <div className="pb-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--accent)':'var(--red)'}}/>
                    </div>
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:3}}>{p.progress||0}% tamamlandı</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="prj-detail">
              <div className="prj-tabs">
                {(['detail','stages','files'] as const).map((k,i) => (
                  <button key={k} className={`prj-tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>
                    {k==='detail'?'Detay':k==='stages'?`Aşamalar (${stages.length})`:`Dosyalar (${files.length})`}
                  </button>
                ))}
                <div style={{flex:1}}/>
                <button onClick={generatePortalLink} style={{margin:'6px 12px',background:'none',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-dim)',fontSize:12,cursor:'pointer',padding:'5px 10px',display:'flex',alignItems:'center',gap:5}}>
                  <Link2 size={12}/>Portal Link
                </button>
              </div>
              {portalLink && (
                <div style={{padding:'8px 16px',background:'var(--blue-soft)',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--blue)',fontFamily:'JetBrains Mono',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  📋 Kopyalandı: {portalLink}
                </div>
              )}

              <div style={{flex:1,overflowY:'auto',padding:'18px 20px'}}>
                {tab==='detail' && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {l:'Proje Adı',    v:sel.name},
                        {l:'Müşteri',      v:sel.client?.name||'— Atanmadı'},
                        {l:'Durum',        v:STATUS[sel.status]?.l||sel.status},
                        {l:'Öncelik',      v:sel.priority||'Normal'},
                        {l:'Deadline',     v:sel.deadline||'—'},
                        {l:'Bütçe',        v:sel.budget?`₺${Number(sel.budget).toLocaleString('tr-TR')}`:'—'},
                      ].map(f=>(
                        <div key={f.l} style={{background:'var(--surface-2)',borderRadius:10,padding:'11px 14px',border:'1px solid var(--border)'}}>
                          <div style={{fontSize:11,color:'var(--text-faint)',marginBottom:4}}>{f.l}</div>
                          <div style={{fontSize:13.5,fontWeight:500}}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:8}}>İlerleme: {sel.progress||0}%</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {[0,10,25,50,75,90,100].map(v=>(
                          <button key={v} onClick={()=>updateProgress(sel.id,v)}
                            style={{padding:'5px 12px',borderRadius:8,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',
                              background:sel.progress===v?'var(--accent)':'var(--surface-2)',
                              color:sel.progress===v?'#fff':'var(--text-dim)'}}>
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>
                    {sel.description && (
                      <div style={{background:'var(--surface-2)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--border)'}}>
                        <div style={{fontSize:11,color:'var(--text-faint)',marginBottom:4}}>Açıklama</div>
                        <div style={{fontSize:13,lineHeight:1.6,color:'var(--text-dim)'}}>{sel.description}</div>
                      </div>
                    )}
                  </div>
                )}

                {tab==='stages' && (
                  <div>
                    <button onClick={()=>setStageModal(true)} className="btn" style={{marginBottom:14}}>
                      <Plus size={14} strokeWidth={2}/>Aşama Ekle
                    </button>
                    {stages.length===0 ? (
                      <div style={{padding:'30px 0',textAlign:'center',color:'var(--text-faint)',fontSize:13}}>
                        Henüz aşama tanımlanmamış.
                      </div>
                    ) : stages.map((s,i) => {
                      const sm = STAGE_S[s.status]||STAGE_S.pending
                      return (
                        <div key={s.id} style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'14px',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{width:22,height:22,borderRadius:'50%',background:`${sm.color}18`,color:sm.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0,border:`1px solid ${sm.color}30`}}>{i+1}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                                <span style={{fontSize:13,fontWeight:600}}>{s.title}</span>
                                <span className="badge" style={{background:`${sm.color}18`,color:sm.color}}>{sm.l}</span>
                                {s.requires_approval && <span style={{fontSize:11,color:'var(--amber)'}}>🔐 Onay</span>}
                              </div>
                              {s.description && <div style={{fontSize:12,color:'var(--text-faint)',marginBottom:8,lineHeight:1.5}}>{s.description}</div>}
                              {s.due_date && <div style={{fontSize:11,color:'var(--text-faint)',marginBottom:8}}>📅 {s.due_date}</div>}
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                {Object.entries(STAGE_S).filter(([k])=>k!==s.status).map(([k,v])=>(
                                  <button key={k} onClick={()=>updateStageStatus(s.id,k)}
                                    style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:v.color,cursor:'pointer'}}>
                                    → {v.l}
                                  </button>
                                ))}
                                <button onClick={()=>deleteStage(s.id)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'var(--red-soft)',color:'var(--red)',cursor:'pointer',marginLeft:'auto'}}>
                                  Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab==='files' && (
                  <div>
                    <label style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:14,cursor:uploading?'not-allowed':'pointer',opacity:uploading?0.6:1}} className="btn">
                      <Upload size={14} strokeWidth={2}/>{uploading?'Yükleniyor...':'Dosya Yükle'}
                      <input type="file" style={{display:'none'}} onChange={uploadFile} disabled={uploading}/>
                    </label>
                    {files.length===0 ? (
                      <div style={{padding:'30px 0',textAlign:'center',color:'var(--text-faint)',fontSize:13}}>Henüz dosya yüklenmemiş.</div>
                    ) : files.map(f=>(
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,background:'var(--surface-2)',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid var(--border)'}}>
                        <div style={{fontSize:20,flexShrink:0}}>
                          {f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')?'📊':'📎'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                          <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>{fmtSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <a href={f.file_path} download target="_blank" rel="noreferrer" className="btn-ghost" style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                          <Download size={12}/>İndir
                        </a>
                        <button onClick={()=>deleteFile(f.id,f.file_path)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:4}}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-faint)',fontSize:13,flexDirection:'column',gap:8}}>
              <FolderOpen size={32} strokeWidth={1.5} style={{opacity:.3}}/>
              Proje seçin veya yeni proje oluşturun
            </div>
          )}
        </div>
      </div>

      {/* Yeni Proje Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-content">
            <div className="modal-title">Yeni Proje</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label className="modal-label">Proje Adı *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Proje adı..." autoFocus/>
              </div>
              <div>
                <label className="modal-label">Müşteri</label>
                <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}>
                  <option value="">— Seçin —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.status!=='active'?' (Pasif)':''}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Öncelik</label>
                  <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
                    <option value="low">Düşük</option><option value="normal">Normal</option>
                    <option value="high">Yüksek</option><option value="critical">Kritik</option>
                  </select>
                </div>
                <div>
                  <label className="modal-label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                    <option value="active">Aktif</option><option value="paused">Duraklatıldı</option>
                    <option value="completed">Tamamlandı</option><option value="cancelled">İptal</option>
                  </select>
                </div>
                <div>
                  <label className="modal-label">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
                </div>
                <div>
                  <label className="modal-label">Bütçe (₺)</label>
                  <input type="number" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="0"/>
                </div>
              </div>
              <div>
                <label className="modal-label">Açıklama</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} placeholder="Proje detayları..."/>
              </div>
              <button onClick={addProject} className="btn" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>
                Proje Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aşama Modal */}
      {stageModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setStageModal(false)}}>
          <div className="modal-content" style={{maxWidth:440}}>
            <div className="modal-title">Aşama Ekle</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="modal-label">Başlık *</label>
                <input value={stageForm.title} onChange={e=>setStageForm(p=>({...p,title:e.target.value}))} placeholder="Tasarım teslimi, Revizyon..." autoFocus/>
              </div>
              <div>
                <label className="modal-label">Açıklama</label>
                <textarea value={stageForm.description} onChange={e=>setStageForm(p=>({...p,description:e.target.value}))} rows={2}/>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Deadline</label>
                  <input type="date" value={stageForm.due_date} onChange={e=>setStageForm(p=>({...p,due_date:e.target.value}))}/>
                </div>
                <div>
                  <label className="modal-label">Sıra No</label>
                  <input type="number" value={stageForm.order_index} onChange={e=>setStageForm(p=>({...p,order_index:Number(e.target.value)}))}/>
                </div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={stageForm.requires_approval} onChange={e=>setStageForm(p=>({...p,requires_approval:e.target.checked}))} style={{width:16,height:16,accentColor:'var(--accent)'}}/>
                <span style={{fontSize:13,color:'var(--text-dim)'}}>Müşteri onayı gerekiyor</span>
              </label>
              <button onClick={addStage} className="btn" style={{width:'100%',justifyContent:'center',padding:'10px'}}>Aşama Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}