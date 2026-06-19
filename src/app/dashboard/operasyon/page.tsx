import TopBar from '@/components/TopBar'
import StatCard from '@/components/StatCard'

export default function OperasyonPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Operasyon Merkezi"/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          <StatCard label="Bugün Teslim" value="4" chip="acil" accent="var(--red)" icon="🔥"/>
          <StatCard label="Yarın Teslim" value="6" chip="planlı" accent="var(--amber)" icon="📋"/>
          <StatCard label="Geciken" value="7" chip="⚠" accent="var(--red)" icon="⏰"/>
          <StatCard label="SLA İhlali" value="3" chip="kritik" accent="var(--red)" icon="🚨"/>
          <StatCard label="Tamamlanan" value="47" chip="bu ay" accent="var(--green)" icon="✅"/>
        </div>
        <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:10,padding:'16px'}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>İş Yükü Analizi</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {name:'Selin A.',tasks:8,cap:10,dept:'Tasarım'},
              {name:'Emre K.',tasks:9,cap:10,dept:'İçerik'},
              {name:'Zeynep Y.',tasks:4,cap:8,dept:'CRM'},
              {name:'Can K.',tasks:6,cap:8,dept:'Tasarım'},
              {name:'Mert Y.',tasks:7,cap:10,dept:'Yönetim'},
            ].map(p=>(
              <div key={p.name} style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:120,fontSize:12,fontWeight:500}}>{p.name}</div>
                <div style={{fontSize:10,color:'var(--t3)',width:60}}>{p.dept}</div>
                <div style={{flex:1,height:6,background:'var(--s4)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(p.tasks/p.cap)*100}%`,background:p.tasks/p.cap>0.85?'var(--red)':p.tasks/p.cap>0.6?'var(--amber)':'var(--green)',borderRadius:3}}/>
                </div>
                <div style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'var(--t2)',width:40,textAlign:'right'}}>{p.tasks}/{p.cap}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
