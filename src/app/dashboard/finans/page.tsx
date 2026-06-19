'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

function BarChart({ data, labels, colors }: { data:number[]; labels:string[]; colors:string[] }) {
  const [m, setM] = useState(false)
  useEffect(()=>{ setTimeout(()=>setM(true),100) },[])
  const max = Math.max(...data,1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120,padding:'0 4px'}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
          <div style={{fontSize:9,color:colors[i],fontWeight:700,fontFamily:'JetBrains Mono'}}>{v>0?`₺${v}K`:''}</div>
          <div style={{width:'100%',height:m?`${(v/max)*90}px`:'0px',background:colors[i],borderRadius:'4px 4px 0 0',transition:`height 0.7s cubic-bezier(0.22,1,0.36,1) ${i*60}ms`,border:`1px solid ${colors[i]}44`}}/>
          <div style={{fontSize:9,color:'var(--t3)'}}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

export default function FinansPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    createClient().from('transactions').select('*').order('date').then(({data})=>{ setRows(data||[]); setLoading(false) })
  },[])

  const income = rows.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount),0)
  const expense = rows.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount),0)
  const net = income - expense
  const pending = rows.filter(r=>r.status==='pending'||r.status==='overdue').reduce((s,r)=>s+Number(r.amount),0)

  // Kategori bazlı gelir
  const catMap: Record<string,number> = {}
  rows.filter(r=>r.type==='income').forEach(r=>{ catMap[r.category||'Diğer']=(catMap[r.category||'Diğer']||0)+Number(r.amount)/1000 })
  const cats = Object.keys(catMap)
  const catVals = cats.map(c=>Math.round(catMap[c]))
  const catColors = ['var(--gold)','var(--blue)','var(--green)','var(--purple)','var(--amber)']

  // Son 6 ay (dummy aylık toplam - grouped by month)
  const months = ['Oca','Şub','Mar','Nis','May','Haz']
  const monthlyInc = [148,162,175,190,185,Math.round(income/1000)]
  const monthlyExp = [80,85,90,88,92,Math.round(expense/1000)]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Finans" subtitle="Gelir & Gider Analizi"/>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
        {loading ? <div style={{color:'var(--t3)',fontSize:12,padding:20}}>Yükleniyor...</div> : (<>
          
          {/* KPI */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'Toplam Gelir',v:income,c:'var(--green)'},
              {l:'Toplam Gider',v:expense,c:'var(--red)'},
              {l:'Net Kar',v:net,c:net>=0?'var(--gold)':'var(--red)'},
              {l:'Tahsilat Bekleyen',v:pending,c:'var(--amber)'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'14px 16px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${s.c}66,transparent)`}}/>
                <div style={{fontSize:10,color:'var(--t3)',marginBottom:6}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:'JetBrains Mono'}}>₺{s.v.toLocaleString('tr-TR')}</div>
              </div>
            ))}
          </div>

          {/* Grafikler */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Aylık Gelir Trendi</div>
              <div style={{fontSize:10,color:'var(--t3)',marginBottom:12}}>Son 6 ay (₺K)</div>
              <BarChart data={monthlyInc} labels={months} colors={months.map((_,i)=>i===5?'var(--gold)':'rgba(107,140,255,0.5)')}/>
            </div>
            <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Kategori Dağılımı</div>
              <div style={{fontSize:10,color:'var(--t3)',marginBottom:12}}>Gelir kategorileri (₺K)</div>
              <BarChart data={catVals.length?catVals:[0]} labels={cats.length?cats:['—']} colors={catColors}/>
            </div>
          </div>

          {/* Gelir vs Gider karşılaştırma */}
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'14px 16px',marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Gelir — Gider Karşılaştırması</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {l:'Gelir',v:income,max:income+expense,c:'var(--green)'},
                {l:'Gider',v:expense,max:income+expense,c:'var(--red)'},
                {l:'Net',v:Math.abs(net),max:income+expense,c:net>=0?'var(--gold)':'var(--red)'},
              ].map(item=>(
                <div key={item.l}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:12,color:'var(--t2)'}}>{item.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:item.c,fontFamily:'JetBrains Mono'}}>₺{item.v.toLocaleString('tr-TR')}</span>
                  </div>
                  <div style={{height:6,background:'var(--s4)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${item.max?Math.round((item.v/item.max)*100):0}%`,background:item.c,borderRadius:3,transition:'width 1s ease'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Son işlemler */}
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--glass-border)',fontSize:13,fontWeight:700}}>Son İşlemler</div>
            {rows.slice(0,8).map((r,i)=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:i<7?'1px solid var(--glass-border)':'none'}}>
                <div style={{width:32,height:32,borderRadius:8,background:r.type==='income'?'var(--green-d)':'var(--red-d)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                  {r.type==='income'?'↑':'↓'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>
                  <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{r.category||'—'} · {r.date}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:r.type==='income'?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono',flexShrink:0}}>
                  {r.type==='income'?'+':'−'}₺{Number(r.amount).toLocaleString('tr-TR')}
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}