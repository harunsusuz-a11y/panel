'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import InfoBox from '@/components/InfoBox'
import { FolderOpen, Plus, Link2, Trash2, Upload, Download, MessageSquare, Send, Copy, CheckCheck, X } from 'lucide-react'
import { fmtDateTime, fmtDeadline, fmtRelative } from '@/lib/utils'
import ConfirmModal from '@/components/ConfirmModal'

const STATUS: Record<string,{l:string;cls:string}> = {
  active:    {l:'Aktif',         cls:'badge badge-green'},
  paused:    {l:'Duraklatıldı',  cls:'badge badge-amber'},
  completed: {l:'Tamamlandı',    cls:'badge badge-blue'},
  cancelled: {l:'İptal',         cls:'badge badge-red'},
}
const STAGE_S: Record<string,{l:string;color:string}> = {
  pending:          {l:'Bekliyor',      color:'var(--tx3)'},
  in_progress:      {l:'Devam',         color:'var(--blue)'},
  waiting_approval: {l:'Onay Bekliyor', color:'var(--amber)'},
  approved:         {l:'Onaylandı',     color:'var(--green)'},
  done:             {l:'Tamamlandı',    color:'var(--green)'},
}
const TASK_S: Record<string,{l:string;c:string}> = {
  todo:        {l:'Bekliyor', c:'var(--tx3)'},
  in_progress: {l:'Devam',   c:'var(--blue)'},
  review:      {l:'Kontrol', c:'var(--amber)'},
  done:        {l:'Tamam',   c:'var(--green)'},
}
const PRI: Record<string,{label:string;c:string;bg:string}> = {
  critical: {label:'Kritik',  c:'var(--red)',   bg:'var(--red2)'},
  high:     {label:'Yüksek',  c:'var(--amber)', bg:'var(--amber2)'},
  normal:   {label:'Normal',  c:'var(--blue)',  bg:'var(--blue2)'},
  low:      {label:'Düşük',   c:'var(--tx3)',   bg:'var(--s3)'},
}

export default function ProjelerPage() {
  const [projects,   setProjects]   = useState<any[]>([])
  const [clients,    setClients]    = useState<any[]>([])
  const [profiles,   setProfiles]   = useState<any[]>([])
  const [sel,        setSel]        = useState<any>(null)
  const [stages,     setStages]     = useState<any[]>([])
  const [files,      setFiles]      = useState<any[]>([])
  const [projTasks,  setProjTasks]  = useState<any[]>([])
  const [tab,        setTab]        = useState<'detail'|'stages'|'files'|'tasks'>('detail')
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [stageModal, setStageModal] = useState(false)
  const [taskModal,  setTaskModal]  = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [confirmData,setConfirmData]= useState<{type:string;id:string;path?:string}|null>(null)
  const [toast,      setToast]      = useState('')
  const [portalModal,setPortalModal]= useState(false)
  const [portalLink, setPortalLink] = useState('')
  const [portalPhone,setPortalPhone]= useState('')
  const [copied,     setCopied]     = useState(false)
  const [myId,       setMyId]       = useState('')

  const [form, setForm] = useState({
    name:'', client_id:'', description:'', deadline:'', budget:'', priority:'normal', status:'active'
  })
  const [stageForm, setStageForm] = useState({
    title:'', description:'', requires_approval:false, due_date:'', order_index:0
  })
  const [taskForm, setTaskForm] = useState({
    title:'', assigned_to:'', priority:'normal', due_date:'', description:''
  })

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    const { data:{user} } = await sb.auth.getUser()
    if (user) setMyId(user.id)
    const [p, c, pr] = await Promise.all([
      sb.from('projects').select('*').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name,status,phone').order('name'),
      sb.from('profiles').select('id,full_name').not('full_name','is',null),
    ])
    const clientMap: Record<string,any> = {}
    ;(c.data||[]).forEach((cl:any) => { clientMap[cl.id] = cl })
    const enriched = (p.data||[]).map((proj:any) => ({
      ...proj,
      client: proj.client_id ? clientMap[proj.client_id] : null
    }))
    setProjects(enriched)
    setClients(c.data||[])
    setProfiles((pr.data||[]).filter((x:any) => x.full_name))
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function loadProject(p:any) {
    setSel(p); setTab('detail'); setPortalLink(''); setCopied(false)
    const sb = createClient()
    const [st, fi, tk] = await Promise.all([
      sb.from('project_stages').select('*').eq('project_id',p.id).order('order_index'),
      sb.from('project_files').select('*, uploader:profiles!project_files_uploaded_by_fkey(full_name)').eq('project_id',p.id).order('created_at',{ascending:false}),
      sb.from('tasks').select('id,title,status,priority,due_date,assigned_to').eq('project_id',p.id).order('created_at',{ascending:false}),
    ])
    setStages(st.data||[])
    setFiles(fi.data||[])
    // assignee join
    const prMap: Record<string,any> = {}
    profiles.forEach((x:any) => { prMap[x.id] = x })
    setProjTasks((tk.data||[]).map((t:any) => ({...t, assignee: prMap[t.assigned_to]})))
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

  async function addStage() {
    if (!stageForm.title.trim() || !sel) return
    const {data,error} = await createClient().from('project_stages').insert({
      ...stageForm, project_id:sel.id, status:'pending'
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    setStages(s => [...s, data]); setStageModal(false)
    setStageForm({title:'',description:'',requires_approval:false,due_date:'',order_index:stages.length})
  }

  async function addTask() {
    if (!taskForm.title.trim() || !sel) return
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    const {data,error} = await sb.from('tasks').insert({
      title: taskForm.title.trim(),
      status: 'todo',
      priority: taskForm.priority,
      project_id: sel.id,
      client_id: sel.client_id || null,
      assigned_to: taskForm.assigned_to || null,
      due_date: taskForm.due_date || null,
      description: taskForm.description || null,
      created_by: user?.id,
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    const pr = profiles.find((x:any) => x.id === taskForm.assigned_to)
    setProjTasks(ts => [{ ...data, assignee: pr }, ...ts])
    setTaskModal(false)
    setTaskForm({title:'',assigned_to:'',priority:'normal',due_date:'',description:''})
    showToast('Görev oluşturuldu!')
  }

  async function moveTask(id:string, status:string) {
    await createClient().from('tasks').update({status}).eq('id',id)
    setProjTasks(ts => ts.map(t => t.id===id ? {...t,status} : t))
  }

  async function updateStageStatus(id:string, status:string) {
    const sb = createClient()
    const upd:any = {status}
    if (status==='approved') { const {data:{user}} = await sb.auth.getUser(); upd.approved_by=user?.id; upd.approved_at=new Date().toISOString() }
    await sb.from('project_stages').update(upd).eq('id',id)
    setStages(ss => ss.map(s => s.id===id ? {...s,...upd} : s))
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

  async function generatePortalLink() {
    if (!sel) return
    const cid = sel.client_id || sel.client?.id
    if (!cid) { showToast('Hata: Projeye müşteri atanmamış'); return }
    const sb = createClient()
    let data = null
    try {
      const {data: existing} = await sb.from('client_portal_tokens').select().eq('project_id',sel.id).order('created_at',{ascending:false}).limit(1).single()
      if (existing) data = existing
    } catch {}
    if (!data) {
      const {data: newToken} = await sb.from('client_portal_tokens').insert({client_id:cid,project_id:sel.id}).select().single()
      data = newToken
    }
    if (data) {
      const link = `${window.location.origin}/portal/${data.token}`
      setPortalLink(link)
      // müşteri telefonu
      const client = clients.find(c => c.id === cid)
      setPortalPhone(client?.phone || '')
      setPortalModal(true)
    }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(portalLink) } catch {}
    setCopied(true); setTimeout(()=>setCopied(false),2500)
  }

  function openWhatsApp() {
    const phone = portalPhone.replace(/\D/g,'')
    const msg = encodeURIComponent(`Merhaba! Projenizin güncel durumunu aşağıdaki bağlantıdan takip edebilirsiniz:\n${portalLink}`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  async function handleConfirmDelete() {
    if (!confirmData) return
    if (confirmData.type === 'stage') {
      await createClient().from('project_stages').delete().eq('id',confirmData.id)
      setStages(ss => ss.filter(s => s.id!==confirmData.id))
    }
    if (confirmData.type === 'file') {
      const sb = createClient()
      const urlPath = confirmData.path?.split('/project-files/')[1]
      if (urlPath) await sb.storage.from('project-files').remove([urlPath])
      await sb.from('project_files').delete().eq('id',confirmData.id)
      setFiles(fs => fs.filter(f => f.id!==confirmData.id))
    }
    setConfirmData(null)
  }

  async function sendStageToApproval(stage:any) {
    if (!sel) return
    const sb = createClient()
    const { data:{user} } = await sb.auth.getUser()
    const { data: existing } = await sb.from('approvals').select('id,status').eq('stage_id', stage.id).order('created_at',{ascending:false}).limit(1)
    if (existing && existing.length > 0 && existing[0].status === 'pending') {
      showToast('Hata: Bu aşama zaten onay bekliyor')
      return
    }
    const { error } = await sb.from('approvals').insert({
      title: `${sel.name} — ${stage.title}`,
      type: 'project',
      status: 'pending',
      client_id: sel.client_id || null,
      stage_id: stage.id,
      requested_by: user,
      notes: stage.description || null,
    })
    if (error) {
      // stage_id yoksa basit insert
      const { error: e2 } = await sb.from('approvals').insert({
        title: `${sel.name} — ${stage.title}`,
        type: 'project',
        status: 'pending',
        client_id: sel.client_id || null,
        requested_by: user,
        notes: stage.description || null,
      })
      if (e2) { showToast('Hata: ' + e2.message); return }
    }
    await updateStageStatus(stage.id, 'waiting_approval')
    showToast('✓ Onay talebi oluşturuldu! Onay sayfasından takip edin.')
  }

  const fmtSize = (b:number) => !b?'': b<1024?`${b}B`: b<1048576?`${(b/1024).toFixed(0)}KB`:`${(b/1048576).toFixed(1)}MB`

  return (
    <>
      <style>{`
        .prj-wrap{flex:1;display:flex;overflow:hidden;}
        .prj-list{width:260px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;}
        .prj-detail{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .prj-tabs{display:flex;border-bottom:1px solid var(--bdr);background:var(--s1);flex-shrink:0;}
        .prj-tab{padding:10px 14px;font-size:12.5px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;transition:color .12s;white-space:nowrap;}
        .prj-tab:hover{color:var(--tx);}
        .prj-tab.active{color:var(--ac);border-bottom-color:var(--ac);font-weight:600;}
        .tk-kb{display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px;}
        .tk-col{min-width:160px;flex:1;display:flex;flex-direction:column;gap:6px;}
        .tk-card{background:var(--s1);border:1px solid var(--bdr);border-radius:8px;padding:10px;cursor:pointer;transition:border-color .12s;}
        .tk-card:hover{border-color:var(--bdr2);}
        @media(max-width:768px){
          .prj-wrap{flex-direction:column;}
          .prj-list{width:100%;border-right:none;max-height:220px;}
          .tk-col{min-width:140px;}
        }
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Projeler" subtitle={`${projects.length} proje`} action={
          <button onClick={()=>setModal(true)} className="btn"><Plus size={14} strokeWidth={2}/>Yeni Proje</button>
        }/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        <div className="prj-wrap">
          {/* Liste */}
          <div className="prj-list">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <div style={{padding:20,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</div>
              : projects.length===0 ? <div style={{padding:20,color:'var(--tx3)',fontSize:13,textAlign:'center'}}>Proje yok.<br/>+ Yeni Proje ile başlayın.</div>
              : projects.map(p => {
                const s = STATUS[p.status]||STATUS.active
                return (
                  <div key={p.id} onClick={()=>loadProject(p)}
                    style={{padding:'11px 13px',borderBottom:'1px solid var(--bdr)',cursor:'pointer',
                      background:sel?.id===p.id?'var(--ac2)':'transparent',
                      borderLeft:sel?.id===p.id?'3px solid var(--ac)':'3px solid transparent',
                      transition:'background .1s'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,
                        color:sel?.id===p.id?'var(--ac)':'var(--tx)'}}>{p.name}</span>
                      <span className={s.cls} style={{marginLeft:6,flexShrink:0}}>{s.l}</span>
                    </div>
                    <div style={{fontSize:11.5,color:'var(--tx3)',marginBottom:5}}>
                      {p.client?.name || '— Müşteri atanmadı'}
                    </div>
                    <div className="pb-track">
                      <div className="pb-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--ac)':'var(--red)'}}/>
                    </div>
                    <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>{p.progress||0}% tamamlandı</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="prj-detail">
              <div className="prj-tabs">
                {(['detail','stages','tasks','files'] as const).map((k) => (
                  <button key={k} className={`prj-tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>
                    {k==='detail'?'Detay':k==='stages'?`Aşamalar (${stages.length})`:k==='tasks'?`Görevler (${projTasks.length})`:`Dosyalar (${files.length})`}
                  </button>
                ))}
                <div style={{flex:1}}/>
                <button onClick={generatePortalLink}
                  style={{margin:'6px 10px',background:'none',border:'1px solid var(--bdr)',borderRadius:7,color:'var(--tx2)',fontSize:11.5,cursor:'pointer',padding:'4px 10px',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                  <Link2 size={11}/>Portal Link
                </button>
              </div>

              <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
                {/* ── Detay ── */}
                {tab==='detail' && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {l:'Proje Adı',  v:sel.name},
                        {l:'Müşteri',    v:sel.client?.name||'— Atanmadı'},
                        {l:'Durum',      v:STATUS[sel.status]?.l||sel.status},
                        {l:'Öncelik',    v:sel.priority||'Normal'},
                        {l:'Deadline',   v:fmtDeadline(sel.deadline)},
                        {l:'Bütçe',      v:sel.budget?`₺${Number(sel.budget).toLocaleString('tr-TR')}`:'—'},
                      ].map(f=>(
                        <div key={f.l} style={{background:'var(--s2)',borderRadius:10,padding:'11px 14px',border:'1px solid var(--bdr)'}}>
                          <div style={{fontSize:11,color:'var(--tx3)',marginBottom:4}}>{f.l}</div>
                          <div style={{fontSize:13.5,fontWeight:500}}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <div style={{fontSize:12,color:'var(--tx2)'}}>İlerleme: <strong style={{color:sel.progress>70?'var(--green)':sel.progress>40?'var(--ac)':'var(--red)'}}>{sel.progress||0}%</strong></div>
                        <span style={{fontSize:10,color:'var(--blue)',background:'var(--blue2)',padding:'2px 8px',borderRadius:5,fontWeight:600}}>⚡ Otomatik</span>
                      </div>
                      <div className="prog"><div className="prog-fill" style={{width:`${sel.progress||0}%`,background:sel.progress>70?'var(--green)':sel.progress>40?'var(--ac)':'var(--red)'}}/></div>
                      <div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>Görevler tamamlandıkça otomatik güncellenir</div>
                    </div>
                    {sel.description && (
                      <div style={{background:'var(--s2)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--bdr)'}}>
                        <div style={{fontSize:11,color:'var(--tx3)',marginBottom:4}}>Açıklama</div>
                        <div style={{fontSize:13,lineHeight:1.6,color:'var(--tx2)'}}>{sel.description}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Aşamalar ── */}
                {tab==='stages' && (
                  <div>
                    <button onClick={()=>setStageModal(true)} className="btn" style={{marginBottom:14}}>
                      <Plus size={14} strokeWidth={2}/>Aşama Ekle
                    </button>
                    {stages.length===0 ? (
                      <div style={{padding:'30px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>
                        Henüz aşama tanımlanmamış.
                      </div>
                    ) : stages.map((s,i) => {
                      const sm = STAGE_S[s.status]||STAGE_S.pending
                      return (
                        <div key={s.id} style={{background:'var(--s2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'14px',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{width:22,height:22,borderRadius:'50%',background:`${sm.color}18`,color:sm.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0,border:`1px solid ${sm.color}30`}}>{i+1}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                                <span style={{fontSize:13,fontWeight:600}}>{s.title}</span>
                                <span className="badge" style={{background:`${sm.color}18`,color:sm.color}}>{sm.l}</span>
                                {s.requires_approval && <span style={{fontSize:11,color:'var(--amber)'}}>🔐 Onay</span>}
                              </div>
                              {s.description && <div style={{fontSize:12,color:'var(--tx3)',marginBottom:8,lineHeight:1.5}}>{s.description}</div>}
                              {s.due_date && <div style={{fontSize:11,color:'var(--tx3)',marginBottom:8}}>📅 {fmtDeadline(s.due_date)}</div>}
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                {Object.entries(STAGE_S).filter(([k])=>k!==s.status).map(([k,v])=>(
                                  <button key={k} onClick={()=>updateStageStatus(s.id,k)}
                                    style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid var(--bdr)',background:'var(--s1)',color:v.color,cursor:'pointer'}}>
                                    → {v.l}
                                  </button>
                                ))}
                                {s.requires_approval && s.status === 'in_progress' && (
                                  <button onClick={()=>sendStageToApproval(s)}
                                    style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid rgba(240,168,67,.3)',background:'var(--amber2)',color:'var(--amber)',cursor:'pointer',fontWeight:700}}>
                                    🔐 Onaya Gönder
                                  </button>
                                )}
                                <button onClick={()=>setConfirmData({type:'stage',id:s.id})} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'var(--red2)',color:'var(--red)',cursor:'pointer',marginLeft:'auto'}}>
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

                {/* ── Görevler Kanban ── */}
                {tab==='tasks' && (
                  <div>
                    <button onClick={()=>setTaskModal(true)} className="btn" style={{marginBottom:14}}>
                      <Plus size={14} strokeWidth={2}/>Görev Ekle
                    </button>
                    {projTasks.length===0 ? (
                      <div style={{padding:'30px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>
                        Bu projeye henüz görev atanmamış.
                      </div>
                    ) : (
                      <div className="tk-kb">
                        {Object.entries(TASK_S).map(([colId,col])=>{
                          const colTasks = projTasks.filter(t=>t.status===colId)
                          return (
                            <div key={colId} className="tk-col">
                              <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 9px',background:'var(--s2)',borderRadius:7,border:'1px solid var(--bdr)',flexShrink:0}}>
                                <div style={{width:6,height:6,borderRadius:'50%',background:col.c}}/>
                                <span style={{fontSize:11.5,fontWeight:700,color:col.c,flex:1}}>{col.l}</span>
                                <span style={{fontSize:10.5,fontWeight:700,color:'var(--tx3)',background:'var(--s3)',padding:'1px 6px',borderRadius:4}}>{colTasks.length}</span>
                              </div>
                              {colTasks.map(t=>{
                                const p = PRI[t.priority]||PRI.normal
                                const overdue = t.status!=='done' && t.due_date && new Date(t.due_date)<new Date()
                                return (
                                  <div key={t.id} className="tk-card"
                                    style={{borderColor:overdue?'rgba(242,87,87,.3)':'var(--bdr)'}}>
                                    <p style={{fontSize:12,fontWeight:500,lineHeight:1.4,marginBottom:7}}>{t.title}</p>
                                    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
                                      <span className="badge" style={{background:p.bg,color:p.c,fontSize:9.5}}>{p.label}</span>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                      <div style={{width:20,height:20,borderRadius:'50%',background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800}}>
                                        {t.assignee ? t.assignee.full_name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() : '—'}
                                      </div>
                                      <div style={{display:'flex',gap:3}}>
                                        {Object.entries(TASK_S).filter(([k])=>k!==colId).map(([k,v])=>(
                                          <button key={k} onClick={()=>moveTask(t.id,k)}
                                            style={{fontSize:9.5,padding:'2px 6px',borderRadius:4,border:'1px solid var(--bdr)',background:'var(--s2)',color:v.c,cursor:'pointer'}}>
                                            {v.l}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {t.due_date && <div style={{fontSize:10,color:overdue?'var(--red)':'var(--tx3)',marginTop:5}}>{overdue?'⚠ ':''}{fmtDeadline(t.due_date)}</div>}
                                  </div>
                                )
                              })}
                              {colTasks.length===0 && <div style={{padding:'14px 0',textAlign:'center',color:'var(--tx3)',fontSize:11,border:'1px dashed var(--bdr)',borderRadius:7}}>Boş</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Dosyalar ── */}
                {tab==='files' && (
                  <div>
                    <label style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:14,cursor:uploading?'not-allowed':'pointer',opacity:uploading?0.6:1}} className="btn">
                      <Upload size={14} strokeWidth={2}/>{uploading?'Yükleniyor...':'Dosya Yükle'}
                      <input type="file" style={{display:'none'}} onChange={uploadFile} disabled={uploading} className="inp"/>
                    </label>
                    {files.length===0 ? (
                      <div style={{padding:'30px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>Henüz dosya yüklenmemiş.</div>
                    ) : files.map(f=>(
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,background:'var(--s2)',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid var(--bdr)'}}>
                        <div style={{fontSize:20,flexShrink:0}}>
                          {f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')?'📊':'📎'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                          <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{fmtSize(f.file_size)} · {fmtDateTime(f.created_at)}{f.uploader?.full_name ? ' · ' + f.uploader.full_name.split(' ')[0] + ' yükledi' : ''}</div>
                        </div>
                        <a href={f.file_path} download target="_blank" rel="noreferrer" className="btn-ghost" style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                          <Download size={12}/>İndir
                        </a>
                        <button onClick={()=>setConfirmData({type:'file',id:f.id,path:f.file_path})} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:4}}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)',fontSize:13,flexDirection:'column',gap:8}}>
              <FolderOpen size={32} strokeWidth={1.5} style={{opacity:.3}}/>
              Proje seçin veya yeni proje oluşturun
            </div>
          )}
        </div>
      </div>

      {/* Yeni Proje Modal */}
      {modal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div className="modal-title">Yeni Proje</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label className="label">Proje Adı *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Proje adı..." autoFocus/>
              </div>
              <div>
                <label className="label">Müşteri</label>
                <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} className="inp">
                  <option value="">— Seçin —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.status!=='active'?' (Pasif)':''}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Öncelik</label>
                  <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} className="inp">
                    <option value="low">Düşük</option><option value="normal">Normal</option>
                    <option value="high">Yüksek</option><option value="critical">Kritik</option>
                  </select>
                </div>
                <div>
                  <label className="label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="inp">
                    <option value="active">Aktif</option><option value="paused">Duraklatıldı</option>
                    <option value="completed">Tamamlandı</option><option value="cancelled">İptal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
                </div>
                <div>
                  <label className="label">Bütçe (₺)</label>
                  <input type="number" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="0"/>
                </div>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="inp" placeholder="Proje detayları..."/>
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
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setStageModal(false)}}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-title">Aşama Ekle</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">Başlık *</label>
                <input value={stageForm.title} onChange={e=>setStageForm(p=>({...p,title:e.target.value}))} placeholder="Tasarım teslimi, Revizyon..." autoFocus/>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={stageForm.description} onChange={e=>setStageForm(p=>({...p,description:e.target.value}))} className="inp" rows={2}/>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={stageForm.due_date} onChange={e=>setStageForm(p=>({...p,due_date:e.target.value}))}/>
                </div>
                <div>
                  <label className="label">Sıra No</label>
                  <input type="number" value={stageForm.order_index} onChange={e=>setStageForm(p=>({...p,order_index:Number(e.target.value)}))} className="inp" min="0"/>
                </div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={stageForm.requires_approval} onChange={e=>setStageForm(p=>({...p,requires_approval:e.target.checked}))} style={{width:16,height:16,accentColor:'var(--ac)'}}/>
                <span style={{fontSize:13,color:'var(--tx2)'}}>Müşteri onayı gerekiyor</span>
              </label>
              <button onClick={addStage} className="btn" style={{width:'100%',justifyContent:'center',padding:'10px'}}>Aşama Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* Görev Ekle Modal */}
      {taskModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setTaskModal(false)}}>
          <div className="modal" style={{maxWidth:440}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Görev Ekle — {sel?.name}</p>
              <button onClick={()=>setTaskModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">Başlık *</label>
                <input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} placeholder="Görev başlığı..." autoFocus/>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Sorumlu</label>
                  <select value={taskForm.assigned_to} onChange={e=>setTaskForm(p=>({...p,assigned_to:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>
                    {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Öncelik</label>
                  <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} className="inp">
                    <option value="critical">Kritik</option><option value="high">Yüksek</option>
                    <option value="normal">Normal</option><option value="low">Düşük</option>
                  </select>
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={taskForm.due_date} onChange={e=>setTaskForm(p=>({...p,due_date:e.target.value}))} className="inp"/>
                </div>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))} className="inp" rows={2}/>
              </div>
              <button onClick={addTask} className="btn" style={{width:'100%',justifyContent:'center',padding:'10px'}}>Görevi Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Link Modal */}
      {portalModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setPortalModal(false);setCopied(false)}}}>
          <div className="modal" style={{maxWidth:420}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <p className="modal-title" style={{margin:0}}>🔗 Müşteri Portal Linki</p>
              <button onClick={()=>{setPortalModal(false);setCopied(false)}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{background:'var(--s2)',borderRadius:10,padding:'12px 14px',marginBottom:14,border:'1px solid var(--bdr)'}}>
              <p style={{fontSize:11,color:'var(--tx3)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Portal Linki</p>
              <p style={{fontSize:11.5,fontFamily:'JetBrains Mono,monospace',color:'var(--blue)',wordBreak:'break-all',lineHeight:1.6}}>{portalLink}</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:9}}>
              <button onClick={copyLink}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px',background:copied?'var(--green2)':'var(--s2)',border:`1px solid ${copied?'rgba(34,211,160,.3)':'var(--bdr)'}`,borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:600,color:copied?'var(--green)':'var(--tx)',transition:'all .2s'}}>
                {copied ? <><CheckCheck size={15}/>Kopyalandı!</> : <><Copy size={15}/>Linki Kopyala</>}
              </button>
              {portalPhone ? (
                <button onClick={openWhatsApp}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px',background:'#25D36618',border:'1px solid #25D36630',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700,color:'#25D366'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp ile Gönder
                </button>
              ) : (
                <div style={{padding:'10px 14px',background:'var(--amber2)',borderRadius:9,fontSize:12.5,color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)'}}>
                  ⚠ Müşteri telefon numarası kayıtlı değil — WhatsApp gönderilemez. Müşteriler sayfasından numarayı ekleyin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmData}
        title={confirmData?.type==='stage' ? 'Aşamayı Sil' : 'Dosyayı Sil'}
        message={confirmData?.type==='stage' ? 'Bu aşamayı silmek istediğinize emin misiniz?' : 'Bu dosyayı kalıcı olarak silmek istediğinize emin misiniz?'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData(null)}
      />
    </>
  )
}
