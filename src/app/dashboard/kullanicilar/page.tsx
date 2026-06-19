'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'

const ROLES = ['CEO','Operasyon Müdürü','Tasarımcı','İçerik Uzmanı','Müşteri Temsilcisi','Muhasebe','Finans','Freelancer']

const USERS = [
  {id:1,name:'Mert Yılmaz',email:'mert@ajans.com',role:'CEO',dept:'Yönetim',status:'active',lastLogin:'Bugün 09:15'},
  {id:2,name:'Selin Arslan',email:'selin@ajans.com',role:'Tasarımcı',dept:'Tasarım',status:'active',lastLogin:'Bugün 10:30'},
  {id:3,name:'Emre Kaya',email:'emre@ajans.com',role:'İçerik Uzmanı',dept:'İçerik',status:'active',lastLogin:'Bugün 08:45'},
  {id:4,name:'Zeynep Yıldız',email:'zeynep@ajans.com',role:'Müşteri Temsilcisi',dept:'CRM',status:'active',lastLogin:'Dün 17:00'},
  {id:5,name:'Can Kılıç',email:'can@ajans.com',role:'Tasarımcı',dept:'Tasarım',status:'active',lastLogin:'Bugün 11:00'},
]

export default function KullanicilarPage() {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({name:'',email:'',password:'',role:'Tasarımcı',dept:''})
  const [users, setUsers] = useState(USERS)
  const [msg, setMsg] = useState('')

  function addUser() {
    if (!form.name || !form.email || !form.password) return
    setUsers(u=>[...u,{id:u.length+1,...form,status:'active',lastLogin:'Henüz giriş yok'}])
    setMsg(`✅ ${form.name} oluşturuldu. Supabase'e kayıt için Auth > Users menüsünden manuel ekleyin veya API entegrasyonu kullanın.`)
    setModal(false)
    setForm({name:'',email:'',password:'',role:'Tasarımcı',dept:''})
  }

  const inp: React.CSSProperties = {width:'100%',background:'var(--s2)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 10px',fontSize:12,color:'var(--text)',outline:'none',fontFamily:'Inter,sans-serif'}

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Kullanıcılar & Roller" action={
        <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:12,padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>
          + Kullanıcı Ekle
        </button>
      }/>

      {msg && <div style={{margin:'12px 20px',padding:'10px 14px',background:'var(--green-d)',border:'1px solid var(--green)',borderRadius:7,fontSize:12,color:'var(--green)'}}>{msg}</div>}

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:'var(--s1)',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)'}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              {['Kullanıcı','E-posta','Rol','Departman','Durum','Son Giriş','İşlemler'].map(h=>(
                <th key={h} style={{padding:'10px 14px',fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em',textAlign:'left'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} style={{borderBottom:i<users.length-1?'1px solid var(--border)':'none'}}>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'var(--gold-d)',color:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>
                      {u.name.split(' ').map(w=>w[0]).join('')}
                    </div>
                    <span style={{fontSize:13,fontWeight:500}}>{u.name}</span>
                  </div>
                </td>
                <td style={{padding:'12px 14px',fontSize:12,color:'var(--t2)'}}>{u.email}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--blue-d)',color:'var(--blue)'}}>{u.role}</span>
                </td>
                <td style={{padding:'12px 14px',fontSize:12,color:'var(--t2)'}}>{u.dept}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--green-d)',color:'var(--green)'}}>Aktif</span>
                </td>
                <td style={{padding:'12px 14px',fontSize:11,color:'var(--t3)',fontFamily:'JetBrains Mono,monospace'}}>{u.lastLogin}</td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button style={{fontSize:10,padding:'3px 8px',background:'var(--s3)',border:'1px solid var(--border)',borderRadius:5,color:'var(--t2)',cursor:'pointer'}}>Düzenle</button>
                    <button style={{fontSize:10,padding:'3px 8px',background:'var(--red-d)',border:'1px solid var(--red)',borderRadius:5,color:'var(--red)',cursor:'pointer'}}>Pasif</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:12,padding:'28px',width:420}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <span style={{fontSize:15,fontWeight:600}}>Yeni Kullanıcı</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Ad Soyad</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ahmet Yılmaz" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>E-posta</label>
                <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ahmet@ajans.com" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Şifre</label>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="En az 8 karakter" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Rol</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Departman</label>
                <input value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))} placeholder="Tasarım" style={inp}/>
              </div>
              <button onClick={addUser} style={{background:'var(--gold)',color:'#000',fontWeight:600,fontSize:13,padding:'10px',borderRadius:7,border:'none',cursor:'pointer',marginTop:4}}>
                Kullanıcı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
