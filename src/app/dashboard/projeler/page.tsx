'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const PROJECTS = [
  {id:1,name:'Web Yenileme',client:'Alfa Dijital',status:'active',progress:72,budget:'₺45.000',deadline:'30 Haz',assignee:'Selin A.',tasks:12,done:8},
  {id:2,name:'Sosyal Medya Yönetimi',client:'Delta Ltd',status:'active',progress:45,budget:'₺18.000',deadline:'Süregelen',assignee:'Emre K.',tasks:8,done:4},
  {id:3,name:'Logo & Kurumsal Kimlik',client:'Beta Marka',status:'active',progress:90,budget:'₺12.000',deadline:'25 Haz',assignee:'Selin A.',tasks:6,done:5},
  {id:4,name:'SEO Paketi',client:'Gama AŞ',status:'active',progress:15,budget:'₺8.000',deadline:'31 Tem',assignee:'Can K.',tasks:10,done:1},
  {id:5,name:'Google Ads Yönetimi',client:'Epsilon Ltd',status:'paused',progress:30,budget:'₺6.000',deadline:'Süregelen',assignee:'Mert Y.',tasks:5,done:2},
]

const STATUS: Record<string,any> = {
  active:{label:'Aktif',c:'var(--green)',bg:'var(--green-d)'},
  paused:{label:'Duraklatıldı',c:'var(--amber)',bg:'var(--amber-d)'},
  completed:{label:'Tamamlandı',c:'var(--blue)',bg:'var(--blue-d)'},
}

export default function ProjelerPage() {
  const [sel, setSel] = useState<number|null>(null)
  const project = PROJECTS.find(p=>p.id===sel)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Projeler" action={
        <button style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>+ Yeni Proje</button>
      }/>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:8}}>
          {PROJECTS.map(p=>{
            const s = STATUS[p.status]
            return (
              <div key={p.id} onClick={()=>setSel(p.id===sel?null:p.id)}
                style={{background:'var(--s1)',border:`1px solid ${p.id===sel?'var(--gold)':'var(--border)'}`,borderRadius:10,padding:'14px 16px',cursor:'pointer',transition:'border-color .1s'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:600,marginRight:10}}>{p.name}</span>
                    <span style={{fontSize:10,color:'var(--t3)'}}>{p.client}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.c}}>{s.label}</span>
                    <span style={{fontSize:12,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)'}}>{p.progress}%</span>
                  </div>
                </div>
                <div style={{height:4,background:'var(--s4)',borderRadius:2,overflow:'hidden',marginBottom:10}}>
                  <div style={{height:'100%',width:`${p.progress}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',borderRadius:2}}/>
                </div>
                <div style={{display:'flex',gap:16}}>
                  {[
                    {label:'Bütçe',val:p.budget},
                    {label:'Deadline',val:p.deadline},
                    {label:'Sorumlu',val:p.assignee},
                    {label:'Görev',val:`${p.done}/${p.tasks}`},
                  ].map(f=>(
                    <div key={f.label}>
                      <div style={{fontSize:9,color:'var(--t3)'}}>{f.label}</div>
                      <div style={{fontSize:11,fontWeight:500,color:'var(--t2)'}}>{f.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {project && (
          <div style={{width:280,borderLeft:'1px solid var(--border)',padding:'16px',overflowY:'auto'}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>{project.name}</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {l:'Müşteri',v:project.client},
                {l:'Durum',v:STATUS[project.status].label},
                {l:'Bütçe',v:project.budget},
                {l:'Deadline',v:project.deadline},
                {l:'Sorumlu',v:project.assignee},
                {l:'İlerleme',v:`${project.progress}%`},
                {l:'Görevler',v:`${project.done} / ${project.tasks} tamamlandı`},
              ].map(f=>(
                <div key={f.l} style={{background:'var(--s2)',borderRadius:6,padding:'8px 10px'}}>
                  <div style={{fontSize:9,color:'var(--t3)',marginBottom:2}}>{f.l}</div>
                  <div style={{fontSize:12,fontWeight:500}}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
