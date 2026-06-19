import TopBar from '@/components/TopBar'
import StatCard from '@/components/StatCard'
export default function FinansPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Finans"/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          <StatCard label="Toplam Gelir" value="₺248K" chip="bu ay" accent="var(--green)" icon="💰"/>
          <StatCard label="Toplam Gider" value="₺89K" chip="bu ay" accent="var(--red)" icon="💸"/>
          <StatCard label="Net Kar" value="₺159K" chip="+12%" accent="var(--gold)" icon="📈"/>
          <StatCard label="Nakit Pozisyon" value="₺320K" chip="banka" accent="var(--blue)" icon="🏦"/>
        </div>
        <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:10,padding:'16px'}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Müşteri Karlılık Analizi</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Müşteri','Gelir','Maliyet','Kar','Marj'].map(h=><th key={h} style={{padding:'8px 0',fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',textAlign:'left',borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                {c:'Alfa Dijital',g:45000,m:18000},
                {c:'Delta Ltd',g:18000,m:6000},
                {c:'Beta Marka',g:12000,m:4500},
                {c:'Gama AŞ',g:8000,m:3000},
                {c:'Epsilon Ltd',g:6000,m:2500},
              ].map((r,i,arr)=>{
                const kar=r.g-r.m; const marj=Math.round((kar/r.g)*100)
                return (
                  <tr key={r.c} style={{borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                    <td style={{padding:'10px 0',fontSize:13,fontWeight:500}}>{r.c}</td>
                    <td style={{padding:'10px 0',fontSize:12,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>₺{r.g.toLocaleString('tr')}</td>
                    <td style={{padding:'10px 0',fontSize:12,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>₺{r.m.toLocaleString('tr')}</td>
                    <td style={{padding:'10px 0',fontSize:12,color:'var(--gold)',fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>₺{kar.toLocaleString('tr')}</td>
                    <td style={{padding:'10px 0'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:marj>60?'var(--green-d)':'var(--amber-d)',color:marj>60?'var(--green)':'var(--amber)'}}>%{marj}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
