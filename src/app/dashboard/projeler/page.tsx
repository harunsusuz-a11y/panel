'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const STATUS_MAP: Record<string,any> = {
  active:{l:'Aktif',c:'var(--green)',bg:'var(--green-d)'},
  paused:{l:'Duraklatıldı',c:'var(--amber)',bg:'var(--amber-d)'},
  completed:{l:'Tamamlandı',c:'var(--blue)',bg:'var(--blue-d)'},
  cancelled:{l:'İptal',c:'var(--red)',bg:'var(--red-d)'},
}
const STAGE_MAP: Record<string,any> = {
  pending:{l:'Bekliyor',c:'var(--t3)'},
  in_progress:{l:'Devam',c:'var(--blue)'},
  waiting_approval:{l:'Onay Bekliyor',c:'var(--amber)'},
  approved:{l:'Onaylandı',c:'var(--green)'},
  done:{l:'Tamamlandı',c:'var(--green)'},
}
const inp: React.CSSProperties = {background:'var(--s2)',border:'1px solid var(--glass-border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--text)',outline:'none',fontFamily:'Inter,sans-serif',width:'100%'}

export default function ProjelerPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [sel, setSel] = useState<any>(null)
  const [stages, setStages] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [tab, setTab] = useState<'detail'|'stages'|'files'>('detail')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [stageModal, setStageModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({name:'',client_id:'',description:'',deadline:'',budget:'',priority:'normal',status:'active'})
  const [stageForm, setStageForm] = useState({title:'',description:'',requires_approval:false,due_date:'',order_index:0})
  const [portalLink, setPortalLink] = useState('')

  async function load() {
    const sb = createClient()
    const [p,c,pr] = await Promise.all([
      sb.from('projects').select('*,client:clients(name,email)').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name').eq('status','active'),
      sb.from('profiles').select('id,full_name'),
    ])
    setProjects(p.data||[]); setClients(c.data||[]); setProfiles(pr.data||[]); setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function loadProject(p:any) {
    setSel(p); setTab('detail')
    const sb = createClient()
    const [st,fi] = await Promise.all([
      sb.from('project_stages').select('*').eq('project_id',p.id).order('order_index'),
      sb.from('project_files').select('*').eq('project_id',p.id).order('created_at',{ascending:false}),
    ])
    setStages(st.data||[]); setFiles(fi.data||[])
  }

  async function addProject() {
    if (!form.name) return
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {data,error} = await sb.from('projects').insert({...form,client_id:form.client_id||null,budget:form.budget?Number(form.budget):null,created_by:user?.id,progress:0}).select().single()
    if (error) { setToast('Hata: '+error.message) } else { setToast('Proje oluşturuldu!'); setModal(false); load(); loadProject(data) }
    setTimeout(()=>setToast(''),3000)
  }

  async function updateProgress(id:string, progress:number) {
    await createClient().from('projects').update({progress}).eq('id',id)
    setProjects(ps=>ps.map(p=>p.id===id?{...p,progress}:p))
    if (sel?.id===id) setSel((s:any)=>({...s,progress}))
  }

  async function addStage() {
    if (!stageForm.title||!sel) return
    const {data,error} = await createClient().from('project_stages').insert({...stageForm,project_id:sel.id,status:'pending'}).select().single()
    if (error) { setToast('Hata: '+error.message) } else { setStages(s=>[...s,data]); setStageModal(false); setStageForm({title:'',description:'',requires_approval:false,due_date:'',order_index:stages.length}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function updateStageStatus(id:string, status:string) {
    const sb = createClient()
    const updates:any = {status}
    if (status==='approved') { const {data:{user}} = await sb.auth.getUser(); updates.approved_by=user?.id; updates.approved_at=new Date().toISOString() }
    await sb.from('project_stages').update(updates).eq('id',id)
    setStages(ss=>ss.map(s=>s.id===id?{...s,...updates}:s))
  }

  async function deleteStage(id:string) {
    await createClient().from('project_stages').delete().eq('id',id)
    setStages(ss=>ss.filter(s=>s.id!==id))
  }

  async function uploadFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file||!sel) return
    setUploading(true)
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const path = `${sel.id}/${Date.now()}_${file.name}`
    const {data:up,error:ue} = await sb.storage.from('project-files').upload(path, file)
    if (ue) { setToast('Yükleme hatası: '+ue.message); setUploading(false); return }
    const {data:{publicUrl}} = sb.storage.from('project-files').getPublicUrl(path)
    const {data:fd} = await sb.from('project_files').insert({project_id:sel.id,name:file.name,file_path:publicUrl,file_size:file.size,mime_type:file.type,uploaded_by:user?.id,is_client_visible:true}).select().single()
    if (fd) setFiles(fs=>[fd,...fs])
    setUploading(false); setToast('Dosya yüklendi!'); setTimeout(()=>setToast(''),3000)
    e.target.value = ''
  }

  async function deleteFile(id:string, path:string) {
    const sb = createClient()
    const urlPath = path.split('/project-files/')[1]
    if (urlPath) await sb.storage.from('project-files').remove([urlPath])
    await sb.from('project_files').delete().eq('id',id)
    setFiles(fs=>fs.filter(f=>f.id!==id))
  }

  async function generatePortalLink() {
    if (!sel) return
    const sb = createClient()
    const {data} = await sb.from('client_portal_tokens').insert({client_id:sel.client_id||sel.client?.id||'',project_id:sel.id}).select().single()
    if (data) { const link = `${window.location.origin}/portal/${data.token}`; setPortalLink(link); navigator.clipboard.writeText(link); setToast('Portal linki kopyalandı!') }
    else setToast('Hata: Müşteri atanmamış olabilir')
    setTimeout(()=>setToast(''),4000)
  }

  function fmtSize(b:number) { if(!b)return''; if(b<1024)return`${b}B`; if(b<1048576)return`${(b/1024).toFixed(0)}KB`; return`${(b/1048576).toFixed(1)}MB` }

  return (
    <>
      <style>{`
        .prj-wrap{flex:1;display:flex;overflow:hidden;}
        .prj-list{width:280px;border-right:1px solid var(--glass-border);display:flex;flex-direction:column;overflow:hidden;}
        .prj-detail{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .prj-tabs{display:flex;gap:0;border-bottom:1px solid var(--glass-border);flex-shrink:0;background:var(--s1);}
        .prj-tab{padding:10px 16px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--t2);border-bottom:2px solid transparent;}
        .prj-tab.active{color:var(--gold);border-bottom-color:var(--gold);}
        @media(max-width:768px){
          .prj-wrap{flex-direction:column;}
          .prj-list{width:100%;border-right:none;max-height:220px;}
          .prj-detail{flex:1;}
        }
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Projeler" subtitle={`${projects.length} proje`} action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ Proje</button>
        }/>
        {toast&&<div style={{margin:'8px 14px',padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600,flexShrink:0}}>{toast}</div>}

        <div className="prj-wrap">
          {/* Liste */}
          <div className="prj-list">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading?<div style={{padding:20,color:'var(--t3)',fontSize:12}}>Yükleniyor...</div>:projects.map(p=>{
                const s=STATUS_MAP[p.status]||STATUS_MAP.active
                return (
                  <div key={p.id} onClick={()=>loadProject(p)} style={{padding:'12px 14px',borderBottom:'1px solid var(--glass-border)',cursor:'pointer',background:sel?.id===p.id?'var(--gold-d)':'transparent',borderLeft:sel?.id===p.id?'2px solid var(--gold)':'2px solid transparent'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,color:sel?.id===p.id?'var(--gold)':'var(--text)'}}>{p.name}</span>
                      <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:20,background:s.bg,color:s.c,flexShrink:0,marginLeft:6}}>{s.l}</span>
                    </div>
                    <div style={{fontSize:10,color:'var(--t3)',marginBottom:5}}>{p.client?.name||'Müşteri yok'} {p.deadline&&`· ${p.deadline}`}</div>
                    <div style={{height:3,background:'var(--s4)',borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:9,color:'var(--t3)',marginTop:3}}>{p.progress||0}% tamamlandı</div>
                  </div>
                )
              })}
              {!loading&&projects.length===0&&<div style={{padding:30,textAlign:'center',color:'var(--t3)',fontSize:12}}>Proje yok. + Proje ile başlayın.</div>}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="prj-detail">
              <div className="prj-tabs">
                {[['detail','Detay'],['stages','Aşamalar'],['files','Dosyalar']].map(([k,l])=>(
                  <button key={k} className={`prj-tab${tab===k?' active':''}`} onClick={()=>setTab(k as any)}>{l} {k==='stages'?`(${stages.length})`:k==='files'?`(${files.length})`:''}</button>
                ))}
                <div style={{flex:1}}/>
                <button onClick={generatePortalLink} title="Müşteriye portal linki gönder" style={{margin:'6px 12px',padding:'4px 10px',borderRadius:7,border:'1px solid var(--glass-border)',background:'var(--s3)',color:'var(--t2)',fontSize:11,cursor:'pointer',fontWeight:600}}>🔗 Portal Link</button>
              </div>
              {portalLink&&<div style={{padding:'8px 14px',background:'var(--blue-d)',borderBottom:'1px solid var(--glass-border)',fontSize:11,color:'var(--blue)',fontFamily:'JetBrains Mono',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{portalLink}</div>}

              <div style={{flex:1,overflowY:'auto',padding:'16px'}}>

                {tab==='detail' && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {l:'Proje Adı',v:sel.name},
                        {l:'Müşteri',v:sel.client?.name||'—'},
                        {l:'Durum',v:STATUS_MAP[sel.status]?.l||sel.status},
                        {l:'Öncelik',v:sel.priority||'Normal'},
                        {l:'Deadline',v:sel.deadline||'—'},
                        {l:'Bütçe',v:sel.budget?`₺${Number(sel.budget).toLocaleString('tr-TR')}`:'—'},
                      ].map(f=>(
                        <div key={f.l} style={{background:'var(--s2)',borderRadius:10,padding:'10px 12px',border:'1px solid var(--glass-border)'}}>
                          <div style={{fontSize:9,color:'var(--t3)',marginBottom:3}}>{f.l}</div>
                          <div style={{fontSize:13,fontWeight:600}}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>İlerleme: {sel.progress||0}%</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {[0,10,25,50,75,90,100].map(v=>(
                          <button key={v} onClick={()=>updateProgress(sel.id,v)} style={{padding:'4px 10px',borderRadius:7,border:'none',fontSize:11,fontWeight:700,cursor:'pointer',background:sel.progress===v?'var(--gold)':'var(--s3)',color:sel.progress===v?'#000':'var(--t2)'}}>{v}%</button>
                        ))}
                      </div>
                    </div>
                    {sel.description&&<div style={{background:'var(--s2)',borderRadius:10,padding:'12px',border:'1px solid var(--glass-border)'}}>
                      <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>Açıklama</div>
                      <div style={{fontSize:12,lineHeight:1.6,color:'var(--t2)'}}>{sel.description}</div>
                    </div>}
                  </div>
                )}

                {tab==='stages' && (
                  <div>
                    <button onClick={()=>setStageModal(true)} style={{marginBottom:12,background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ Aşama Ekle</button>
                    {stages.length===0?<div style={{padding:'30px 0',textAlign:'center',color:'var(--t3)',fontSize:12}}>Aşama tanımlanmamış. Proje adımlarını ekleyin.</div>:stages.map((s,i)=>{
                      const sm=STAGE_MAP[s.status]||STAGE_MAP.pending
                      return (
                        <div key={s.id} style={{background:'var(--s2)',border:`1px solid ${s.status==='done'||s.status==='approved'?'rgba(34,214,110,0.2)':'var(--glass-border)'}`,borderRadius:12,padding:'14px',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{width:24,height:24,borderRadius:'50%',background:`${sm.c}18`,color:sm.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0,border:`1px solid ${sm.c}30`}}>{i+1}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                                <span style={{fontSize:13,fontWeight:600}}>{s.title}</span>
                                <span style={{fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:20,background:`${sm.c}18`,color:sm.c}}>{sm.l}</span>
                                {s.requires_approval&&<span style={{fontSize:9,color:'var(--amber)'}}>🔐 Onay gerekli</span>}
                              </div>
                              {s.description&&<div style={{fontSize:11,color:'var(--t3)',marginBottom:8,lineHeight:1.5}}>{s.description}</div>}
                              {s.due_date&&<div style={{fontSize:10,color:'var(--t3)',marginBottom:8,fontFamily:'JetBrains Mono'}}>📅 {s.due_date}</div>}
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                {Object.keys(STAGE_MAP).filter(k=>k!==s.status).map(k=>(
                                  <button key={k} onClick={()=>updateStageStatus(s.id,k)} style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:6,border:'1px solid var(--glass-border)',background:'var(--s3)',color:STAGE_MAP[k].c,cursor:'pointer'}}>→ {STAGE_MAP[k].l}</button>
                                ))}
                                <button onClick={()=>deleteStage(s.id)} style={{fontSize:10,padding:'3px 8px',borderRadius:6,border:'none',background:'var(--red-d)',color:'var(--red)',cursor:'pointer',marginLeft:'auto'}}>Sil</button>
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
                    <label style={{display:'inline-block',marginBottom:12,background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,cursor:uploading?'not-allowed':'pointer',opacity:uploading?0.6:1}}>
                      {uploading?'Yükleniyor...':'📎 Dosya Yükle'}
                      <input type="file" style={{display:'none'}} onChange={uploadFile} disabled={uploading}/>
                    </label>
                    {files.length===0?<div style={{padding:'30px 0',textAlign:'center',color:'var(--t3)',fontSize:12}}>Henüz dosya yüklenmemiş.</div>:files.map(f=>(
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,background:'var(--s2)',borderRadius:10,padding:'12px',marginBottom:8,border:'1px solid var(--glass-border)'}}>
                        <div style={{width:36,height:36,borderRadius:8,background:'var(--s4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                          {f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')||f.mime_type?.includes('excel')?'📊':'📎'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                          <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{fmtSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <a href={f.file_path} download target="_blank" rel="noreferrer" style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--glass-border)',background:'var(--s3)',color:'var(--blue)',fontSize:11,fontWeight:600,cursor:'pointer',textDecoration:'none'}}>İndir</a>
                        <button onClick={()=>deleteFile(f.id,f.file_path)} style={{padding:'5px 8px',borderRadius:7,border:'none',background:'var(--red-d)',color:'var(--red)',fontSize:11,cursor:'pointer'}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>
              Proje seçin veya yeni proje oluşturun
            </div>
          )}
        </div>
      </div>

      {/* Yeni Proje Modal */}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:500,maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Yeni Proje</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Proje Adı *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Müşteri</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="">Seçin</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Öncelik</label>
                  <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="low">Düşük</option><option value="normal">Normal</option><option value="high">Yüksek</option><option value="critical">Kritik</option>
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Bütçe (₺)</label><input type="number" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="45000" style={inp}/></div>
              </div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Açıklama</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} style={{...inp,resize:'vertical'}}/></div>
              <button onClick={addProject} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Proje Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Aşama Modal */}
      {stageModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Aşama Ekle</span>
              <button onClick={()=>setStageModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Aşama Başlığı *</label><input value={stageForm.title} onChange={e=>setStageForm(p=>({...p,title:e.target.value}))} placeholder="Tasarım teslimi, Revizyon, Onay..." style={inp}/></div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Açıklama</label><textarea value={stageForm.description} onChange={e=>setStageForm(p=>({...p,description:e.target.value}))} rows={2} style={{...inp,resize:'vertical'}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Deadline</label><input type="date" value={stageForm.due_date} onChange={e=>setStageForm(p=>({...p,due_date:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Sıra</label><input type="number" value={stageForm.order_index} onChange={e=>setStageForm(p=>({...p,order_index:Number(e.target.value)}))} style={inp}/></div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={stageForm.requires_approval} onChange={e=>setStageForm(p=>({...p,requires_approval:e.target.checked}))} style={{width:16,height:16,accentColor:'var(--gold)'}}/>
                <span style={{fontSize:12,color:'var(--t2)'}}>Bu aşama müşteri onayı gerektirir</span>
              </label>
              <button onClick={addStage} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Aşama Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}