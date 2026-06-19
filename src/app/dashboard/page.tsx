import TopBar from '@/components/TopBar'
import StatCard from '@/components/StatCard'

const delays = [
  {av:'EK',name:'Emre K.',role:'İçerik',task:'Haziran sosyal medya postları',hrs:'+38 sa',pct:100,c:'var(--red)',sev:'Kritik'},
  {av:'SA',name:'Selin A.',role:'Tasarım',task:'Logo 2. tur revizyonu',hrs:'+26 sa',pct:75,c:'var(--red)',sev:'Kritik'},
  {av:'ZY',name:'Zeynep Y.',role:'Müşteri İlişkileri',task:'Brifing onayı',hrs:'+18 sa',pct:55,c:'var(--amber)',sev:'Yüksek'},
  {av:'CK',name:'Can K.',role:'Tasarım',task:'Reklam görseli',hrs:'+8 sa',pct:25,c:'var(--blue)',sev:'Normal'},
]

const liveTasks = [
  {user:'Selin A.',task:'Logo tasarımı',client:'Beta Marka',start:'09:00',est:'12:00',status:'Devam Ediyor'},
  {user:'Emre K.',task:'Blog yazısı',client:'Alfa Ltd',start:'10:30',est:'13:00',status:'Devam Ediyor'},
  {user:'Mert Y.',task:'Teklif hazırlığı',client:'Gama AŞ',start:'11:00',est:'12:30',status:'İncelemede'},
]

const upcoming = [
  {task:'Sosyal medya postları',client:'Delta Ltd',assignee:'Emre K.',date:'Bugün 17:00',urgent:true},
  {task:'Web site güncelleme',client:'Alfa Dijital',assignee:'Selin A.',date:'Bugün 18:00',urgent:true},
  {task:'SEO raporu',client:'Epsilon Ltd',assignee:'Mert Y.',date:'Yarın 10:00',urgent:false},
  {task:'Reklam görselleri',client:'Beta Marka',assignee:'Selin A.',date:'Yarın 14:00',urgent:false},
]

const finans = [
  {label:'Toplam Gelir',value:'₺248.500',color:'var(--green)'},
  {label:'Toplam Gider',value:'₺89.200',color:'var(--red)'},
  {label:'Net Kar',value:'₺159.300',color:'var(--gold)'},
  {label:'Bekleyen Tahsilat',value:'₺42.000',color:'var(--amber)'},
  {label:'Geciken Tahsilat',value:'₺12.500',color:'var(--red)'},
]

const panel: React.CSSProperties = {background:'var(--s1)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}
const ph = (c='var(--gold)') => ({display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--border)'} as React.CSSProperties)

export default function DashboardPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Dashboard" subtitle="Ajans operasyonuna genel bakış" action={
        <div style={{display:'flex',gap:8}}>
          <div style={{fontSize:11,color:'var(--t2)',padding:'5px 10px',background:'var(--s2)',borderRadius:6,border:'1px solid var(--border)'}}>
            📅 Canlı
          </div>
        </div>
      }/>

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
          <StatCard label="Aktif Müşteri" value="12" chip="+2 bu ay" accent="var(--gold)" icon="🏢"/>
          <StatCard label="Aktif Proje" value="18" chip="8 yeni" accent="var(--blue)" icon="📁"/>
          <StatCard label="Açık Görev" value="64" chip="bu hafta" accent="var(--t2)" icon="📋"/>
          <StatCard label="Tamamlanan" value="47" chip="bu ay" accent="var(--green)" icon="✅"/>
          <StatCard label="Geciken" value="7" chip="⚠ dikkat" accent="var(--red)" icon="⏰"/>
          <StatCard label="Kritik" value="3" chip="acil" accent="var(--red)" icon="🚨"/>
          <StatCard label="Onay Bekleyen" value="5" chip="acil" accent="var(--amber)" icon="⏳"/>
        </div>

        {/* Canlı Operasyon + Geciken */}
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:12}}>
          <div style={panel}>
            <div style={ph()}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{fontSize:8,color:'var(--green)'}}>⬤</span>
                <span style={{fontSize:13,fontWeight:600}}>Canlı Operasyon</span>
                <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:'var(--green-d)',color:'var(--green)',fontWeight:600}}>{liveTasks.length} aktif</span>
              </div>
            </div>
            <div style={{padding:'0 16px'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>{['Kullanıcı','Görev','Müşteri','Başlangıç','Tahmini Bitiş','Durum'].map(h=>(
                    <th key={h} style={{fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em',padding:'8px 0',textAlign:'left',borderBottom:'1px solid var(--border)'}}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {liveTasks.map((t,i)=>(
                    <tr key={i}>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none',fontSize:12,fontWeight:500}}>{t.user}</td>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none',fontSize:12,color:'var(--t2)'}}>{t.task}</td>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none',fontSize:12,color:'var(--t2)'}}>{t.client}</td>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none',fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--t3)'}}>{t.start}</td>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none',fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--t3)'}}>{t.est}</td>
                      <td style={{padding:'8px 0',borderBottom:i<liveTasks.length-1?'1px solid var(--border)':'none'}}>
                        <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--blue-d)',color:'var(--blue)'}}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={panel}>
            <div style={ph()}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{color:'var(--red)',fontSize:14}}>⚠</span>
                <span style={{fontSize:13,fontWeight:600}}>Geciken İşler</span>
                <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:'var(--red-d)',color:'var(--red)',fontWeight:600}}>7</span>
              </div>
              <span style={{fontSize:11,color:'var(--t3)',cursor:'pointer'}}>Tümü →</span>
            </div>
            <div style={{padding:'0 16px'}}>
              {delays.map((d,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<delays.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{width:26,height:26,borderRadius:'50%',background:`${d.c}22`,color:d.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{d.av}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.task}</div>
                    <div style={{fontSize:10,color:'var(--t3)'}}>{d.name} · {d.role}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:d.c,fontFamily:'JetBrains Mono,monospace'}}>{d.hrs}</div>
                    <div style={{fontSize:9,fontWeight:600,color:d.c}}>{d.sev}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLA + Finans + Yaklaşan */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr',gap:12}}>

          {/* SLA */}
          <div style={panel}>
            <div style={ph()}>
              <span style={{fontSize:13,fontWeight:600}}>SLA Durumu</span>
            </div>
            <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
              {[
                {label:'Uyarı Seviyesi',count:4,c:'var(--amber)',bg:'var(--amber-d)'},
                {label:'Risk Seviyesi',count:2,c:'var(--red)',bg:'var(--red-d)'},
                {label:'Kritik Seviye',count:1,c:'var(--red)',bg:'var(--red-d)'},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:s.bg,borderRadius:7}}>
                  <span style={{fontSize:12,color:s.c,fontWeight:500}}>{s.label}</span>
                  <span style={{fontSize:16,fontWeight:700,color:s.c,fontFamily:'JetBrains Mono,monospace'}}>{s.count}</span>
                </div>
              ))}
              <div style={{padding:'8px 10px',background:'var(--green-d)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12,color:'var(--green)',fontWeight:500}}>Zamanında</span>
                <span style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>54</span>
              </div>
            </div>
          </div>

          {/* Finans */}
          <div style={panel}>
            <div style={ph()}>
              <span style={{fontSize:13,fontWeight:600}}>Finans Özeti · Bu Ay</span>
              <span style={{fontSize:11,color:'var(--t3)',cursor:'pointer'}}>Detay →</span>
            </div>
            <div style={{padding:'8px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {finans.map((f,i)=>(
                <div key={i} style={{padding:'10px 12px',background:'var(--s2)',borderRadius:8,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:15,fontWeight:700,color:f.color,fontFamily:'JetBrains Mono,monospace'}}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Yaklaşan */}
          <div style={panel}>
            <div style={ph()}>
              <span style={{fontSize:13,fontWeight:600}}>Yaklaşan Teslimler</span>
            </div>
            <div style={{padding:'0 16px'}}>
              {upcoming.map((u,i)=>(
                <div key={i} style={{padding:'8px 0',borderBottom:i<upcoming.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                    {u.urgent && <span style={{fontSize:8,color:'var(--red)'}}>⬤</span>}
                    <span style={{fontSize:12,fontWeight:500,flex:1}}>{u.task}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:10,color:'var(--t3)'}}>{u.client} · {u.assignee}</span>
                    <span style={{fontSize:10,fontWeight:600,color:u.urgent?'var(--red)':'var(--t2)',fontFamily:'JetBrains Mono,monospace'}}>{u.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
