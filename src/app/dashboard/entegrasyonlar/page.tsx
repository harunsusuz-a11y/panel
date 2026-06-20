'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const ITEMS = [
  {id:1,  name:'Netgsm',            desc:'SMS bildirimleri',       icon:'📱', connected:true,  cat:'İletişim'},
  {id:2,  name:'SMTP Mail',         desc:'E-posta gönderimi',      icon:'📧', connected:true,  cat:'İletişim'},
  {id:3,  name:'WhatsApp Business', desc:'WhatsApp mesajları',     icon:'💬', connected:false, cat:'İletişim'},
  {id:4,  name:'Google Drive',      desc:'Dosya depolama',         icon:'📁', connected:true,  cat:'Depolama'},
  {id:5,  name:'Dropbox',           desc:'Dosya paylaşımı',        icon:'📦', connected:false, cat:'Depolama'},
  {id:6,  name:'Slack',             desc:'Ekip iletişimi',         icon:'💼', connected:false, cat:'Ekip'},
  {id:7,  name:'Google Ads',        desc:'Reklam yönetimi',        icon:'📣', connected:false, cat:'Reklam'},
  {id:8,  name:'Meta Ads',          desc:'FB & Instagram',         icon:'👍', connected:false, cat:'Reklam'},
  {id:9,  name:'Google Analytics',  desc:'Web analitik',           icon:'📊', connected:true,  cat:'Analitik'},
  {id:10, name:'Canva',             desc:'Tasarım aracı',          icon:'🎨', connected:true,  cat:'Tasarım'},
]
const CATS = ['Tümü', ...Array.from(new Set(ITEMS.map(i=>i.cat)))]

export default function EntegrasyonlarPage() {
  const [items, setItems] = useState(ITEMS)
  const [cat, setCat]     = useState('Tümü')
  const [toast, setToast] = useState('')

  function toggle(id:number) {
    const item = items.find(i=>i.id===id)
    setItems(prev=>prev.map(i=>i.id===id?{...i,connected:!i.connected}:i))
    setToast(item?.connected?`${item.name} bağlantısı kesildi`:`${item?.name} bağlandı!`)
    setTimeout(()=>setToast(''),3000)
  }

  const filtered    = cat==='Tümü' ? items : items.filter(i=>i.cat===cat)
  const connCount   = items.filter(i=>i.connected).length

  return (
    <>
      <style>{`.int-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:900px){.int-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.int-grid{grid-template-columns:1fr}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Entegrasyonlar" subtitle={`${connCount}/${items.length} bağlı`}/>
        {toast&&<div className="toast toast-ok">{toast}</div>}
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} className={cat===c?'btn':'btn-ghost'} style={{fontSize:12}}>{c}</button>
            ))}
          </div>
          <div className="int-grid">
            {filtered.map(item=>(
              <div key={item.id} style={{background:'var(--s1)',border:`1px solid ${item.connected?'rgba(34,211,160,.2)':'var(--bdr)'}`,borderRadius:12,padding:'16px 18px',transition:'border-color .15s'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{item.icon}</div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:item.connected?'var(--green)':'var(--s5)',boxShadow:item.connected?'0 0 6px var(--green)':'none',marginTop:4,transition:'background .2s'}}/>
                </div>
                <p style={{fontSize:13.5,fontWeight:600,marginBottom:3}}>{item.name}</p>
                <p style={{fontSize:12,color:'var(--tx2)',marginBottom:14,lineHeight:1.5}}>{item.desc}</p>
                <button onClick={()=>toggle(item.id)} className={item.connected?'btn-danger':'btn'} style={{width:'100%',justifyContent:'center',padding:'7px'}}>
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
