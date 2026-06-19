export default function StatCard({ label, value, chip, accent, icon }: any) {
  return (
    <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:10,padding:'16px 18px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:accent,borderRadius:'10px 10px 0 0'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:8,background:`${accent}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{icon}</div>
        {chip && <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${accent}22`,color:accent}}>{chip}</span>}
      </div>
      <div style={{fontSize:26,fontWeight:700,fontFamily:'JetBrains Mono,monospace',letterSpacing:'-0.5px'}}>{value}</div>
      <div style={{fontSize:10.5,color:'var(--t3)',marginTop:3,fontWeight:500,letterSpacing:'0.04em',textTransform:'uppercase'}}>{label}</div>
    </div>
  )
}
