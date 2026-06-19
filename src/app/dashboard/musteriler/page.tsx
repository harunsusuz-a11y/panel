'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const MUSTERILER = [
  {id:1,name:'Alfa Dijital',contact:'Ahmet Yılmaz',email:'ahmet@alfa.com',phone:'0532 111 2233',status:'active',projects:3,score:92},
  {id:2,name:'Beta Marka',contact:'Ayşe Demir',email:'ayse@beta.com',phone:'0533 222 3344',status:'active',projects:2,score:78},
  {id:3,name:'Gama AŞ',contact:'Mehmet Kaya',email:'mehmet@gama.com',phone:'0534 333 4455',status:'active',projects:4,score:85},
  {id:4,name:'Delta Ltd',contact:'Fatma Şahin',email:'fatma@delta.com',phone:'0535 444 5566',status:'active',projects:1,score:65},
  {id:5,name:'Epsilon Ltd',contact:'Ali Can',email:'ali@epsilon.com',phone:'0536 555 6677',status:'passive',projects:2,score:45},
]

export default function MusterilerPage() {
  const [selected, setSelected] = useState<number|null>(null)
  const [search, setSearch] = useState('')
  const filtered = MUSTERILER.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  const sel = MUSTERILER.find(m=>m.id===selected)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="CRM / Müşteriler" action={
        <button style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>
          + Yeni Müşteri
        </button>
      }/>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Liste */}
        <div style={{width:320,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'12px',borderBottom:'1px solid var(--border)'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Müşteri ara..."
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 10px',fontSize:12,color:'var(--text)',outline:'none',fontFamily:'Inter,sans-serif'}}/>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {filtered.map(m=>(
              <div key={m.id} onClick={()=>setSelected(m.id)}
                style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',
                  background:selected===m.id?'var(--gold-d)':'transparent',
                  borderLeft:selected===m.id?'2px solid var(--gold)':'2px solid transparent'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:selected===m.id?'var(--gold)':'var(--text)'}}>{m.name}</span>
                  <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,
                    background:m.status==='active'?'var(--green-d)':'var(--s3)',
                    color:m.status==='active'?'var(--green)':'var(--t3)',fontWeight:600}}>
                    {m.status==='active'?'Aktif':'Pasif'}
                  </span>
                </div>
                <div style={{fontSize:11,color:'var(--t2)'}}>{m.contact} · {m.projects} proje</div>
                <div style={{marginTop:6,height:3,background:'var(--s4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${m.score}%`,background:m.score>80?'var(--green)':m.score>60?'var(--amber)':'var(--red)',borderRadius:2}}/>
                </div>
                <div style={{fontSize:9,color:'var(--t3)',marginTop:2}}>Sağlık Skoru: {m.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detay */}
        {sel ? (
          <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {[
                {label:'Firma',value:sel.name},
                {label:'Yetkili',value:sel.contact},
                {label:'E-posta',value:sel.email},
                {label:'Telefon',value:sel.phone},
              ].map(f=>(
                <div key={f.label} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 14px'}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:8,padding:'14px'}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Notlar</div>
              <textarea placeholder="Müşteri hakkında notlar..." rows={4}
                style={{width:'100%',background:'var(--s2)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 10px',fontSize:12,color:'var(--text)',outline:'none',fontFamily:'Inter,sans-serif',resize:'vertical'}}/>
            </div>
          </div>
        ) : (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>
            Müşteri seçin
          </div>
        )}
      </div>
    </div>
  )
}
