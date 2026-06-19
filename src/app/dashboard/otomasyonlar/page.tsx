'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const RULES = [
  {id:1,name:'Görev Gecikme Uyarısı',trigger:'Görev gecikti',action:'SMS + Mail gönder',active:true},
  {id:2,name:'Müşteri Onay Hatırlatma',trigger:'Müşteri onayı 24 saat geçikti',action:'WhatsApp + Mail gönder',active:true},
  {id:3,name:'Fatura Gecikme Alarmı',trigger:'Fatura 7 gün geçikti',action:'Finans uyarısı + SMS',active:false},
  {id:4,name:'SLA İhlal Bildirimi',trigger:'SLA kritik seviyeye ulaştı',action:'CEO bildirimi gönder',active:true},
]

export default function OtomasyonlarPage() {
  const [rules, setRules] = useState(RULES)
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Otomasyon Motoru" action={
        <button style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>+ Yeni Kural</button>
      }/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'var(--gold-d)',border:'1px solid var(--gold)',borderRadius:8,padding:'12px 14px',fontSize:12,color:'var(--gold)'}}>
          ⚡ IF/THEN mantığıyla çalışan otomasyonlar. Kod yazmadan kural oluşturun.
        </div>
        {rules.map(r=>(
          <div key={r.id} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:600}}>{r.name}</span>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,
                  background:r.active?'var(--green-d)':'var(--s3)',color:r.active?'var(--green)':'var(--t3)'}}>
                  {r.active?'Aktif':'Pasif'}
                </span>
                <button onClick={()=>setRules(rs=>rs.map(x=>x.id===r.id?{...x,active:!x.active}:x))}
                  style={{fontSize:10,padding:'3px 8px',background:'var(--s3)',border:'1px solid var(--border)',borderRadius:5,color:'var(--t2)',cursor:'pointer'}}>
                  {r.active?'Durdur':'Aktifleştir'}
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:10,alignItems:'center'}}>
              <div style={{background:'var(--blue-d)',borderRadius:7,padding:'10px 12px'}}>
                <div style={{fontSize:9,color:'var(--blue)',fontWeight:700,marginBottom:3}}>IF · Tetikleyici</div>
                <div style={{fontSize:12}}>{r.trigger}</div>
              </div>
              <div style={{fontSize:18,color:'var(--gold)'}}>→</div>
              <div style={{background:'var(--green-d)',borderRadius:7,padding:'10px 12px'}}>
                <div style={{fontSize:9,color:'var(--green)',fontWeight:700,marginBottom:3}}>THEN · Aksiyon</div>
                <div style={{fontSize:12}}>{r.action}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
