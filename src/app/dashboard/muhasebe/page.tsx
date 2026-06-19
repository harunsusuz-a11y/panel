'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }
const STATUS_MAP: Record<string,any> = {
  paid:   {l:'Ödendi',   c:'var(--green)', bg:'var(--green-d)'},
  pending:{l:'Bekliyor', c:'var(--amber)', bg:'var(--amber-d)'},
  overdue:{l:'Gecikti',  c:'var(--red)',   bg:'var(--red-d)'},
}

export default function MuhasebePage() {
  const [tab, setTab] = useState<'income'|'expense'>('income')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ description:'', amount:'', category:'', status:'paid', date: new Date().toISOString().slice(0,10) })

  const stats = {
    income:  rows.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount),0),
    expense: rows.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount),0),
    pending: rows.filter(r=>r.status==='pending').reduce((s,r)=>s+Number(r.amount),0),
    overdue: rows.filter(r=>r.status==='overdue').reduce((s,r)=>s+Number(r.amount),0),
  }
  const net = stats.income - stats.expense

  async function load() {
    setLoading(true)
    const sb = createClient()
    const { data } = await sb.from('transactions').select('*').order('date', {ascending:false})
    setRows(data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.description || !form.amount) return
    const sb = createClient()
    const { error } = await sb.from('transactions').insert({
      type: tab, description: form.description, amount: Number(form.amount),
      category: form.category, status: form.status, date: form.date,
    })
    if (error) { setToast('Hata: '+error.message) }
    else { setToast('Kayıt eklendi!'); setModal(false); load(); setForm({description:'',amount:'',category:'',status:'paid',date:new Date().toISOString().slice(0,10)}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function del(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const sb = createClient()
    await sb.from('transactions').delete().eq('id', id)
    load()
  }

  const filtered = rows.filter(r=>r.type===tab)

  return (
    <>
      <style>{`
        .muh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        @media(max-width:768px){.muh-stats{grid-template-columns:repeat(2,1fr);}}
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Muhasebe" action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ Ekle</button>
        }/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
          
          <div className="muh-stats">
            {[
              {l:'Toplam Gelir', v:stats.income, c:'var(--green)'},
              {l:'Toplam Gider', v:stats.expense, c:'var(--red)'},
              {l:'Net Kar', v:net, c:net>=0?'var(--gold)':'var(--red)'},
              {l:'Bekleyen', v:stats.pending+stats.overdue, c:'var(--amber)'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'14px'}}>
                <div style={{fontSize:10,color:'var(--t3)',marginBottom:6}}>{s.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:s.c,fontFamily:'JetBrains Mono'}}>₺{s.v.toLocaleString('tr-TR')}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {(['income','expense'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:12,
                background:tab===t?'var(--gold)':'var(--s2)',color:tab===t?'#000':'var(--t2)'}}>
                {t==='income'?'Gelirler':'Giderler'}
              </button>
            ))}
          </div>

          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,overflow:'hidden'}}>
            {loading ? <div style={{padding:20,color:'var(--t3)',fontSize:12,textAlign:'center'}}>Yükleniyor...</div> : filtered.length===0 ? (
              <div style={{padding:40,color:'var(--t3)',fontSize:13,textAlign:'center'}}>Kayıt yok. + Ekle ile yeni kayıt oluşturun.</div>
            ) : filtered.map((r,i)=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid var(--glass-border)':'none'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>
                  <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{r.category||'—'} · {r.date}</div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:r.type==='income'?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono',flexShrink:0}}>
                  {r.type==='income'?'+':'−'}₺{Number(r.amount).toLocaleString('tr-TR')}
                </div>
                <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:STATUS_MAP[r.status]?.bg,color:STATUS_MAP[r.status]?.c,flexShrink:0,whiteSpace:'nowrap'}}>
                  {STATUS_MAP[r.status]?.l}
                </span>
                <button onClick={()=>del(r.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:16,lineHeight:1,flexShrink:0}}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>{tab==='income'?'Gelir':'Gider'} Ekle</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Açıklama</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Hizmet açıklaması..." style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Tutar (₺)</label><input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0" style={inp}/></div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Tarih</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Kategori</label><input value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="SEO, Tasarım..." style={inp}/></div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="paid">Ödendi</option><option value="pending">Bekliyor</option><option value="overdue">Gecikti</option>
                  </select>
                </div>
              </div>
              <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}