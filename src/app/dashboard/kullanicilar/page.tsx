'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const RL={admin:'Admin',manager:'Yönetici',member:'Üye'}
const DEPTS=['Yönetim','Tasarım','İçerik','SEO','Sosyal Medya','Müşteri İlişkileri','Operasyon','Muhasebe']

export default function KullanicilarPage() {
  const [users,setUsers]=useState<any[]>([])
  const [sel,setSel]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [toast,setToast]=useState('')
  const [form,setForm]=useState({full_name:'',role:'member',department:'',phone:''})

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3500)}
  const load=useCallback(async()=>{const{data}=await createClient().from('profiles').select('*').order('created_at');setUsers(data||[]);setLoading(false)},[])
  useEffect(()=>{load()},[load])
  function select(u:any){setSel(u);setForm({full_name:u.full_name||'',role:u.role||'member',department:u.department||'',phone:u.phone||''})}
  async function save(){if(!sel)return;setSaving(true);const{error}=await createClient().from('profiles').update(form).eq('id',sel.id);setSaving(false);if(error)showToast('Hata: '+error.message);else{showToast('Kaydedildi!');load();setSel({...sel,...form})}}

  return (
    <>
      <style>{`.ul-wrap{flex:1;display:flex;overflow:hidden}.ul-l{width:260px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}.ul-d{flex:1;overflow-y:auto;padding:20px}@media(max-width:768px){.ul-wrap{flex-direction:column}.ul-l{width:100%;border-right:none;max-height:50%}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Kullanıcılar" subtitle={users.length+' kişi'}/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div className="ul-wrap">
          <div className="ul-l">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading?<p style={{padding:20,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>:users.map(u=>(
                <div key={u.id} onClick={()=>select(u)} style={{padding:'11px 14px',borderBottom:'1px solid var(--bdr)',cursor:'pointer',background:sel?.id===u.id?'var(--ac2)':'transparent',borderLeft:`2.5px solid ${sel?.id===u.id?'var(--ac)':'transparent'}`,transition:'background .1s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10.5,fontWeight:800,flexShrink:0}}>
                      {(u.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:sel?.id===u.id?'var(--ac)':'var(--tx)'}}>{u.full_name||'İsimsiz'}</p>
                      <p style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{u.department||'—'}</p>
                    </div>
                    <span className={`badge ${u.role==='admin'?'badge-ac':u.role==='manager'?'badge-blue':'badge-muted'}`}>{(RL as any)[u.role]||u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {sel?(
            <div className="ul-d">
              <div style={{display:'flex',gap:12,marginBottom:16}}>
                <button onClick={()=>setSel(null)} className="btn-ghost" style={{fontSize:12}}>← Geri</button>
                <span style={{fontSize:14,fontWeight:700,flex:1}}>{sel.full_name||'Kullanıcı'}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div><label className="label">Ad Soyad</label><input value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} className="inp"/></div>
                <div><label className="label">Telefon</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="inp"/></div>
                <div><label className="label">Rol</label>
                  <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} className="inp">
                    <option value="admin">Admin</option><option value="manager">Yönetici</option><option value="member">Üye</option>
                  </select>
                </div>
                <div><label className="label">Departman</label>
                  <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>{DEPTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn" onClick={save} disabled={saving} style={{padding:'9px 20px'}}>{saving?'Kaydediliyor...':'Kaydet'}</button>
            </div>
          ):(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)',fontSize:13}}>Kullanıcı seçin</div>
          )}
        </div>
      </div>
    </>
  )
}
