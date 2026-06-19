import TopBar from '@/components/TopBar'
export default function Page() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="gecikmeler"/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>
        Bu modül geliştiriliyor...
      </div>
    </div>
  )
}
