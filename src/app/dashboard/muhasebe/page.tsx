'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const GELIRLER = [
  {desc:'Sosyal Medya - Delta Ltd',amount:18000,date:'01 Haz',status:'paid'},
  {desc:'Web Projesi - Alfa Dijital',amount:45000,date:'05 Haz',status:'paid'},
  {desc:'SEO Paketi - Gama AŞ',amount:8000,date:'10 Haz',status:'pending'},
  {desc:'Logo Tasarım - Beta Marka',amount:12000,date:'15 Haz',status:'pending'},
  {desc:'Google Ads - Epsilon Ltd',amount:6000,date:'20 Haz',status:'overdue'},
]

const GIDERLER = [
  {desc:'Personel Maaşları',amount:65000,date:'01 Haz',cat:'Maaş'},
  {desc:'Ofis Kirası',amount:8500,date:'01 Haz',cat:'Kira'},
  {desc:'Adobe CC Lisansları',amount:1200,date:'05 Haz',cat:'Yazılım'},
  {desc:'Google Workspace',amount:450,date:'05 Haz',cat:'Yazılım'},
  {desc:'Freelancer Ödemesi',amount:3500,date:'10 Haz',cat:'Freelancer'},
]

const ST: Record<string,any> = {
  paid:{l:'Tahsil',c:'var(--green)',bg:'var(--green-d)'},
  pending:{l:'Bekliyor',c:'var(--amber)',bg:'var(--amber-d)'},
  overdue:{l:'Gecikmiş',c:'var(--red)',bg:'var(--red-d)'},
}

export default function MuhasebePage() {
  const [tab, setTab] = useState<'gelir'|'gider'|'fatura'>('gelir')
  const totalGelir = GELIRLER.reduce((a,b)=>a+b.amount,0)
  const totalGider = GIDERLER.reduce((a,b)=>a+b.amount,0)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Muhasebe" action={
        <button style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>+ Kayıt Ekle</button>
      }/>

      <div style={{padding:'12px 20px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,borderBottom:'1px solid var(--border)'}}>
        {[
          {l:'Toplam Gelir',v:`₺${totalGelir.toLocaleString('tr')}`,c:'var(--green)'},
          {l:'Toplam Gider',v:`₺${totalGider.toLocaleString('tr')}`,c:'var(--red)'},
          {l:'Net Kar',v:`₺${(totalGelir-totalGider).toLocaleString('tr')}`,c:'var(--gold)'},
          {l:'Bekleyen Tahsilat',v:'₺26.000',c:'var(--amber)'},
        ].map(s=>(
          <div key={s.l} style={{background:'var(--s2)',borderRadius:8,padding:'10px 12px',border:'1px solid var(--border)'}}>
            <div style={{fontSize:9,color:'var(--t3)',marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:'JetBrains Mono,monospace'}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:6,padding:'10px 20px',borderBottom:'1px solid var(--border)'}}>
        {(['gelir','gider','fatura'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:6,border:'1px solid',cursor:'pointer',
              borderColor:tab===t?'var(--gold)':'var(--border)',background:tab===t?'var(--gold-d)':'transparent',color:tab===t?'var(--gold)':'var(--t2)'}}>
            {t==='gelir'?'Gelirler':t==='gider'?'Giderler':'Faturalar'}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:'var(--s1)',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)'}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              {(tab==='gelir'?['Açıklama','Tutar','Tarih','Durum']:['Açıklama','Tutar','Tarih','Kategori']).map(h=>(
                <th key={h} style={{padding:'10px 14px',fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em',textAlign:'left'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tab==='gelir'?GELIRLER:GIDERLER).map((r:any,i)=>(
              <tr key={i} style={{borderBottom:i<(tab==='gelir'?GELIRLER:GIDERLER).length-1?'1px solid var(--border)':'none'}}>
                <td style={{padding:'11px 14px',fontSize:13,fontWeight:500}}>{r.desc}</td>
                <td style={{padding:'11px 14px',fontSize:13,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:tab==='gelir'?'var(--green)':'var(--red)'}}>
                  {tab==='gelir'?'+':'−'}₺{r.amount.toLocaleString('tr')}
                </td>
                <td style={{padding:'11px 14px',fontSize:12,color:'var(--t3)'}}>{r.date}</td>
                <td style={{padding:'11px 14px'}}>
                  {tab==='gelir' ? (
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:ST[r.status].bg,color:ST[r.status].c}}>{ST[r.status].l}</span>
                  ) : (
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--s3)',color:'var(--t2)'}}>{r.cat}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
