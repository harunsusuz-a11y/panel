'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const COLS = [
  {id:'todo',label:'Bekliyor',color:'var(--t3)'},
  {id:'inprogress',label:'Devam Ediyor',color:'var(--blue)'},
  {id:'review',label:'Kontrolde',color:'var(--amber)'},
  {id:'revision',label:'Revizede',color:'var(--red)'},
  {id:'done',label:'Tamamlandı',color:'var(--green)'},
]

const TASKS = [
  {id:1,col:'inprogress',title:'Haziran sosyal medya postları',client:'Delta Ltd',assignee:'Emre K.',priority:'critical',due:'Bugün 17:00'},
  {id:2,col:'review',title:'Logo tasarımı 2. tur',client:'Beta Marka',assignee:'Selin A.',priority:'high',due:'Bugün 18:00'},
  {id:3,col:'todo',title:'SEO raporu hazırlama',client:'Alfa Dijital',assignee:'Mert Y.',priority:'normal',due:'Yarın'},
  {id:4,col:'revision',title:'Web site banner tasarımı',client:'Gama AŞ',assignee:'Selin A.',priority:'high',due:'Bugün'},
  {id:5,col:'done',title:'Marka brifing analizi',client:'Epsilon Ltd',assignee:'Zeynep Y.',priority:'normal',due:'Dün'},
  {id:6,col:'todo',title:'Google Ads kampanya kurulumu',client:'Alfa Dijital',assignee:'Can K.',priority:'high',due:'Cuma'},
  {id:7,col:'inprogress',title:'Blog yazısı #4',client:'Gama AŞ',assignee:'Emre K.',priority:'normal',due:'Perşembe'},
]

const PRI: Record<string,any> = {
  critical:{label:'Kritik',c:'var(--red)',bg:'var(--red-d)'},
  high:{label:'Yüksek',c:'var(--amber)',bg:'var(--amber-d)'},
  normal:{label:'Normal',c:'var(--blue)',bg:'var(--blue-d)'},
  low:{label:'Düşük',c:'var(--t2)',bg:'var(--s3)'},
}

export default function GorevlerPage() {
  const [tasks, setTasks] = useState(TASKS)
  const [modal, setModal] = useState(false)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Görev Yönetimi" subtitle="Kanban Board" action={
        <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>
          + Yeni Görev
        </button>
      }/>
      <div style={{flex:1,overflowX:'auto',overflowY:'hidden',padding:'16px',display:'flex',gap:10}}>
        {COLS.map(col=>{
          const colTasks = tasks.filter(t=>t.col===col.id)
          return (
            <div key={col.id} style={{width:240,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10,padding:'6px 8px',background:'var(--s2)',borderRadius:7}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.color}}/>
                <span style={{fontSize:12,fontWeight:600,color:col.color,flex:1}}>{col.label}</span>
                <span style={{fontSize:11,fontWeight:700,color:'var(--t3)'}}>{colTasks.length}</span>
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,overflowY:'auto'}}>
                {colTasks.map(t=>{
                  const p = PRI[t.priority]
                  return (
                    <div key={t.id} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:8,padding:'12px'}}>
                      <div style={{fontSize:12,fontWeight:500,marginBottom:8,lineHeight:1.4}}>{t.title}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                        <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:p.bg,color:p.c,fontWeight:600}}>{p.label}</span>
                        <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:'var(--s3)',color:'var(--t2)',fontWeight:600}}>{t.client}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{width:20,height:20,borderRadius:'50%',background:'var(--gold-d)',color:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700}}>
                          {t.assignee.split(' ').map(w=>w[0]).join('')}
                        </div>
                        <span style={{fontSize:9,color:t.due.includes('Bugün')?'var(--red)':'var(--t3)',fontWeight:t.due.includes('Bugün')?600:400}}>{t.due}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
