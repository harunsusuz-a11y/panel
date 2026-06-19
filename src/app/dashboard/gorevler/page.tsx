'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const COLS = [
  { id:'todo', label:'Bekliyor', color:'var(--t3)' },
  { id:'inprogress', label:'Devam', color:'var(--blue)' },
  { id:'review', label:'Kontrol', color:'var(--amber)' },
  { id:'revision', label:'Revize', color:'var(--red)' },
  { id:'done', label:'Tamam', color:'var(--green)' },
]

const INIT_TASKS = [
  { id:1, col:'inprogress', title:'Haziran sosyal medya postları', client:'Delta Ltd', assignee:'Emre K.', priority:'critical', due:'Bugün 17:00' },
  { id:2, col:'review', title:'Logo tasarımı 2. tur', client:'Beta Marka', assignee:'Selin A.', priority:'high', due:'Bugün 18:00' },
  { id:3, col:'todo', title:'SEO raporu hazırlama', client:'Alfa Dijital', assignee:'Mert Y.', priority:'normal', due:'Yarın' },
  { id:4, col:'revision', title:'Web site banner tasarımı', client:'Gama AŞ', assignee:'Selin A.', priority:'high', due:'Bugün' },
  { id:5, col:'done', title:'Marka brifing analizi', client:'Epsilon Ltd', assignee:'Zeynep Y.', priority:'normal', due:'Dün' },
  { id:6, col:'todo', title:'Google Ads kampanya kurulumu', client:'Alfa Dijital', assignee:'Can K.', priority:'high', due:'Cuma' },
  { id:7, col:'inprogress', title:'Blog yazısı #4', client:'Gama AŞ', assignee:'Emre K.', priority:'normal', due:'Perşembe' },
]

const PRI: Record<string,any> = {
  critical:{ label:'Kritik', c:'var(--red)', bg:'var(--red-d)' },
  high:{ label:'Yüksek', c:'var(--amber)', bg:'var(--amber-d)' },
  normal:{ label:'Normal', c:'var(--blue)', bg:'var(--blue-d)' },
  low:{ label:'Düşük', c:'var(--t2)', bg:'var(--s3)' },
}

const ASSIGNEES = ['Emir A.','Aslı','Gizem','Mert','Caner','Yasin','Batuhan','Kerem']
const CLIENTS = ['Alfa Dijital','Beta Marka','Gama AŞ','Delta Ltd','Epsilon Ltd']

const inp: React.CSSProperties = { width:'100%', background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 10px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif' }

export default function GorevlerPage() {
  const [tasks, setTasks] = useState(INIT_TASKS)
  const [modal, setModal] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [form, setForm] = useState({ title:'', client:CLIENTS[0], assignee:ASSIGNEES[0], priority:'normal', due:'', col:'todo' })

  function addTask() {
    if (!form.title) return
    setTasks(t => [...t, { id: Date.now(), ...form }])
    setModal(false)
    setForm({ title:'', client:CLIENTS[0], assignee:ASSIGNEES[0], priority:'normal', due:'', col:'todo' })
  }

  function moveTask(id: number, newCol: string) {
    setTasks(t => t.map(task => task.id === id ? {...task, col: newCol} : task))
    setDetail(null)
  }

  return (
    <>
      <style>{`
        .kanban-wrap { flex: 1; overflow-x: auto; overflow-y: hidden; padding: 12px; display: flex; gap: 10px; }
        .kanban-col { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .modal-box { background: var(--s1); border: 1px solid var(--glass-border); border-radius: 14px; padding: 24px; width: 420px; max-width: calc(100vw - 32px); max-height: 90vh; overflow-y: auto; }
        @media (max-width: 768px) {
          .kanban-col { width: 180px; }
          .modal-grid { grid-template-columns: 1fr; }
          .modal-box { width: 100%; border-radius: 18px 18px 0 0; position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh; padding: 20px; }
          .modal-overlay { align-items: flex-end !important; }
        }
      `}</style>
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <TopBar title="Görev Yönetimi" subtitle="Kanban" action={
          <button onClick={() => setModal(true)} style={{ background:'var(--gold)', color:'#000', fontWeight:700, fontSize:12, padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer' }}>
            + Yeni
          </button>
        }/>

        <div className="kanban-wrap">
          {COLS.map(col => {
            const colTasks = tasks.filter(t => t.col === col.id)
            return (
              <div key={col.id} className="kanban-col">
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8, padding:'6px 8px', background:'var(--s2)', borderRadius:8, border:'1px solid var(--glass-border)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:col.color }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:col.color, flex:1 }}>{col.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--t3)' }}>{colTasks.length}</span>
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7, overflowY:'auto' }}>
                  {colTasks.map(t => {
                    const p = PRI[t.priority]
                    return (
                      <div key={t.id} onClick={() => setDetail(t)}
                        style={{ background:'var(--s1)', border:'1px solid var(--glass-border)', borderRadius:10, padding:'11px', cursor:'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor='var(--border2)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor='var(--glass-border)')}>
                        <div style={{ fontSize:12, fontWeight:500, marginBottom:7, lineHeight:1.4 }}>{t.title}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:7 }}>
                          <span style={{ fontSize:9, padding:'2px 6px', borderRadius:20, background:p.bg, color:p.c, fontWeight:700 }}>{p.label}</span>
                          <span style={{ fontSize:9, padding:'2px 6px', borderRadius:20, background:'var(--s3)', color:'var(--t2)', fontWeight:600 }}>{t.client}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--gold-d)', color:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800 }}>
                            {t.assignee.split(' ').map((w:string)=>w[0]).join('')}
                          </div>
                          <span style={{ fontSize:9, color:t.due.includes('Bugün')?'var(--red)':'var(--t3)', fontWeight:t.due.includes('Bugün')?700:400 }}>{t.due}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Yeni Görev Modal */}
        {modal && (
          <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div className="modal-box">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <span style={{ fontSize:15, fontWeight:700 }}>Yeni Görev</span>
                <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Görev Başlığı</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Görev açıklaması..." style={inp}/>
                </div>
                <div className="modal-grid">
                  <div>
                    <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Müşteri</label>
                    <select value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      {CLIENTS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Sorumlu</label>
                    <select value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      {ASSIGNEES.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Öncelik</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="critical">Kritik</option>
                      <option value="high">Yüksek</option>
                      <option value="normal">Normal</option>
                      <option value="low">Düşük</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Sütun</label>
                    <select value={form.col} onChange={e=>setForm(f=>({...f,col:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      {COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'var(--t2)', display:'block', marginBottom:5 }}>Deadline</label>
                  <input value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))} placeholder="Bugün 17:00, Yarın..." style={inp}/>
                </div>
                <button onClick={addTask} style={{ background:'var(--gold)', color:'#000', fontWeight:700, fontSize:13, padding:'11px', borderRadius:9, border:'none', cursor:'pointer', marginTop:2 }}>
                  Görev Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detay Modal */}
        {detail && (
          <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div className="modal-box">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:15, fontWeight:700 }}>Görev Detayı</span>
                <button onClick={() => setDetail(null)} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
              </div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14, lineHeight:1.4 }}>{detail.title}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:16 }}>
                {[{ l:'Müşteri', v:detail.client }, { l:'Sorumlu', v:detail.assignee }, { l:'Öncelik', v:PRI[detail.priority]?.label }, { l:'Deadline', v:detail.due }].map(f => (
                  <div key={f.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'var(--s2)', borderRadius:8 }}>
                    <span style={{ fontSize:11, color:'var(--t3)' }}>{f.l}</span>
                    <span style={{ fontSize:12, fontWeight:600 }}>{f.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:'var(--t2)', marginBottom:8 }}>Sütunu Değiştir:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {COLS.filter(c => c.id !== detail.col).map(c => (
                  <button key={c.id} onClick={() => moveTask(detail.id, c.id)}
                    style={{ fontSize:11, fontWeight:600, padding:'6px 12px', borderRadius:7, border:'1px solid var(--glass-border)', background:'var(--s2)', color:c.color, cursor:'pointer' }}>
                    → {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}