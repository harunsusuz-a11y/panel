'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const COLS = [
  { id:'todo',        label:'Bekliyor',  color:'var(--t3)'    },
  { id:'in_progress', label:'Devam',     color:'var(--blue)'  },
  { id:'review',      label:'Kontrol',   color:'var(--amber)' },
  { id:'done',        label:'Tamam',     color:'var(--green)' },
]

const PRI: Record<string,{label:string;c:string;bg:string}> = {
  critical: { label:'Kritik',  c:'var(--red)',   bg:'var(--red-d)'   },
  high:     { label:'Yüksek',  c:'var(--amber)', bg:'var(--amber-d)' },
  normal:   { label:'Normal',  c:'var(--blue)',  bg:'var(--blue-d)'  },
  low:      { label:'Düşük',   c:'var(--t2)',    bg:'var(--s3)'      },
}

const INP: React.CSSProperties = {
  width:'100%', background:'var(--s3)', border:'1px solid var(--glass-border)',
  borderRadius:7, padding:'8px 11px', fontSize:13, color:'var(--text)',
  outline:'none', fontFamily:'Inter,sans-serif',
}

export default function GorevlerPage() {
  const [tasks,    setTasks]    = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [adding,   setAdding]   = useState(false)
  const [modal,    setModal]    = useState(false)
  const [detail,   setDetail]   = useState<any>(null)
  const [toast,    setToast]    = useState('')
  const [form, setForm] = useState({
    title:'', project_id:'', assigned_to:'',
    priority:'normal', due_date:'', description:''
  })

  function showToast(msg:string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function load() {
    const sb = createClient()
    const [t, p, pr] = await Promise.all([
      // join adını FK yerine ilişki adıyla yaz — daha güvenli
      sb.from('tasks')
        .select('id, title, status, priority, due_date, description, created_at, assigned_to, project_id')
        .order('created_at', { ascending: false }),
      sb.from('projects').select('id, name').eq('status', 'active'),
      sb.from('profiles').select('id, full_name, department').not('full_name', 'is', null),
    ])
    
    // assignee ve project bilgilerini manuel birleştir
    const profileMap: Record<string,any> = {}
    ;(pr.data||[]).forEach((p:any) => { profileMap[p.id] = p })
    
    const projectMap: Record<string,any> = {}
    ;(p.data||[]).forEach((p:any) => { projectMap[p.id] = p })

    const enrichedTasks = (t.data||[]).map((task:any) => ({
      ...task,
      assignee: task.assigned_to ? profileMap[task.assigned_to] : null,
      project:  task.project_id  ? projectMap[task.project_id]  : null,
    }))

    setTasks(enrichedTasks)
    setProjects(p.data||[])
    setProfiles((pr.data||[]).filter((p:any) => p.full_name && p.full_name !== p.id))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!form.title.trim()) { showToast('Hata: Görev başlığı zorunlu'); return }
    setAdding(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    
    const payload: any = {
      title:       form.title.trim(),
      status:      'todo',
      priority:    form.priority,
      created_by:  user?.id || null,
      project_id:  form.project_id  || null,
      assigned_to: form.assigned_to || null,
      due_date:    form.due_date    || null,
      description: form.description || null,
    }

    const { error } = await sb.from('tasks').insert(payload)
    setAdding(false)
    
    if (error) {
      showToast('Hata: ' + error.message)
      console.error('Task insert error:', error)
    } else {
      showToast('Görev oluşturuldu!')
      setModal(false)
      setForm({ title:'', project_id:'', assigned_to:'', priority:'normal', due_date:'', description:'' })
      load()
    }
  }

  async function moveTask(id:string, status:string) {
    const updates: any = { status }
    if (status === 'done') updates.completed_at = new Date().toISOString()
    const { error } = await createClient().from('tasks').update(updates).eq('id', id)
    if (!error) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t))
      setDetail((d:any) => d ? { ...d, ...updates } : null)
    }
  }

  async function deleteTask(id:string) {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return
    const { error } = await createClient().from('tasks').delete().eq('id', id)
    if (!error) { setTasks(ts => ts.filter(t => t.id !== id)); setDetail(null) }
  }

  const isOverdue = (t:any) =>
    t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()

  return (
    <>
      <style>{`
        .kw{flex:1;overflow-x:auto;overflow-y:hidden;padding:12px;display:flex;gap:10px}
        .kc{width:230px;flex-shrink:0;display:flex;flex-direction:column;gap:7px}
        .kcard{background:var(--s1);border:1px solid var(--glass-border);border-radius:9px;padding:11px 12px;cursor:pointer;transition:border-color .12s,transform .12s}
        .kcard:hover{border-color:var(--border2);transform:translateY(-1px)}
        .ov{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}
        .mb{background:var(--s1);border:1px solid var(--border2);border-radius:12px;padding:22px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto}
        .mg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:768px){
          .kc{width:180px}
          .ov{align-items:flex-end;padding:0}
          .mb{border-radius:16px 16px 0 0;max-height:88vh}
          .mg{grid-template-columns:1fr}
        }
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar
          title="Görev Yönetimi"
          subtitle={`${tasks.length} görev`}
          action={
            <button
              onClick={() => setModal(true)}
              className="erp-btn"
              style={{fontSize:12}}
            >
              + Yeni Görev
            </button>
          }
        />

        {toast && (
          <div className={`erp-toast ${toast.startsWith('Hata') ? 'err' : 'ok'}`}>
            {toast}
          </div>
        )}

        {loading ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>
            Yükleniyor...
          </div>
        ) : (
          <div className="kw">
            {COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="kc">
                  {/* Sütun başlık */}
                  <div style={{
                    display:'flex',alignItems:'center',gap:7,
                    padding:'7px 10px',background:'var(--s2)',
                    borderRadius:8,border:'1px solid var(--glass-border)',
                    flexShrink:0,
                  }}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:col.color,flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:700,color:col.color,flex:1}}>{col.label}</span>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--t3)',background:'var(--s3)',padding:'1px 6px',borderRadius:5}}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Görev kartları */}
                  <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:7}}>
                    {colTasks.map(t => {
                      const p = PRI[t.priority] || PRI.normal
                      const overdue = isOverdue(t)
                      return (
                        <div key={t.id} className="kcard" onClick={() => setDetail(t)}>
                          <div style={{fontSize:12,fontWeight:500,lineHeight:1.4,marginBottom:8,color:'var(--text)'}}>
                            {t.title}
                          </div>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                            <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:p.bg,color:p.c}}>
                              {p.label}
                            </span>
                            {t.project && (
                              <span style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:'var(--s3)',color:'var(--t2)'}}>
                                {t.project.name}
                              </span>
                            )}
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{
                              width:22,height:22,borderRadius:'50%',
                              background:'var(--gold-d)',color:'var(--gold)',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              fontSize:8,fontWeight:800,border:'1px solid rgba(232,160,32,0.2)',
                            }}>
                              {t.assignee
                                ? (t.assignee.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
                                : '—'}
                            </div>
                            {t.due_date && (
                              <span style={{
                                fontSize:9,fontWeight:600,fontFamily:'JetBrains Mono',
                                color: overdue ? 'var(--red)' : 'var(--t3)',
                              }}>
                                {overdue && '⚠ '}{t.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {colTasks.length === 0 && (
                      <div style={{
                        padding:'20px 0',textAlign:'center',
                        color:'var(--t3)',fontSize:11,
                        border:'1px dashed var(--glass-border)',
                        borderRadius:8,
                      }}>
                        Görev yok
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Yeni Görev Modal ── */}
      {modal && (
        <div className="ov" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="mb">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Yeni Görev</span>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:22,cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Başlık */}
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>
                  Görev Başlığı <span style={{color:'var(--red)'}}>*</span>
                </label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Görev açıklaması..."
                  style={INP}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) add() }}
                />
              </div>

              <div className="mg">
                {/* Proje */}
                <div>
                  <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>Proje</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} style={{...INP,cursor:'pointer'}}>
                    <option value="">— Seçin —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Sorumlu */}
                <div>
                  <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>Sorumlu</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} style={{...INP,cursor:'pointer'}}>
                    <option value="">— Seçin —</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.department ? ` (${p.department})` : ''}</option>)}
                  </select>
                </div>

                {/* Öncelik */}
                <div>
                  <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} style={{...INP,cursor:'pointer'}}>
                    <option value="critical">🔴 Kritik</option>
                    <option value="high">🟡 Yüksek</option>
                    <option value="normal">🔵 Normal</option>
                    <option value="low">⚪ Düşük</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>Deadline</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
                    style={INP}
                    min={new Date().toISOString().slice(0,10)}
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5,fontWeight:600}}>Açıklama (opsiyonel)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Görev detayları..."
                  rows={2}
                  style={{...INP, resize:'vertical'}}
                />
              </div>

              <button
                onClick={add}
                disabled={adding || !form.title.trim()}
                className="erp-btn"
                style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:13,marginTop:4,opacity:adding||!form.title.trim()?0.6:1,cursor:adding||!form.title.trim()?'not-allowed':'pointer'}}
              >
                {adding ? 'Oluşturuluyor...' : '+ Görev Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Görev Detay Modal ── */}
      {detail && (
        <div className="ov" onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="mb">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700}}>Görev Detayı</span>
              <button onClick={() => setDetail(null)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:22,cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
            </div>

            <div style={{fontSize:14,fontWeight:600,marginBottom:14,lineHeight:1.5,color:'var(--text)'}}>{detail.title}</div>

            {detail.description && (
              <div style={{background:'var(--s2)',borderRadius:8,padding:'10px 12px',marginBottom:12,fontSize:12,color:'var(--t2)',lineHeight:1.6}}>
                {detail.description}
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
              {[
                { l:'Proje',    v: detail.project?.name || '—' },
                { l:'Sorumlu',  v: detail.assignee?.full_name || '—' },
                { l:'Öncelik',  v: PRI[detail.priority]?.label || detail.priority },
                { l:'Durum',    v: COLS.find(c => c.id === detail.status)?.label || detail.status },
                { l:'Deadline', v: detail.due_date || '—' },
              ].map(f => (
                <div key={f.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'var(--s2)',borderRadius:7}}>
                  <span style={{fontSize:11,color:'var(--t3)'}}>{f.l}</span>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{f.v}</span>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,color:'var(--t3)',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em'}}>Sütunu Değiştir</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {COLS.filter(c => c.id !== detail.status).map(c => (
                <button
                  key={c.id}
                  onClick={() => moveTask(detail.id, c.id)}
                  style={{fontSize:11,fontWeight:600,padding:'6px 12px',borderRadius:7,border:`1px solid ${c.color}44`,background:'var(--s2)',color:c.color,cursor:'pointer',transition:'background .15s'}}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--s2)')}
                >
                  → {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => deleteTask(detail.id)}
              style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:'var(--red-d)',color:'var(--red)',fontWeight:700,fontSize:12,cursor:'pointer'}}
            >
              Görevi Sil
            </button>
          </div>
        </div>
      )}
    </>
  )
}