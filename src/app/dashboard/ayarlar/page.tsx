import TopBar from '@/components/TopBar'
export default function AyarlarPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Sistem Ayarları"/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
        {[
          {title:'Şirket Bilgileri',desc:'Şirket adı, logo, iletişim bilgileri'},
          {title:'Roller & Yetkiler',desc:'Dinamik rol ve yetki yönetimi'},
          {title:'SLA Tanımları',desc:'İş tiplerine göre SLA süreleri'},
          {title:'Bildirim Ayarları',desc:'Mail, SMS, WhatsApp tercihleri'},
          {title:'Audit Log',desc:'Tüm sistem hareketleri'},
        ].map(s=>(
          <div key={s.title} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:8,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{s.title}</div>
              <div style={{fontSize:11,color:'var(--t3)'}}>{s.desc}</div>
            </div>
            <span style={{color:'var(--t3)',fontSize:16}}>→</span>
          </div>
        ))}
      </div>
    </div>
  )
}
