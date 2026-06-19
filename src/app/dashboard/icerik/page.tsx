'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const CONTENTS = [
  {id:1,title:'Haziran Story Serisi',client:'Delta Ltd',type:'Story',status:'pending',assignee:'Emre K.',due:'Bugün'},
  {id:2,title:'Blog Yazısı #3',client:'Alfa Dijital',type:'Blog',status:'pending',assignee:'Emre K.',due:'Yarın'},
  {id:3,title:'Reklam Görselleri',client:'Gama AŞ',type:'Ad',status:'approved',assignee:'Selin A.',due:'Geçti'},
  {id:4,title:'Story Serisi v2',client:'Beta Marka',type:'Story',status:'revision',assignee:'Selin A.',due:'Bugün'},
  {id:5,title:'Kapak Tasarımları',client:'Epsilon Ltd',type:'Post',status:'draft',assignee:'Can K.',due:'Cuma'},
  {id:6,title:'Haziran Postları',client:'Delta Ltd',type:'Post',status:'published',assignee:'Emre K.',due:'Yayında'},
]

const STATUS: Record<string,any> = {
  draft:{label:'Taslak',c:'var(--t2)',bg:'var(--s3)'},
  pending:{label:'Onay Bekliyor',c:'var(--amber)',bg:'var(--amber-d)'},
  approved:{label:'Onaylandı',c:'var(--green)',bg:'var(--green-d)'},
  revision:{label:'Revizyon',c:'var(--red)',bg:'var(--red-d)'},
  published:{label:'Yayında',c:'var(--blue)',bg:'var(--blue-d)'},
}

export default function IcerikPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter==='all' ? CONTENTS : CONTENTS.filter(c=>c.status===filter)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="İçerik Merkezi" action={
        <button style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>+ Yeni İçerik</button>
      }/>
      <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:6}}>
        {['all','pending','revision','approved','published','draft'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,border:'1px solid',cursor:'pointer',
              borderColor:filter===f?'var(--gold)':'var(--border)',
              background:filter===f?'var(--gold-d)':'transparent',
              color:filter===f?'var(--gold)':'var(--t2)'}}>
            {f==='all'?'Tümü':STATUS[f]?.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(c=>{
          const s = STATUS[c.status]
          return (
            <div key={c.id} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{c.title}</div>
                <div style={{fontSize:11,color:'var(--t3)'}}>{c.client} · {c.type} · {c.assignee}</div>
              </div>
              <span style={{fontSize:10,fontWeight:600,padding:'2px 9px',borderRadius:20,background:s.bg,color:s.c,whiteSpace:'nowrap'}}>{s.label}</span>
              <span style={{fontSize:11,color:c.due==='Bugün'?'var(--red)':'var(--t3)',fontWeight:c.due==='Bugün'?600:400,minWidth:50,textAlign:'right'}}>{c.due}</span>
              {c.status==='pending' && (
                <div style={{display:'flex',gap:5}}>
                  <button style={{fontSize:10,padding:'3px 8px',background:'var(--green-d)',border:'1px solid var(--green)',borderRadius:5,color:'var(--green)',cursor:'pointer'}}>Onayla</button>
                  <button style={{fontSize:10,padding:'3px 8px',background:'var(--red-d)',border:'1px solid var(--red)',borderRadius:5,color:'var(--red)',cursor:'pointer'}}>Revizyon</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
