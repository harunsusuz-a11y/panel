'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const INTEGRATIONS = [
  {name:'Netgsm',desc:'SMS bildirimleri',icon:'📱',connected:true,cat:'İletişim'},
  {name:'SMTP Mail',desc:'E-posta gönderimi',icon:'📧',connected:true,cat:'İletişim'},
  {name:'WhatsApp Business',desc:'WhatsApp mesajları',icon:'💬',connected:false,cat:'İletişim'},
  {name:'Google Calendar',desc:'Takvim entegrasyonu',icon:'📅',connected:false,cat:'Verimlilik'},
  {name:'Google Drive',desc:'Dosya depolama',icon:'💾',connected:false,cat:'Verimlilik'},
  {name:'Meta API',desc:'Instagram & Facebook',icon:'📘',connected:false,cat:'Sosyal Medya'},
  {name:'OpenAI',desc:'AI destekli özellikler',icon:'🤖',connected:false,cat:'AI'},
  {name:'Webhook',desc:'Özel entegrasyonlar',icon:'🔗',connected:true,cat:'Geliştirici'},
]

export default function EntegrasyonlarPage() {
  const [ints, setInts] = useState(INTEGRATIONS)
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Entegrasyon Merkezi"/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {ints.map(int=>(
            <div key={int.name} style={{background:'var(--s1)',border:`1px solid ${int.connected?'var(--green)':'var(--border)'}`,borderRadius:10,padding:'16px'}}>
              <div style={{fontSize:28,marginBottom:10}}>{int.icon}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{int.name}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>{int.cat}</div>
              <div style={{fontSize:11,color:'var(--t2)',marginBottom:12}}>{int.desc}</div>
              <button onClick={()=>setInts(is=>is.map(x=>x.name===int.name?{...x,connected:!x.connected}:x))}
                style={{width:'100%',fontSize:11,fontWeight:600,padding:'6px',borderRadius:6,border:'1px solid',cursor:'pointer',
                  borderColor:int.connected?'var(--red)':'var(--gold)',
                  background:int.connected?'var(--red-d)':'var(--gold-d)',
                  color:int.connected?'var(--red)':'var(--gold)'}}>
                {int.connected?'Bağlantıyı Kes':'Bağlan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
