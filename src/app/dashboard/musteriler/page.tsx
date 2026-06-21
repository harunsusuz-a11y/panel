'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import {
  Plus, X, Building2, FolderOpen, CheckSquare, Receipt,
  FileText, Phone, Mail, Upload, Download, Trash2,
  Link2, Copy, CheckCheck, Send, ChevronRight
} from 'lucide-react'
import PhoneInput from '@/components/PhoneInput'
import ConfirmModal from '@/components/ConfirmModal'
import { fmtDateTime, fmtDeadline } from '@/lib/utils'

// ── Status tanımları ─────────────────────────────────────
const ST_PROJ: Record<string,{l:string;c:string}> = {
  active:    {l:'Aktif',        c:'var(--green)'},
  paused:    {l:'Duraklatıldı', c:'var(--amber)'},
  completed: {l:'Tamamlandı',   c:'var(--blue)'},
  cancelled: {l:'İptal',        c:'var(--red)'},
}
const STAGE_S: Record<string,{l:string;c:string}> = {
  pending:          {l:'Bekliyor',      c:'var(--tx3)'},
  in_progress:      {l:'Devam',         c:'var(--blue)'},
  waiting_approval: {l:'Onay Bekliyor', c:'var(--amber)'},
  approved:         {l:'Onaylandı',     c:'var(--green)'},
  done:             {l:'Tamamlandı',    c:'var(--green)'},
}
const ST_TASK: Record<string,{l:string;c:string}> = {
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
const ST_CONT: Record<string,{l:string;c:string}> = {
  draft:     {l:'Taslak',      c:'var(--tx3)'},
  pending:   {l:'İç Onay',     c:'var(--amber)'},
  approved:  {l:'Onaylandı',   c:'var(--green)'},
  revision:  {l:'Revizyon',    c:'var(--red)'},
  published: {l:'Yayında',     c:'var(--ac)'},
}

export default function MusterilerPage() {
  // ── Müşteri listesi ──────────────────────────────────
  const [clients,   setClients]   = useState<any[]>([])
  const [sel,       setSel]       = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState('')
  const [clientModal, setClientModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [clientForm, setClientForm] = useState({ name:'', email:'', phone:'', company:'', status:'active', notes:'' })

  // ── Ana sekme ────────────────────────────────────────
  const [tab, setTab] = useState<'projeler'|'gorevler'|'icerik'|'finans'>('projeler')

  // ── Müşteri genel verisi ─────────────────────────────
  const [clientTasks,    setClientTasks]    = useState<any[]>([])
  const [clientContents, setClientContents] = useState<any[]>([])
  const [clientTx,       setClientTx]       = useState<any[]>([])

  // ── Projeler sekmesi ─────────────────────────────────
  const [projects,    setProjects]    = useState<any[]>([])
  const [selProj,     setSelProj]     = useState<any>(null)   // seçili proje
  const [projTab,     setProjTab]     = useState<'detay'|'asamalar'|'dosyalar'|'gorevler'>('detay')
  const [stages,      setStages]      = useState<any[]>([])
  const [projFiles,   setProjFiles]   = useState<any[]>([])
  const [projTasks,   setProjTasks]   = useState<any[]>([])
  const [profiles,    setProfiles]    = useState<any[]>([])
  const [uploading,   setUploading]   = useState(false)
  const [confirmData, setConfirmData] = useState<{type:string;id:string;path?:string}|null>(null)

  // Proje modal
  const [projModal,  setProjModal]  = useState(false)
  const [projForm,   setProjForm]   = useState({ name:'', description:'', deadline:'', budget:'', priority:'normal', status:'active' })

  // Aşama modal
  const [stageModal, setStageModal] = useState(false)
  const [stageForm,  setStageForm]  = useState({ title:'', description:'', requires_approval:false, due_date:'', order_index:0 })

  // Görev modal (proje içi)
  const [taskModal,  setTaskModal]  = useState(false)
  const [taskForm,   setTaskForm]   = useState({ title:'', assigned_to:'', priority:'normal', due_date:'', description:'' })

  // Portal modal
  const [portalModal, setPortalModal] = useState(false)
  const [portalLink,  setPortalLink]  = useState('')
  const [copied,      setCopied]      = useState(false)

  // Müşteri bazlı portal
  const [clientPortalModal, setClientPortalModal] = useState(false)
  const [clientPortalLink,  setClientPortalLink]  = useState('')
  const [clientPortalCopied,setClientPortalCopied]= useState(false)

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''), 3500) }

  // ── Yükle ────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    const { data } = await createClient().from('clients').select('*').order('name')
    setClients(data||[]); setLoading(false)
  }, [])
  useEffect(() => { loadClients() }, [loadClients])

  // Profilleri bir kez yükle
  useEffect(() => {
    createClient().from('profiles').select('id,full_name').not('full_name','is',null).then(({data}) => setProfiles(data||[]))
  }, [])

  async function selectClient(c:any) {
    setSel(c); setTab('projeler'); setSelProj(null)
    const sb = createClient()
    const [p, t, ct, tr] = await Promise.all([
      sb.from('projects').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('tasks').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('contents').select('*').eq('client_id',c.id).order('created_at',{ascending:false}),
      sb.from('transactions').select('*').eq('client_id',c.id).order('date',{ascending:false}),
    ])
    setProjects(p.data||[])
    setClientTasks(t.data||[])
    setClientContents(ct.data||[])
    setClientTx(tr.data||[])
  }

  async function selectProject(p:any) {
    setSelProj(p); setProjTab('detay')
    const sb = createClient()
    const [st, fi, tk] = await Promise.all([
      sb.from('project_stages').select('*').eq('project_id',p.id).order('order_index'),
      sb.from('project_files').select('*, uploader:profiles!project_files_uploaded_by_fkey(full_name)').eq('project_id',p.id).order('created_at',{ascending:false}),
      sb.from('tasks').select('id,title,status,priority,due_date,assigned_to').eq('project_id',p.id).order('created_at',{ascending:false}),
    ])
    setStages(st.data||[])
    setProjFiles(fi.data||[])
    const prMap: Record<string,any> = {}
    profiles.forEach((x:any) => { prMap[x.id]=x })
    setProjTasks((tk.data||[]).map((t:any) => ({...t, assignee: prMap[t.assigned_to]})))
  }

  // ── Müşteri CRUD ─────────────────────────────────────
  async function addClient() {
    if (!clientForm.name.trim()) { showToast('Hata: İsim zorunlu'); return }
    setSaving(true)
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('clients').insert({...clientForm, created_by:user?.id})
    setSaving(false)
    if (error) { showToast('Hata: '+error.message); setSaving(false); return }

    // Yeni müşteri için otomatik portal token oluştur
    try {
      const { data: lastClient } = await sb
        .from('clients')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (lastClient?.id) {
        await sb.from('client_portal_tokens').insert({
          client_id: lastClient.id,
          project_id: null,
          is_client_token: true,
        })
      }
    } catch {}

    showToast('✓ Müşteri eklendi!')
    setClientModal(false)
    loadClients()
    setClientForm({name:'',email:'',phone:'',company:'',status:'active',notes:''})
  }

  async function updateClient(id:string, data:any) {
    const {error} = await createClient().from('clients').update(data).eq('id',id)
    if (error) { showToast('Hata: '+error.message); return }
    setClients(cs => cs.map(c => c.id===id ? {...c,...data} : c))
    if (sel?.id===id) setSel((s:any) => s ? {...s,...data} : null)
    showToast('Güncellendi!')
  }

  // ── Proje CRUD ───────────────────────────────────────
  async function addProject() {
    if (!projForm.name.trim() || !sel) return
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {data,error} = await sb.from('projects').insert({
      name: projForm.name.trim(),
      client_id: sel.id,
      description: projForm.description || null,
      deadline: projForm.deadline || null,
      budget: projForm.budget ? Number(projForm.budget) : null,
      priority: projForm.priority,
      status: projForm.status,
      progress: 0,
      created_by: user?.id,
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    const enrichedProj = {...data, client: sel}
    setProjects(ps => [enrichedProj, ...ps])
    setProjModal(false)
    setProjForm({name:'',description:'',deadline:'',budget:'',priority:'normal',status:'active'})
    showToast('Proje oluşturuldu!')
    selectProject(data)
  }

  // ── Aşama CRUD ───────────────────────────────────────
  async function addStage() {
    if (!stageForm.title.trim() || !selProj) return
    const {data,error} = await createClient().from('project_stages').insert({
      ...stageForm, project_id: selProj.id, status: 'pending'
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    setStages(s => [...s, data]); setStageModal(false)
    setStageForm({title:'',description:'',requires_approval:false,due_date:'',order_index:stages.length})
  }

  async function updateStageStatus(id:string, status:string) {
    const sb = createClient()
    const upd:any = {status}
    if (status==='approved') {
      const {data:{user}} = await sb.auth.getUser()
      upd.approved_by = user?.id; upd.approved_at = new Date().toISOString()
    }
    await sb.from('project_stages').update(upd).eq('id',id)
    setStages(ss => ss.map(s => s.id===id ? {...s,...upd} : s))
  }

  // ── Görev (proje içi) ────────────────────────────────
  async function addTask() {
    if (!taskForm.title.trim() || !selProj) return
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {data,error} = await sb.from('tasks').insert({
      title: taskForm.title.trim(),
      status: 'todo',
      priority: taskForm.priority,
      project_id: selProj.id,
      client_id: sel?.id || null,
      assigned_to: taskForm.assigned_to || null,
      due_date: taskForm.due_date || null,
      description: taskForm.description || null,
      created_by: user?.id,
    }).select().single()
    if (error) { showToast('Hata: '+error.message); return }
    const pr = profiles.find((x:any) => x.id===taskForm.assigned_to)
    const enriched = {...data, assignee:pr}
    setProjTasks(ts => [enriched, ...ts])
    // Müşteri Görevler sekmesini de güncelle
    setClientTasks(ts => [enriched, ...ts])
    setTaskModal(false)
    setTaskForm({title:'',assigned_to:'',priority:'normal',due_date:'',description:''})
    showToast('Görev oluşturuldu!')
  }

  async function moveProjTask(id:string, status:string) {
    await createClient().from('tasks').update({status}).eq('id',id)
    setProjTasks(ts => ts.map(t => t.id===id ? {...t,status} : t))
  }

  // ── Dosya ────────────────────────────────────────────
  async function uploadFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // input'u hemen resetle
    if (!file) { showToast('Hata: Dosya seçilmedi'); return }
    if (!selProj?.id) { showToast('Hata: Önce bir proje seçin'); return }
    if (file.size > 50 * 1024 * 1024) { showToast('Hata: Dosya 50MB den buyuk olamaz'); return }

    setUploading(true)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { showToast('Hata: Oturum açık değil'); setUploading(false); return }

      // Dosya adını güvenli hale getir
      const ext = file.name.includes('.') ? '.'+file.name.split('.').pop() : ''
      const baseName = file.name.replace(/\.[^.]+$/, '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 60)
      const safeName = `${baseName}${ext}`
      const path = `${selProj.id}/${Date.now()}_${safeName}`

      // Storage'a yükle
      const { error: ue } = await sb.storage.from('project-files').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (ue) { showToast('Hata: '+ue.message); setUploading(false); return }

      // Public URL al
      const { data: { publicUrl } } = sb.storage.from('project-files').getPublicUrl(path)

      // DB kaydı
      const { data: fd, error: de } = await sb.from('project_files').insert({
        project_id: selProj.id,
        name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        uploaded_by: user.id,
        is_client_visible: true,
      }).select().single()

      if (de) { showToast('Hata: DB kaydı başarısız - '+de.message); setUploading(false); return }
      if (fd) setProjFiles(fs => [fd, ...fs])
      showToast('✓ Dosya yüklendi!')
    } catch (err: any) {
      showToast('Hata: '+( err?.message || 'Beklenmedik hata'))
    }
    setUploading(false)
  }

  async function handleConfirm() {
    if (!confirmData) return
    if (confirmData.type==='stage') {
      await createClient().from('project_stages').delete().eq('id',confirmData.id)
      setStages(ss => ss.filter(s => s.id!==confirmData.id))
    }
    if (confirmData.type==='file') {
      const sb = createClient()
      const urlPath = confirmData.path?.split('/project-files/')[1]
      if (urlPath) await sb.storage.from('project-files').remove([urlPath])
      await sb.from('project_files').delete().eq('id',confirmData.id)
      setProjFiles(fs => fs.filter(f => f.id!==confirmData.id))
    }
    setConfirmData(null)
  }

  // ── Portal link ──────────────────────────────────────
  async function openClientPortalModal() {
    if (!sel) return
    const sb = createClient()
    // Müşteri bazlı tek token — is_client_token = true
    let tokenData: any = null
    try {
      const { data: ex } = await sb.from('client_portal_tokens')
        .select().eq('client_id', sel.id).eq('is_client_token', true).single()
      if (ex) tokenData = ex
    } catch {}
    if (!tokenData) {
      const { data: nt } = await sb.from('client_portal_tokens')
        .insert({ client_id: sel.id, project_id: null, is_client_token: true })
        .select().single()
      tokenData = nt
    }
    if (tokenData) {
      setClientPortalLink(`${window.location.origin}/portal/musteri/${tokenData.token}`)
      setClientPortalModal(true)
      setClientPortalCopied(false)
    }
  }

  async function openPortalModal() {
    if (!selProj || !sel) return
    const sb = createClient()
    let tokenData:any = null
    try {
      const {data:ex} = await sb.from('client_portal_tokens').select().eq('project_id',selProj.id).order('created_at',{ascending:false}).limit(1).single()
      if (ex) tokenData = ex
    } catch {}
    if (!tokenData) {
      const {data:nt} = await sb.from('client_portal_tokens').insert({client_id:sel.id, project_id:selProj.id}).select().single()
      tokenData = nt
    }
    if (tokenData) {
      setPortalLink(`${window.location.origin}/portal/${tokenData.token}`)
      setPortalModal(true)
      setCopied(false)
    }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(portalLink) } catch {}
    setCopied(true); setTimeout(()=>setCopied(false), 2500)
  }

  function openWhatsApp() {
    const phone = (sel?.phone||'').replace(/\D/g,'')
    if (!phone) { showToast('Hata: Müşteri telefon numarası yok'); return }
    const msg = encodeURIComponent(`Merhaba! Projenizin güncel durumunu takip edebilirsiniz:\n${portalLink}`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  // ── Hesaplamalar ─────────────────────────────────────
  const income  = clientTx.filter((t:any)=>t.type==='income').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const expense = clientTx.filter((t:any)=>t.type==='expense').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const fmt = (v:number) => `₺${Math.round(v).toLocaleString('tr-TR')}`
  const fmtSize = (b:number) => !b?'':b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(0)}KB`:`${(b/1048576).toFixed(1)}MB`

  return (
    <>
      <style>{`
        .ms-wrap{flex:1;display:flex;overflow:hidden}
        .ms-l{width:220px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .ms-d{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .ms-card{padding:9px 12px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:2.5px solid transparent}
        .ms-card:hover:not(.sel){background:var(--s2)}
        .ms-card.sel{background:var(--ac2);border-left-color:var(--ac)}
        .ms-tab{padding:9px 13px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap;transition:color .12s;display:flex;align-items:center;gap:5px}
        .ms-tab:hover{color:var(--tx)}
        .ms-tab.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:700}
        .prj-card{background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:11px 13px;cursor:pointer;margin-bottom:7px;transition:border-color .12s;border-left:3px solid transparent}
        .prj-card:hover{border-color:var(--bdr2)}
        .prj-card.sel{border-left-color:var(--ac);background:var(--ac2)}
        .ptab{padding:8px 12px;font-size:11.5px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap}
        .ptab:hover{color:var(--tx)}
        .ptab.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:600}
        .tk-kb{display:flex;gap:7px;overflow-x:auto;padding:2px 0 8px}
        .tk-col{min-width:150px;flex:1;display:flex;flex-direction:column;gap:5px}
        @media(max-width:768px){.ms-wrap{flex-direction:column}.ms-l{width:100%;border-right:none;border-bottom:1px solid var(--bdr);max-height:180px}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Müşteriler" subtitle={`${clients.length} müşteri`} action={
          <button className="btn" onClick={()=>setClientModal(true)}><Plus size={14} strokeWidth={2}/>Müşteri Ekle</button>
        }/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        <div className="ms-wrap">
          {/* ── Müşteri Listesi ── */}
          <div className="ms-l">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <p style={{padding:14,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
              : clients.length===0 ? <p style={{padding:14,color:'var(--tx3)',fontSize:13,textAlign:'center'}}>Müşteri yok</p>
              : clients.map(c=>(
                <div key={c.id} className={`ms-card${sel?.id===c.id?' sel':''}`} onClick={()=>selectClient(c)}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:28,height:28,borderRadius:7,background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>
                      {(c.name||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:sel?.id===c.id?'var(--ac)':'var(--tx)'}}>{c.name}</p>
                      <p style={{fontSize:10,color:c.status==='active'?'var(--green)':'var(--tx3)',marginTop:1}}>{c.status==='active'?'Aktif':'Pasif'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Detay Paneli ── */}
          {sel ? (
            <div className="ms-d">
              {/* Header */}
              <div style={{padding:'12px 15px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:11,flexShrink:0}}>
                <div style={{width:40,height:40,borderRadius:10,background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,flexShrink:0}}>
                  {(sel.name||'?').slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14.5,fontWeight:700}}>{sel.name}</p>
                  <div style={{display:'flex',gap:10,marginTop:2,flexWrap:'wrap'}}>
                    {sel.email&&<span style={{fontSize:11,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Mail size={9} strokeWidth={2}/>{sel.email}</span>}
                    {sel.phone&&<span style={{fontSize:11,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Phone size={9} strokeWidth={2}/>{sel.phone}</span>}
                  </div>
                </div>
                <select value={sel.status} onChange={e=>updateClient(sel.id,{status:e.target.value})} className="inp" style={{width:'auto',fontSize:11,padding:'3px 7px',height:'auto'}}>
                  <option value="active">Aktif</option><option value="passive">Pasif</option>
                </select>
                <button onClick={openClientPortalModal}
                  style={{display:'flex',alignItems:'center',gap:5,fontSize:11,padding:'5px 10px',background:'var(--ac2)',border:'1px solid rgba(124,106,247,.3)',borderRadius:7,cursor:'pointer',color:'var(--ac)',fontWeight:600,flexShrink:0}}>
                  <Link2 size={11}/>Müşteri Paneli
                </button>
                <button onClick={()=>{setSel(null);setSelProj(null)}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18,flexShrink:0}}>✕</button>
              </div>

              {/* Özet */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,padding:'10px 14px',borderBottom:'1px solid var(--bdr)',flexShrink:0}}>
                {[
                  {l:'Proje',   v:projects.length,       c:'var(--blue)'},
                  {l:'Görev',   v:clientTasks.length,    c:'var(--ac)'},
                  {l:'İçerik',  v:clientContents.length, c:'var(--amber)'},
                  {l:'Gelir',   v:fmt(income),            c:'var(--green)'},
                ].map(s=>(
                  <div key={s.l} style={{background:'var(--s2)',borderRadius:8,padding:'9px 10px',textAlign:'center',border:'1px solid var(--bdr)'}}>
                    <p style={{fontSize:16,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:s.c,lineHeight:1}}>{s.v}</p>
                    <p style={{fontSize:9.5,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Ana Sekmeler */}
              <div style={{display:'flex',borderBottom:'1px solid var(--bdr)',overflowX:'auto',background:'var(--s1)',flexShrink:0}}>
                {[
                  {k:'projeler', l:'Projeler',  Icon:FolderOpen,  n:projects.length},
                  {k:'gorevler', l:'Görevler',  Icon:CheckSquare, n:clientTasks.length},
                  {k:'icerik',   l:'İçerik',    Icon:FileText,    n:clientContents.length},
                  {k:'finans',   l:'Finans',     Icon:Receipt,     n:clientTx.length},
                ].map(({k,l,Icon,n})=>(
                  <button key={k} className={`ms-tab${tab===k?' on':''}`} onClick={()=>{setTab(k as any); if(k!=='projeler') setSelProj(null)}}>
                    <Icon size={11} strokeWidth={1.8}/>{l}
                    <span style={{fontSize:9.5,color:tab===k?'var(--ac)':'var(--tx3)',fontWeight:700}}>({n})</span>
                  </button>
                ))}
              </div>

              {/* ── İçerik Alanı ── */}
              <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>

                {/* ══ PROJELER SEKMESİ ══ */}
                {tab==='projeler' && (
                  <div style={{flex:1,display:'flex',overflow:'hidden'}}>
                    {/* Proje listesi */}
                    <div style={{width:220,borderRight:'1px solid var(--bdr)',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>
                      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--bdr)',flexShrink:0}}>
                        <button className="btn" style={{width:'100%',justifyContent:'center',fontSize:12,padding:'7px'}} onClick={()=>setProjModal(true)}>
                          <Plus size={13} strokeWidth={2}/>Yeni Proje
                        </button>
                      </div>
                      <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
                        {projects.length===0 ? (
                          <p style={{color:'var(--tx3)',fontSize:12,textAlign:'center',padding:'20px 0'}}>Henüz proje yok</p>
                        ) : projects.map(p=>{
                          const s = ST_PROJ[p.status]||ST_PROJ.active
                          return (
                            <div key={p.id} className={`prj-card${selProj?.id===p.id?' sel':''}`} onClick={()=>selectProject(p)}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                                <span style={{fontSize:12.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,color:selProj?.id===p.id?'var(--ac)':'var(--tx)'}}>{p.name}</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:10,fontWeight:700,color:s.c,background:`${s.c}15`,padding:'1px 6px',borderRadius:4}}>{s.l}</span>
                                <span style={{fontSize:10,color:'var(--tx3)',marginLeft:'auto'}}>{p.progress||0}%</span>
                              </div>
                              <div className="pb-track" style={{marginTop:5}}>
                                <div className="pb-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--ac)':'var(--red)'}}/>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Proje Detayı */}
                    {selProj ? (
                      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        {/* Proje header */}
                        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:8,flexShrink:0,background:'var(--s2)'}}>
                          <FolderOpen size={14} style={{color:'var(--ac)'}} strokeWidth={1.8}/>
                          <span style={{fontSize:13,fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selProj.name}</span>
                          <button onClick={openPortalModal}
                            style={{display:'flex',alignItems:'center',gap:4,fontSize:11,padding:'4px 9px',background:'none',border:'1px solid var(--bdr)',borderRadius:6,cursor:'pointer',color:'var(--tx2)',flexShrink:0}}>
                            <Link2 size={10}/>Portal
                          </button>
                        </div>
                        {/* Proje sekmeler */}
                        <div style={{display:'flex',borderBottom:'1px solid var(--bdr)',background:'var(--s1)',flexShrink:0,overflowX:'auto'}}>
                          {[
                            {k:'detay',     l:'Detay'},
                            {k:'asamalar',  l:`Aşamalar (${stages.length})`},
                            {k:'gorevler',  l:`Görevler (${projTasks.length})`},
                            {k:'dosyalar',  l:`Dosyalar (${projFiles.length})`},
                          ].map(({k,l})=>(
                            <button key={k} className={`ptab${projTab===k?' on':''}`} onClick={()=>setProjTab(k as any)}>{l}</button>
                          ))}
                        </div>

                        <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
                          {/* ── Detay ── */}
                          {projTab==='detay' && (
                            <div style={{display:'flex',flexDirection:'column',gap:10}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                {[
                                  {l:'Durum',    v:ST_PROJ[selProj.status]?.l||selProj.status},
                                  {l:'Öncelik',  v:selProj.priority||'Normal'},
                                  {l:'Deadline', v:fmtDeadline(selProj.deadline)},
                                  {l:'Bütçe',    v:selProj.budget?`₺${Number(selProj.budget).toLocaleString('tr-TR')}`:'—'},
                                ].map(f=>(
                                  <div key={f.l} style={{background:'var(--s2)',borderRadius:8,padding:'9px 12px',border:'1px solid var(--bdr)'}}>
                                    <div style={{fontSize:10.5,color:'var(--tx3)',marginBottom:3}}>{f.l}</div>
                                    <div style={{fontSize:13,fontWeight:500}}>{f.v}</div>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                                  <span style={{fontSize:11.5,color:'var(--tx2)'}}>İlerleme: <strong style={{color:selProj.progress>70?'var(--green)':selProj.progress>40?'var(--ac)':'var(--red)'}}>{selProj.progress||0}%</strong></span>
                                  <span style={{fontSize:10,color:'var(--blue)',background:'var(--blue2)',padding:'1px 6px',borderRadius:4,fontWeight:600}}>⚡ Otomatik</span>
                                </div>
                                <div className="prog"><div className="prog-fill" style={{width:`${selProj.progress||0}%`,background:selProj.progress>70?'var(--green)':selProj.progress>40?'var(--ac)':'var(--red)'}}/></div>
                              </div>
                              {selProj.description && (
                                <div style={{background:'var(--s2)',borderRadius:8,padding:'10px 12px',border:'1px solid var(--bdr)',fontSize:12.5,color:'var(--tx2)',lineHeight:1.6}}>
                                  {selProj.description}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── Aşamalar ── */}
                          {projTab==='asamalar' && (
                            <div>
                              <button className="btn" style={{marginBottom:12,fontSize:12}} onClick={()=>setStageModal(true)}>
                                <Plus size={13} strokeWidth={2}/>Aşama Ekle
                              </button>
                              {stages.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aşama tanımlanmamış</p>
                              : stages.map((s,i)=>{
                                const sm = STAGE_S[s.status]||STAGE_S.pending
                                return (
                                  <div key={s.id} style={{background:'var(--s2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px',marginBottom:7}}>
                                    <div style={{display:'flex',alignItems:'flex-start',gap:9}}>
                                      <div style={{width:20,height:20,borderRadius:'50%',background:`${sm.c}18`,color:sm.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9.5,fontWeight:800,flexShrink:0,border:`1px solid ${sm.c}30`}}>{i+1}</div>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                                          <span style={{fontSize:12.5,fontWeight:600}}>{s.title}</span>
                                          <span className="badge" style={{background:`${sm.c}18`,color:sm.c,fontSize:9.5}}>{sm.l}</span>
                                          {s.requires_approval && <span style={{fontSize:10,color:'var(--amber)'}}>🔐</span>}
                                        </div>
                                        {s.description && <div style={{fontSize:11.5,color:'var(--tx3)',marginBottom:7,lineHeight:1.5}}>{s.description}</div>}
                                        {s.due_date && <div style={{fontSize:10.5,color:'var(--tx3)',marginBottom:7}}>📅 {fmtDeadline(s.due_date)}</div>}
                                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                                          {Object.entries(STAGE_S).filter(([k])=>k!==s.status).map(([k,v])=>(
                                            <button key={k} onClick={()=>updateStageStatus(s.id,k)}
                                              style={{fontSize:10.5,padding:'3px 9px',borderRadius:5,border:'1px solid var(--bdr)',background:'var(--s1)',color:v.c,cursor:'pointer'}}>
                                              → {v.l}
                                            </button>
                                          ))}
                                          <button onClick={()=>setConfirmData({type:'stage',id:s.id})}
                                            style={{fontSize:10.5,padding:'3px 9px',borderRadius:5,border:'none',background:'var(--red2)',color:'var(--red)',cursor:'pointer',marginLeft:'auto'}}>
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

                          {/* ── Görevler (Proje içi Kanban) ── */}
                          {projTab==='gorevler' && (
                            <div>
                              <button className="btn" style={{marginBottom:12,fontSize:12}} onClick={()=>setTaskModal(true)}>
                                <Plus size={13} strokeWidth={2}/>Görev Ekle
                              </button>
                              {projTasks.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Görev yok</p>
                              : (
                                <div className="tk-kb">
                                  {Object.entries(ST_TASK).map(([colId,col])=>{
                                    const colTasks = projTasks.filter(t=>t.status===colId)
                                    return (
                                      <div key={colId} className="tk-col">
                                        <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 8px',background:'var(--s2)',borderRadius:7,border:'1px solid var(--bdr)',flexShrink:0}}>
                                          <div style={{width:5,height:5,borderRadius:'50%',background:col.c}}/>
                                          <span style={{fontSize:11,fontWeight:700,color:col.c,flex:1}}>{col.l}</span>
                                          <span style={{fontSize:10,fontWeight:700,color:'var(--tx3)',background:'var(--s3)',padding:'0px 5px',borderRadius:4}}>{colTasks.length}</span>
                                        </div>
                                        {colTasks.map(t=>{
                                          const p = PRI[t.priority]||PRI.normal
                                          const overdue = t.status!=='done' && t.due_date && new Date(t.due_date)<new Date()
                                          return (
                                            <div key={t.id} style={{background:'var(--s1)',border:`1px solid ${overdue?'rgba(242,87,87,.3)':'var(--bdr)'}`,borderRadius:8,padding:'9px'}}>
                                              <p style={{fontSize:12,fontWeight:500,lineHeight:1.4,marginBottom:6}}>{t.title}</p>
                                              <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:5}}>
                                                <span className="badge" style={{background:p.bg,color:p.c,fontSize:9}}>{p.label}</span>
                                              </div>
                                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                                <span style={{fontSize:9,color:'var(--tx3)'}}>{t.assignee?.full_name?.split(' ')[0]||'—'}</span>
                                                <div style={{display:'flex',gap:3}}>
                                                  {Object.entries(ST_TASK).filter(([k])=>k!==colId).map(([k,v])=>(
                                                    <button key={k} onClick={()=>moveProjTask(t.id,k)}
                                                      style={{fontSize:9,padding:'1px 5px',borderRadius:4,border:'1px solid var(--bdr)',background:'var(--s2)',color:v.c,cursor:'pointer'}}>
                                                      {v.l}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                              {t.due_date && <div style={{fontSize:9.5,color:overdue?'var(--red)':'var(--tx3)',marginTop:4}}>{overdue?'⚠ ':''}{fmtDeadline(t.due_date)}</div>}
                                            </div>
                                          )
                                        })}
                                        {colTasks.length===0 && <div style={{padding:'12px 0',textAlign:'center',color:'var(--tx3)',fontSize:10.5,border:'1px dashed var(--bdr)',borderRadius:7}}>Boş</div>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── Dosyalar ── */}
                          {projTab==='dosyalar' && (
                            <div>
                              <label style={{display:'inline-flex',alignItems:'center',gap:5,marginBottom:12,cursor:uploading?'not-allowed':'pointer',opacity:uploading?0.6:1}} className="btn">
                                <Upload size={13} strokeWidth={2}/>{uploading?'Yükleniyor...':'Dosya Yükle'}
                                <input type="file" style={{display:'none'}} onChange={uploadFile} disabled={uploading}/>
                              </label>
                              {projFiles.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Dosya yok</p>
                              : projFiles.map(f=>(
                                <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,background:'var(--s2)',borderRadius:9,padding:'10px 12px',marginBottom:7,border:'1px solid var(--bdr)'}}>
                                  <span style={{fontSize:18,flexShrink:0}}>{f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')?'📊':'📎'}</span>
                                  <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                                    <p style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>{fmtSize(f.file_size)} · {fmtDateTime(f.created_at)}</p>
                                  </div>
                                  <a href={f.file_path} download target="_blank" rel="noreferrer" className="btn-ghost" style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
                                    <Download size={11}/>İndir
                                  </a>
                                  <button onClick={()=>setConfirmData({type:'file',id:f.id,path:f.file_path})} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:3}}>
                                    <Trash2 size={13}/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--tx3)',fontSize:13}}>
                        <FolderOpen size={28} strokeWidth={1.5} style={{opacity:.3}}/>
                        Sol listeden proje seçin veya yeni proje oluşturun
                      </div>
                    )}
                  </div>
                )}

                {/* ══ GÖREVLER SEKMESİ ══ */}
                {tab==='gorevler' && (
                  <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px'}}>
                    {clientTasks.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,padding:'20px 0',textAlign:'center'}}>Görev yok</p>
                    : clientTasks.map((t:any)=>{
                      const s = ST_TASK[t.status]||ST_TASK.todo
                      const overdue = t.status!=='done' && t.due_date && new Date(t.due_date)<new Date()
                      return (
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:9,marginBottom:6}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:overdue?'var(--red)':s.c,flexShrink:0}}/>
                          <p style={{flex:1,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                          <span style={{fontSize:10.5,color:s.c,fontWeight:600,flexShrink:0}}>{s.l}</span>
                          {t.due_date && <span style={{fontSize:10.5,color:overdue?'var(--red)':'var(--tx3)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{fmtDeadline(t.due_date)}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ══ İÇERİK SEKMESİ ══ */}
                {tab==='icerik' && (
                  <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px'}}>
                    {clientContents.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,padding:'20px 0',textAlign:'center'}}>İçerik yok</p>
                    : clientContents.map((c:any)=>{
                      const s = ST_CONT[c.status]||ST_CONT.draft
                      return (
                        <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:9,marginBottom:6}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:s.c,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</p>
                            <p style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{c.type} · {fmtDeadline(c.publish_date)}</p>
                          </div>
                          <span style={{fontSize:10.5,color:s.c,fontWeight:600,flexShrink:0}}>{s.l}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ══ FİNANS SEKMESİ ══ */}
                {tab==='finans' && (
                  <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
                      {[
                        {l:'Gelir', v:fmt(income),         c:'var(--green)', bg:'var(--green2)'},
                        {l:'Gider', v:fmt(expense),        c:'var(--red)',   bg:'var(--red2)'},
                        {l:'Net',   v:fmt(income-expense), c:'var(--ac)',    bg:'var(--ac2)'},
                      ].map(s=>(
                        <div key={s.l} style={{background:s.bg,borderRadius:9,padding:'10px',textAlign:'center'}}>
                          <p style={{fontSize:13,fontWeight:700,color:s.c,fontFamily:'JetBrains Mono,monospace'}}>{s.v}</p>
                          <p style={{fontSize:10,color:'var(--tx3)',marginTop:2}}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                    {clientTx.length===0 ? <p style={{color:'var(--tx3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>İşlem yok</p>
                    : clientTx.map((t:any)=>(
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
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)',fontSize:13,flexDirection:'column',gap:8}}>
              <Building2 size={28} strokeWidth={1.5} style={{opacity:.3}}/>Müşteri seçin
            </div>
          )}
        </div>
      </div>

      {/* ── Müşteri Ekle Modal ── */}
      {clientModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setClientModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Müşteri Ekle</p>
              <button onClick={()=>setClientModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Müşteri Adı *</label><input value={clientForm.name} onChange={e=>setClientForm(p=>({...p,name:e.target.value}))} className="inp" autoFocus/></div>
              <div className="modal-grid">
                <div><label className="label">E-posta</label><input value={clientForm.email} onChange={e=>setClientForm(p=>({...p,email:e.target.value}))} className="inp"/></div>
                <div><label className="label">Telefon</label><PhoneInput value={clientForm.phone} onChange={v=>setClientForm(p=>({...p,phone:v}))}/></div>
                <div><label className="label">Şirket</label><input value={clientForm.company} onChange={e=>setClientForm(p=>({...p,company:e.target.value}))} className="inp"/></div>
                <div><label className="label">Durum</label>
                  <select value={clientForm.status} onChange={e=>setClientForm(p=>({...p,status:e.target.value}))} className="inp">
                    <option value="active">Aktif</option><option value="passive">Pasif</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Notlar</label><textarea value={clientForm.notes} onChange={e=>setClientForm(p=>({...p,notes:e.target.value}))} className="inp" rows={2}/></div>
              <button className="btn" onClick={addClient} disabled={saving} style={{width:'100%',justifyContent:'center',padding:'10px'}}>{saving?'Kaydediliyor...':'Müşteri Ekle'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Proje Modal ── */}
      {projModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setProjModal(false)}}>
          <div className="modal" style={{maxWidth:440}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Yeni Proje — {sel?.name}</p>
              <button onClick={()=>setProjModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Proje Adı *</label><input value={projForm.name} onChange={e=>setProjForm(p=>({...p,name:e.target.value}))} placeholder="Proje adı..." autoFocus className="inp"/></div>
              <div className="modal-grid">
                <div><label className="label">Öncelik</label>
                  <select value={projForm.priority} onChange={e=>setProjForm(p=>({...p,priority:e.target.value}))} className="inp">
                    <option value="low">Düşük</option><option value="normal">Normal</option><option value="high">Yüksek</option><option value="critical">Kritik</option>
                  </select>
                </div>
                <div><label className="label">Durum</label>
                  <select value={projForm.status} onChange={e=>setProjForm(p=>({...p,status:e.target.value}))} className="inp">
                    <option value="active">Aktif</option><option value="paused">Duraklatıldı</option><option value="completed">Tamamlandı</option><option value="cancelled">İptal</option>
                  </select>
                </div>
                <div><label className="label">Deadline</label><input type="date" value={projForm.deadline} onChange={e=>setProjForm(p=>({...p,deadline:e.target.value}))} className="inp"/></div>
                <div><label className="label">Bütçe (₺)</label><input type="number" value={projForm.budget} onChange={e=>setProjForm(p=>({...p,budget:e.target.value}))} placeholder="0" className="inp"/></div>
              </div>
              <div><label className="label">Açıklama</label><textarea value={projForm.description} onChange={e=>setProjForm(p=>({...p,description:e.target.value}))} rows={2} className="inp"/></div>
              <button onClick={addProject} className="btn" style={{width:'100%',justifyContent:'center',padding:'10px'}}>Proje Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Aşama Modal ── */}
      {stageModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setStageModal(false)}}>
          <div className="modal" style={{maxWidth:420}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <p className="modal-title" style={{margin:0}}>Aşama Ekle</p>
              <button onClick={()=>setStageModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <div><label className="label">Başlık *</label><input value={stageForm.title} onChange={e=>setStageForm(p=>({...p,title:e.target.value}))} placeholder="Tasarım teslimi..." autoFocus className="inp"/></div>
              <div><label className="label">Açıklama</label><textarea value={stageForm.description} onChange={e=>setStageForm(p=>({...p,description:e.target.value}))} className="inp" rows={2}/></div>
              <div className="modal-grid">
                <div><label className="label">Deadline</label><input type="date" value={stageForm.due_date} onChange={e=>setStageForm(p=>({...p,due_date:e.target.value}))} className="inp"/></div>
                <div><label className="label">Sıra No</label><input type="number" value={stageForm.order_index} onChange={e=>setStageForm(p=>({...p,order_index:Number(e.target.value)}))} className="inp" min="0"/></div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={stageForm.requires_approval} onChange={e=>setStageForm(p=>({...p,requires_approval:e.target.checked}))} style={{width:15,height:15,accentColor:'var(--ac)'}}/>
                <span style={{fontSize:13,color:'var(--tx2)'}}>Müşteri onayı gerekiyor</span>
              </label>
              <button onClick={addStage} className="btn" style={{width:'100%',justifyContent:'center',padding:'9px'}}>Aşama Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Görev Modal ── */}
      {taskModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setTaskModal(false)}}>
          <div className="modal" style={{maxWidth:420}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <p className="modal-title" style={{margin:0}}>Görev Ekle</p>
              <button onClick={()=>setTaskModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <div><label className="label">Başlık *</label><input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} placeholder="Görev başlığı..." autoFocus className="inp"/></div>
              <div className="modal-grid">
                <div><label className="label">Sorumlu</label>
                  <select value={taskForm.assigned_to} onChange={e=>setTaskForm(p=>({...p,assigned_to:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>
                    {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div><label className="label">Öncelik</label>
                  <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} className="inp">
                    <option value="critical">Kritik</option><option value="high">Yüksek</option><option value="normal">Normal</option><option value="low">Düşük</option>
                  </select>
                </div>
                <div><label className="label">Deadline</label><input type="date" value={taskForm.due_date} onChange={e=>setTaskForm(p=>({...p,due_date:e.target.value}))} className="inp"/></div>
              </div>
              <div><label className="label">Açıklama</label><textarea value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))} className="inp" rows={2}/></div>
              <button onClick={addTask} className="btn" style={{width:'100%',justifyContent:'center',padding:'9px'}}>Görevi Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Müşteri Portal Modal ── */}
      {clientPortalModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setClientPortalModal(false);setClientPortalCopied(false)}}}>
          <div className="modal" style={{maxWidth:440}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>🏢 Müşteri Paneli Linki</p>
              <button onClick={()=>{setClientPortalModal(false);setClientPortalCopied(false)}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{background:'var(--blue2)',borderRadius:9,padding:'10px 14px',marginBottom:14,fontSize:12.5,color:'var(--blue)',border:'1px solid rgba(78,168,240,.15)',lineHeight:1.6}}>
              Bu link <strong>{sel?.name}</strong> için kalıcıdır. Tüm projeleri, dosyaları ve onay geçmişini gösterir. Bir kez paylaşın, her zaman güncel kalır.
            </div>
            <div style={{background:'var(--s2)',borderRadius:9,padding:'10px 14px',marginBottom:14,border:'1px solid var(--bdr)'}}>
              <p style={{fontSize:11,color:'var(--tx3)',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Panel Linki</p>
              <p style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--blue)',wordBreak:'break-all',lineHeight:1.6}}>{clientPortalLink}</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={async()=>{try{await navigator.clipboard.writeText(clientPortalLink)}catch{}setClientPortalCopied(true);setTimeout(()=>setClientPortalCopied(false),2500)}}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',background:clientPortalCopied?'var(--green2)':'var(--s2)',border:`1px solid ${clientPortalCopied?'rgba(34,211,160,.3)':'var(--bdr)'}`,borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,color:clientPortalCopied?'var(--green)':'var(--tx)',transition:'all .2s'}}>
                {clientPortalCopied ? <><CheckCheck size={14}/>Kopyalandı!</> : <><Copy size={14}/>Linki Kopyala</>}
              </button>
              {sel?.phone ? (
                <button onClick={()=>{
                  const phone=(sel.phone||'').replace(/\D/g,'')
                  const msg=encodeURIComponent(`Merhaba! Proje panelinize aşağıdaki linkten ulaşabilirsiniz:\n${clientPortalLink}`)
                  window.open(`https://wa.me/${phone}?text=${msg}`,'_blank')
                }}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',background:'#25D36618',border:'1px solid #25D36630',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:700,color:'#25D366'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp ile Gönder
                </button>
              ) : (
                <div style={{padding:'9px 12px',background:'var(--amber2)',borderRadius:8,fontSize:12,color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)'}}>
                  ⚠ Telefon numarası yok — WhatsApp gönderilemez.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Portal Link Modal ── */}
      {portalModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setPortalModal(false);setCopied(false)}}}>
          <div className="modal" style={{maxWidth:420}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>🔗 Müşteri Portal Linki</p>
              <button onClick={()=>{setPortalModal(false);setCopied(false)}} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{background:'var(--s2)',borderRadius:9,padding:'10px 12px',marginBottom:12,border:'1px solid var(--bdr)'}}>
              <p style={{fontSize:10.5,color:'var(--tx3)',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Proje: {selProj?.name}</p>
              <p style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--blue)',wordBreak:'break-all',lineHeight:1.6}}>{portalLink}</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={copyLink}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',background:copied?'var(--green2)':'var(--s2)',border:`1px solid ${copied?'rgba(34,211,160,.3)':'var(--bdr)'}`,borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,color:copied?'var(--green)':'var(--tx)',transition:'all .2s'}}>
                {copied ? <><CheckCheck size={14}/>Kopyalandı!</> : <><Copy size={14}/>Linki Kopyala</>}
              </button>
              {sel?.phone ? (
                <button onClick={openWhatsApp}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',background:'#25D36618',border:'1px solid #25D36630',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:700,color:'#25D366'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp ile Gönder
                </button>
              ) : (
                <div style={{padding:'9px 12px',background:'var(--amber2)',borderRadius:8,fontSize:12,color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)'}}>
                  ⚠ Müşteri telefon numarası yok — Müşteri kartına ekleyin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmData}
        title={confirmData?.type==='stage'?'Aşamayı Sil':'Dosyayı Sil'}
        message={confirmData?.type==='stage'?'Bu aşamayı silmek istediğinize emin misiniz?':'Bu dosyayı kalıcı olarak silmek istediğinize emin misiniz?'}
        onConfirm={handleConfirm}
        onCancel={()=>setConfirmData(null)}
      />
    </>
  )
}
