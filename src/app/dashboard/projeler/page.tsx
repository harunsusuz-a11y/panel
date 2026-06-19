'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const PROJECTS = [
  { id:1, name:'Web Yenileme', client:'Alfa Dijital', status:'active', progress:72, budget:'₺45.000', deadline:'30 Haz', assignee:'Selin A.', tasks:12, done:8 },
  { id:2, name:'Sosyal Medya Yönetimi', client:'Delta Ltd', status:'active', progress:45, budget:'₺18.000', deadline:'Süregelen', assignee:'Emre K.', tasks:8, done:4 },
  { id:3, name:'Logo & Kurumsal Kimlik', client:'Beta Marka', status:'active', progress:90, budget:'₺12.000', deadline:'25 Haz', assignee:'Selin A.', tasks:6, done:5 },
  { id:4, name:'SEO Paketi', client:'Gama AŞ', status:'active', progress:15, budget:'₺8.000', deadline:'31 Tem', assignee:'Can K.', tasks:10, done:1 },
  { id:5, name:'Google Ads Yönetimi', client:'Epsilon Ltd', status:'paused', progress:30, budget:'₺6.000', deadline:'Süregelen', assignee:'Mert Y.', tasks:5, done:2 },
]

const STATUS: Record<string,any> = {
  active:{ label:'Aktif', c:'var(--green)', bg:'var(--green-d)' },
  paused:{ label:'Duraklatıldı', c:'var(--amber)', bg:'var(--amber-d)' },
  completed:{ label:'Tamamlandı', c:'var(--blue)', bg:'var(--blue-d)' },
}

export default function ProjelerPage() {
  const [sel, setSel] = useState<number|null>(null)
  const project = PROJECTS.find(p => p.id === sel)

  return (
    <>
      <style>{`
        .prj-wrap { flex: 1; display: flex; overflow: hidden; }
        .prj-list { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .prj-panel { width: 280px; border-left: 1px solid var(--glass-border); padding: 16px; overflow-y: auto; }
        @media (max-width: 768px) {
          .prj-panel { position: fixed; inset: 0; z-index: 200; background: var(--bg); width: 100%; padding: 0; display: flex; flex-direction: column; border-left: none; }
          .prj-panel-inner { flex: 1; overflow-y: auto; padding: 14px; }
          .prj-panel-header { height: 52px; display: flex; align-items: center; gap: 12px; padding: 0 16px; border-bottom: 1px solid var(--glass-border); background: var(--s1); flex-shrink: 0; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Projeler" action={
          <button style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer' }}>
            + Yeni
          </button>
        }/>
        <div className="prj-wrap">
          <div className="prj-list">
            {PROJECTS.map(p => {
              const s = STATUS[p.status]
              return (
                <div key={p.id} onClick={() => setSel(p.id === sel ? null : p.id)}
                  style={{ background: 'var(--s1)', border: `1px solid ${p.id === sel ? 'var(--gold)' : 'var(--glass-border)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.client}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.c }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono', color: p.progress > 70 ? 'var(--green)' : p.progress > 40 ? 'var(--gold)' : 'var(--red)' }}>{p.progress}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress > 70 ? 'var(--green)' : p.progress > 40 ? 'var(--gold)' : 'var(--red)', borderRadius: 2, transition: 'width 0.6s ease' }}/>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[{ label:'Bütçe', val:p.budget }, { label:'Deadline', val:p.deadline }, { label:'Sorumlu', val:p.assignee }, { label:'Görev', val:`${p.done}/${p.tasks}` }].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 9, color: 'var(--t3)' }}>{f.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)', marginTop: 1 }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {project && (
            <div className="prj-panel">
              <div className="prj-panel-header">
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Geri
                </button>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{project.name}</span>
              </div>
              <div className="prj-panel-inner">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ l:'Müşteri', v:project.client }, { l:'Durum', v:STATUS[project.status].label }, { l:'Bütçe', v:project.budget }, { l:'Deadline', v:project.deadline }, { l:'Sorumlu', v:project.assignee }, { l:'İlerleme', v:`${project.progress}%` }, { l:'Görevler', v:`${project.done} / ${project.tasks} tamamlandı` }].map(f => (
                    <div key={f.l} style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 3 }}>{f.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}