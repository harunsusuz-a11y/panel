import Sidebar from '@/components/Sidebar'

// Auth kontrolü middleware'de yapılıyor
// Layout sadece UI yapısını oluşturur
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // user bilgisini client side alacağız
  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      <Sidebar user={null} />
      <main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        {children}
      </main>
    </div>
  )
}
