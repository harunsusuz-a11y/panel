'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const ROLES = ['admin','manager','member']
const ROLE_LABELS: Record<string,string> = { admin:'Admin', manager:'Yönetici', member:'Üye' }
const ROLE_COLORS: Record<string,string> = { admin:'var(--gold)', manager:'var(--blue)', member:'var(--t2)' }
const DEPTS = ['Yönetim','Tasarım','İçerik','SEO','Sosyal Medya','Müşteri İlişkileri','Operasyon','Muhasebe','Freelancer']

const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }
const P: React.CSSProperties = { background:'var(--s1)', border:'1px solid var(--glass-border)', borderRadius:14, overflow:'hidden' }

export default function KullanicilarPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ full_name:'', role:'member', department:'', phone:'' })

  const load = useCallback(async () => {
    const sb = createClient()
    const { data } = await sb.from('profiles').select('*, users:id(email:id)').order('created_at')
    // profiles'dan al, email için auth.users join yok client'ta - sadece profiles
    const { data: profiles } = await sb.from('profiles').select('*').order('created_at')
    setUsers(profiles || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function select(u: any) {
    setSelected(u)
    setForm({ full_name: u.full_name||'', role: u.role||'member', department: u.department||'', phone: u.phone||'' })
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    const sb = createClient()
    const { error } = await sb.from('profiles').update({
      full_name: form.full_name,
      role: form.role,
      department: form.department,
      phone: form.phone,
    }).eq('id', selected.id)
    setSaving(false)
    if (error) { setToast('Hata: ' + error.message) }
    else { setToast('Kaydedildi!'); load(); setSelected({ ...selected, ...form }) }
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <>
      <style>{`
        .usr-wrap { flex:1; display:flex; overflow:hidden; }
        .usr-list { width:280px; border-right:1px solid var(--glass-border); display:flex; flex-direction:column; overflow:hidden; }
        .usr-detail { flex:1; overflow-y:auto; padding:20px; }
        @media(max-width:768px){
          .usr-wrap{flex-direction:column;}
          .usr-list{width:100%;border-right:none;max-height:50%;}
          .usr-detail{position:fixed;inset:0;z-index:200;background:var(--bg);padding:0;display:flex;flex-direction:column;}
          .usr-dh{height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid var(--glass-border);background:var(--s1);flex-shrink:0;}
          .usr-di{flex:1;overflow-y:auto;padding:16px;}
        }
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Kullanıcılar" subtitle={`${users.length} kişi`}/>
        <div className="usr-wrap">
          <div className="usr-list">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <div style={{padding:20,color:'var(--t3)',fontSize:12}}>Yükleniyor...</div> : users.map(u => (
                <div key={u.id} onClick={() => select(u)}
                  style={{padding:'12px 14px',borderBottom:'1px solid var(--glass-border)',cursor:'pointer',
                    background:selected?.id===u.id?'var(--gold-d)':'transparent',
                    borderLeft:selected?.id===u.id?'2px solid var(--gold)':'2px solid transparent'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:`${ROLE_COLORS[u.role]||'var(--s4)'}22`,color:ROLE_COLORS[u.role]||'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>
                      {(u.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.full_name||'İsimsiz'}</div>
                      <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{u.department||'—'}</div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:`${ROLE_COLORS[u.role]||'var(--t3)'}18`,color:ROLE_COLORS[u.role]||'var(--t3)',flexShrink:0}}>
                      {ROLE_LABELS[u.role]||u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="usr-detail">
              <div className="usr-dh">
                <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'var(--t2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Geri
                </button>
                <span style={{fontSize:14,fontWeight:700}}>{selected.full_name||'Kullanıcı'}</span>
              </div>
              <div className="usr-di" style={{padding:20}}>
                {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  {[
                    {l:'Ad Soyad',k:'full_name',type:'text'},
                    {l:'Telefon',k:'phone',type:'text'},
                  ].map(f=>(
                    <div key={f.k}>
                      <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>{f.l}</label>
                      <input value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Rol</label>
                    <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Departman</label>
                    <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="">Seçin</option>
                      {DEPTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={save} disabled={saving} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:'11px 20px',borderRadius:9,border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
                  {saving?'Kaydediliyor...':'Değişiklikleri Kaydet'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>
              Düzenlemek için kullanıcı seçin
            </div>
          )}
        </div>
      </div>
    </>
  )
}