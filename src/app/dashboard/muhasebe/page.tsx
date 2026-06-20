'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X } from 'lucide-react'
import { fmtDeadline } from '@/lib/utils'

const ST: Record<string,any> = {
  paid:    { l:'Ödendi',   c:'var(--green)', bg:'var(--green2)' },
  pending: { l:'Bekliyor', c:'var(--amber)', bg:'var(--amber2)' },
  overdue: { l:'Gecikti',  c:'var(--red)',   bg:'var(--red2)'   },
}
const CATS = ['Proje Geliri','Danışmanlık','Reklam Bütçesi','Yazılım/Araç','Maaş','Ofis','Diğer']

export default function MuhasebePage() {
  const [tab,     setTab]     = useState<'income'|'expense'>('income')
  const [rows,    setRows]    = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects,setProjects]= useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [toast,   setToast]   = useState('')
  const [form,    setForm]    = useState({ description:'', amount:'', category:'', status:'paid', date: new Date().toISOString().slice(0,10), client_id:'', project_id:'' })

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    setLoading(true)
    const sb = createClient()
    const [t, c, p] = await Promise.all([
      sb.from('transactions').select('*, client:clients(name), project:projects(name)').order('date',{ascending:false}),
      sb.from('clients').select('id,name').eq('status','active').order('name'),
      sb.from('projects').select('id,name,client_id').eq('status','active').order('name'),
    ])
    setRows(t.data||[]); setClients(c.data||[]); setProjects(p.data||[])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.description||!form.amount) { showToast('Hata: Açıklama ve tutar zorunlu'); return }
    const sb = createClient(); const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('transactions').insert({
      type:tab, description:form.description, amount:Number(form.amount),
      category:form.category, status:form.status, date:form.date,
      client_id:form.client_id||null, project_id:form.project_id||null,
      created_by:user?.id
    })
    if (error) showToast('Hata: '+error.message)
    else { showToast('Kaydedildi!'); setModal(false); load(); setForm({description:'',amount:'',category:'',status:'paid',date:new Date().toISOString().slice(0,10),client_id:'',project_id:''}) }
  }

  async function del(id:string) {
    if (!confirm('Silinsin mi?')) return
    await createClient().from('transactions').delete().eq('id',id); load()
  }

  const filtered = rows.filter(r=>r.type===tab)
  const income  = rows.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount),0)
  const expense = rows.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount),0)
  const net = income-expense
  const pending = rows.filter(r=>r.status==='pending'||r.status==='overdue').reduce((s,r)=>s+Number(r.amount),0)
  const fmt = (v:number) => `₺${Math.round(v).toLocaleString('tr-TR')}`
  const filtProjects = form.client_id ? projects.filter(p=>p.client_id===form.client_id) : projects

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Muhasebe" action={<button className="btn" onClick={()=>setModal(true)}><Plus size={14} strokeWidth={2}/>Ekle</button>}/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div style={{flex:1,overflowY:'auto',padding:'16px 18px 80px'}}>
          {/* KPI */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Toplam Gelir',       v:income,  c:'var(--green)'},
              {l:'Toplam Gider',       v:expense, c:'var(--red)'  },
              {l:'Net Kar',            v:net,     c:net>=0?'var(--ac)':'var(--red)'},
              {l:'Tahsilat Bekleyen', v:pending,  c:'var(--amber)'},
            ].map(s=>(
              <div key={s.l} className="kpi" style={{borderLeft:`2.5px solid ${s.c}`}}>
                <p className="kpi-label">{s.l}</p>
                <p className="kpi-value" style={{color:s.c,fontSize:20}}>{fmt(s.v)}</p>
              </div>
            ))}
          </div>
          {/* Tabs */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {(['income','expense'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={tab===t?'btn':'btn-ghost'} style={{fontSize:12.5}}>
                {t==='income'?`Gelirler (${rows.filter(r=>r.type==='income').length})`:`Giderler (${rows.filter(r=>r.type==='expense').length})`}
              </button>
            ))}
          </div>
          {/* Liste */}
          <div className="card">
            {loading ? <p style={{padding:24,color:'var(--tx3)',textAlign:'center',fontSize:13}}>Yükleniyor...</p>
            : filtered.length===0 ? <p style={{padding:40,color:'var(--tx3)',textAlign:'center',fontSize:13}}>Kayıt yok.</p>
            : filtered.map((r,i)=>(
              <div key={r.id} className="row" style={{borderBottom:i<filtered.length-1?'1px solid var(--bdr)':'none'}}>
                <div style={{width:32,height:32,borderRadius:8,background:r.type==='income'?'var(--green2)':'var(--red2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                  {r.type==='income'?'↑':'↓'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</p>
                  <div style={{display:'flex',gap:8,marginTop:2,flexWrap:'wrap'}}>
                    {r.category&&<span style={{fontSize:11,color:'var(--tx3)'}}>{r.category}</span>}
                    {r.client&&<span style={{fontSize:11,color:'var(--blue)'}}>· {r.client.name}</span>}
                    {r.project&&<span style={{fontSize:11,color:'var(--ac)'}}>· {r.project.name}</span>}
                    <span style={{fontSize:11,color:'var(--tx3)'}}>· {fmtDeadline(r.date)}</span>
                  </div>
                </div>
                <span className="badge" style={{background:ST[r.status]?.bg,color:ST[r.status]?.c,flexShrink:0}}>{ST[r.status]?.l}</span>
                <span style={{fontSize:15,fontWeight:700,color:r.type==='income'?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                  {r.type==='income'?'+':'−'}₺{Number(r.amount).toLocaleString('tr-TR')}
                </span>
                <button onClick={()=>del(r.id)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18,flexShrink:0}}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>{tab==='income'?'Gelir':'Gider'} Ekle</p>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Açıklama *</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="inp" autoFocus/></div>
              <div className="modal-grid">
                <div><label className="label">Tutar (₺) *</label><input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} className="inp"/></div>
                <div><label className="label">Tarih</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="inp"/></div>
                <div><label className="label">Kategori</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="inp">
                    <option value="paid">Ödendi</option><option value="pending">Bekliyor</option><option value="overdue">Gecikti</option>
                  </select>
                </div>
                <div><label className="label">Müşteri</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value,project_id:''}))} className="inp">
                    <option value="">— Seçin —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Proje</label>
                  <select value={form.project_id} onChange={e=>setForm(p=>({...p,project_id:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>
                    {filtProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn" onClick={add} style={{width:'100%',justifyContent:'center',padding:'10px'}}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
