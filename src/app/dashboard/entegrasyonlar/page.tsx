'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const INTEGRATIONS = [
  {id:1,name:'Netgsm',desc:'SMS bildirimleri',icon:'📱',connected:true,cat:'İletişim'},
  {id:2,name:'SMTP Mail',desc:'E-posta gönderimi',icon:'📧',connected:true,cat:'İletişim'},
  {id:3,name:'WhatsApp Business',desc:'WhatsApp mesajları',icon:'💬',connected:false,cat:'İletişim'},
  {id:4,name:'Google Drive',desc:'Dosya depolama',icon:'📁',connected:true,cat:'Depolama'},
  {id:5,name:'Dropbox',desc:'Dosya paylaşımı',icon:'📦',connected:false,cat:'Depolama'},
  {id:6,name:'Slack',desc:'Ekip iletişimi',icon:'#',connected:false,cat:'Ekip'},
  {id:7,name:'Zoom',desc:'Video görüşme',icon:'🎥',connected:false,cat:'Ekip'},
  {id:8,name:'Google Ads',desc:'Reklam yönetimi',icon:'📣',connected:false,cat:'Reklam'},
  {id:9,name:'Meta Ads',desc:'Facebook & Instagram reklamları',icon:'👍',connected:false,cat:'Reklam'},
  {id:10,name:'Google Analytics',desc:'Web analitik',icon:'📊',connected:true,cat:'Analitik'},
  {id:11,name:'Hotjar',desc:'Isı haritaları',icon:'🔥',connected:false,cat:'Analitik'},
  {id:12,name:'Canva',desc:'Tasarım aracı',icon:'🎨',connected:true,cat:'Tasarım'},
]

const CATS = ['Tümü',...Array.from(new Set(INTEGRATIONS.map(i=>i.cat)))]

export default function EntegrasyonlarPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [cat, setCat] = useState('Tümü')
  const [toast, setToast] = useState('')

  function toggle(id:number) {
    setIntegrations(prev=>prev.map(i=>i.id===id?{...i,connected:!i.connected}:i))
    const item = integrations.find(i=>i.id===id)
    setToast(item?.connected ? `${item.name} bağlantısı kesildi` : `${item?.name} bağlandı!`)
    setTimeout(()=>setToast(''),3000)
  }

  const filtered = cat==='Tümü' ? integrations : integrations.filter(i=>i.cat===cat)
  const connectedCount = integrations.filter(i=>i.connected).length

  return (
    <>
      <style>{`.int-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;} @media(max-width:768px){.int-grid{grid-template-columns:1fr 1fr;}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Entegrasyonlar" subtitle={`${connectedCount} bağlı`}/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:'var(--green-d)',color:'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                background:cat===c?'var(--gold)':'var(--s2)',color:cat===c?'#000':'var(--t2)'}}>
                {c}
              </button>
            ))}
          </div>
          <div className="int-grid">
            {filtered.map(item=>(
              <div key={item.id} style={{background:'var(--s1)',border:`1px solid ${item.connected?'rgba(34,214,110,0.2)':'var(--glass-border)'}`,borderRadius:12,padding:'16px',transition:'border-color 0.2s'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {item.icon}
                  </div>
                  <div style={{width:10,height:10,borderRadius:'50%',background:item.connected?'var(--green)':'var(--t3)',boxShadow:item.connected?'0 0 6px var(--green)':'none',marginTop:4}}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{item.name}</div>
                <div style={{fontSize:11,color:'var(--t3)',marginBottom:12}}>{item.desc}</div>
                <button onClick={()=>toggle(item.id)}
                  style={{width:'100%',padding:'7px',borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                    background:item.connected?'var(--red-d)':'var(--gold)',
                    color:item.connected?'var(--red)':'#000'}}>
                  {item.connected?'Bağlantıyı Kes':'Bağlan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}