'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { ArrowUpRight, ArrowDownRight, ArrowRight, TrendingUp, Wallet, FolderOpen, Clock, CheckCircle2 } from 'lucide-react'

/* ── Bar Chart ── */
function BarChart({ bars }: { bars: { label:string; v:number; hi?:boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 100); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
      {bars.map((b, i) => (
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,height:'100%',justifyContent:'flex-end'}}>
          <div style={{
            width:'100%',
            height: m ? `${Math.max((b.v/max)*66, b.v>0?3:0)}px` : '0',
            background: b.hi ? 'var(--accent)' : 'var(--surface-3)',
            borderRadius:'4px 4px 0 0',
            transition:`height .5s cubic-bezier(.22,1,.36,1) ${i*35}ms`,
          }}/>
          <span style={{fontSize:10,color:b.hi?'var(--accent)':'var(--text-faint)',fontWeight:b.hi?600:400,lineHeight:1}}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Donut ── */
function Donut({ segs }: { segs:{v:number;color:string;label:string}[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 160) }, [])
  const total = segs.reduce((s,x) => s+x.v, 0) || 1
  const sz=96, r=(sz-12)/2, circ=2*Math.PI*r
  let off=0
  return (
    <div style={{display:'flex',alignItems:'center',gap:18}}>
      <svg width={sz} height={sz} style={{transform:'rotate(-90deg)',flexShrink:0}}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={9}/>
        {segs.map((s,i) => {
          const pct=s.v/total, dash=m?pct*circ:0
          const o=off; off+=pct*circ
          return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.color} strokeWidth={9}
            strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-o}
            style={{transition:`stroke-dasharray .7s ease ${i*60}ms`}}/>
        })}
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {segs.map((s,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:2,background:s.color,flexShrink:0}}/>
            <span style={{fontSize:12.5,color:'var(--text-dim)',flex:1}}>{s.label}</span>
            <span style={{fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:'JetBrains Mono,monospace',minWidth:20,textAlign:'right'}}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({ label, value, sub, color, trend, Icon }: {
  label:string; value:string; sub?:string; color:string; trend?:{v:string;up:boolean}; Icon:any
}) {
  return (
    <div className="stat-card slide-up">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={17} color={color} strokeWidth={1.8}/>
        </div>
        {trend && (
          <div className="stat-trend" style={{color:trend.up?'var(--green)':'var(--red)'}}>
            {trend.up ? <ArrowUpRight size={13} strokeWidth={2}/> : <ArrowDownRight size={13} strokeWidth={2}/>}
            {trend.v}
          </div>
        )}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

/* ── Main ── */
export default function DashboardPage() {
  const [data, setData] = useState<any>({tasks:[],projects:[],clients:[],transactions:[],approvals:[]})
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [userName, setUserName] = useState('')

  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id) }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}}) => {
      if (!user) return
      sb.from('profiles').select('full_name').eq('id',user.id).single().then(({data})=>setUserName(data?.full_name?.split(' ')[0]||''))
    })
    Promise.all([
      sb.from('tasks').select('id,title,status,priority,due_date'),
      sb.from('projects').select('id,name,status,progress,deadline,client_id'),
      sb.from('clients').select('id,name,status'),
      sb.from('transactions').select('type,amount,date'),
      sb.from('approvals').select('id,status'),
    ]).then(([t,p,c,tr,ap]) => {
      setData({tasks:t.data||[],projects:p.data||[],clients:c.data||[],transactions:tr.data||[],approvals:ap.data||[]})
      setLoading(false)
    })
  }, [])

  const {tasks,projects,clients,transactions,approvals} = data
  const income  = transactions.filter((t:any)=>t.type==='income').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const expense = transactions.filter((t:any)=>t.type==='expense').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const net = income-expense
  const activeProj = projects.filter((p:any)=>p.status==='active')
  const overdue    = tasks.filter((t:any)=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<now)
  const done       = tasks.filter((t:any)=>t.status==='done')
  const pending    = approvals.filter((a:any)=>a.status==='pending')

  const MONTHS=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm=now.getMonth()
  const bars=Array.from({length:6},(_,i)=>{
    const m=(cm-5+i+12)%12
    const v=transactions.filter((t:any)=>t.type==='income'&&t.date&&new Date(t.date).getMonth()===m).reduce((s:number,t:any)=>s+Number(t.amount),0)
    return {label:MONTHS[m],v:Math.round(v/1000),hi:i===5}
  })

  const taskSegs=[
    {v:tasks.filter((t:any)=>t.status==='todo').length,        color:'var(--surface-3)', label:'Bekliyor'},
    {v:tasks.filter((t:any)=>t.status==='in_progress').length, color:'var(--blue)',       label:'Devam'},
    {v:tasks.filter((t:any)=>t.status==='review').length,      color:'var(--amber)',      label:'İnceleme'},
    {v:done.length,                                             color:'var(--green)',      label:'Tamamlandı'},
  ]

  const fmt=(v:number)=>v>=1000?`₺${Math.round(v/1000)}K`:`₺${v}`
  const PRI_C:Record<string,string>={critical:'var(--red)',high:'var(--amber)',normal:'var(--blue)',low:'var(--text-faint)'}

  const overdueTop=[...overdue].sort((a:any,b:any)=>{
    const o={critical:0,high:1,normal:2,low:3}
    return (o[a.priority as keyof typeof o]||2)-(o[b.priority as keyof typeof o]||2)
  }).slice(0,6)

  const weekEnd=new Date(now.getTime()+7*86400000)
  const weekTasks=tasks.filter((t:any)=>t.due_date&&t.status!=='done'&&new Date(t.due_date)>=now&&new Date(t.due_date)<=weekEnd)
    .sort((a:any,b:any)=>String(a.due_date).localeCompare(String(b.due_date))).slice(0,5)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar
        title={`Merhaba${userName?', '+userName:''}`}
        subtitle={now.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        action={
          <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'5px 12px'}}>
            <div className="pulse" style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',flexShrink:0}}/>
            <span style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',color:'var(--green)',fontWeight:500}}>
              {now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </span>
          </div>
        }
      />

      <div style={{flex:1,overflowY:'auto',padding:'20px 20px 80px'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'var(--text-faint)',fontSize:14}}>Yükleniyor...</div>
        ) : (<>

          {/* ── KPI ── */}
          <div className="db-stat-grid">
            <StatCard label="Toplam Gelir"   value={fmt(income)}              sub={`Gider: ${fmt(expense)}`}              color="var(--green)"  Icon={TrendingUp}    trend={{v:'+12%',up:true}}/>
            <StatCard label="Net Kar"         value={fmt(net)}                 sub={net>=0?'Kârlı dönem':'Zarar'}          color={net>=0?'var(--accent)':'var(--red)'} Icon={Wallet}/>
            <StatCard label="Aktif Proje"     value={String(activeProj.length)} sub={`${clients.filter((c:any)=>c.status==='active').length} müşteri`} color="var(--blue)"   Icon={FolderOpen}/>
            <StatCard label="Geciken Görev"   value={String(overdue.length)}   sub={overdue.length>0?'Kontrol gerekli':'Temiz'} color={overdue.length>0?'var(--red)':'var(--green)'} Icon={Clock}/>
            <StatCard label="Onay Bekliyor"   value={String(pending.length)}   sub={`${tasks.length} toplam görev`}        color="var(--amber)"  Icon={CheckCircle2}/>
          </div>

          {/* ── Orta ── */}
          <div className="db-mid">
            {/* Gelir */}
            <div className="card fade-in">
              <div className="card-h">
                <span className="card-title">Aylık Gelir Trendi</span>
                <span className="card-meta">Son 6 ay</span>
              </div>
              <div style={{padding:'18px 20px 16px'}}>
                <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:16}}>
                  <span style={{fontSize:28,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--text)',letterSpacing:'-1.5px',lineHeight:1}}>{fmt(income)}</span>
                  <span style={{display:'flex',alignItems:'center',gap:3,fontSize:12,color:'var(--green)',fontWeight:600}}>
                    <ArrowUpRight size={13} strokeWidth={2.5}/>12% artış
                  </span>
                </div>
                <BarChart bars={bars}/>
                <div style={{display:'flex',gap:16,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                  {[{l:'Gelir',v:income,c:'var(--green)'},{l:'Gider',v:expense,c:'var(--red)'},{l:'Net',v:net,c:'var(--accent)'}].map(s=>(
                    <div key={s.l}>
                      <div style={{fontSize:11,color:'var(--text-faint)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>{s.l}</div>
                      <div style={{fontSize:13.5,fontWeight:600,color:s.c,fontFamily:'JetBrains Mono,monospace'}}>{fmt(s.v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Görev Dağılımı */}
            <div className="card fade-in">
              <div className="card-h">
                <span className="card-title">Görev Durumu</span>
                <span className="card-meta">{tasks.length} toplam</span>
              </div>
              <div style={{padding:'18px 20px'}}>
                <Donut segs={taskSegs}/>
                <div style={{display:'flex',gap:10,marginTop:16}}>
                  <div style={{flex:1,background:'var(--green-soft)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--green)',lineHeight:1}}>{done.length}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Tamamlandı</div>
                  </div>
                  <div style={{flex:1,background:'var(--red-soft)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--red)',lineHeight:1}}>{overdue.length}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Geciken</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Alt ── */}
          <div className="db-bot">
            {/* Projeler */}
            <div className="card fade-in">
              <div className="card-h">
                <span className="card-title">Aktif Projeler</span>
                <a href="/dashboard/projeler" style={{display:'flex',alignItems:'center',gap:3,fontSize:12,color:'var(--text-faint)',transition:'color .15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='var(--accent)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='var(--text-faint)')}>
                  Tümü <ArrowRight size={12}/>
                </a>
              </div>
              {activeProj.length===0
                ? <div style={{padding:'28px',textAlign:'center',color:'var(--text-faint)',fontSize:13}}>Aktif proje yok</div>
                : activeProj.slice(0,5).map((p:any) => (
                  <div key={p.id} className="tr">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:6}}>{p.name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="pb-track" style={{flex:1}}>
                          <div className="pb-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--accent)':'var(--red)'}}/>
                        </div>
                        <span style={{fontSize:12,color:'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{p.progress||0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Gecikmeler */}
            <div className="card fade-in">
              <div className="card-h">
                <span className="card-title">Gecikmeler</span>
                {overdue.length>0 && <span className="badge badge-red">{overdue.length}</span>}
              </div>
              {overdueTop.length===0
                ? <div style={{padding:'28px',textAlign:'center',color:'var(--green)',fontSize:13,fontWeight:500}}>✓ Geciken görev yok</div>
                : overdueTop.map((t:any) => {
                  const days=Math.floor((now.getTime()-new Date(t.due_date).getTime())/86400000)
                  const c=PRI_C[t.priority]||'var(--text-faint)'
                  return (
                    <div key={t.id} className="tr">
                      <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title||'Görev'}</div>
                        <div style={{fontSize:11.5,color:'var(--text-faint)',marginTop:2}}>{t.due_date}</div>
                      </div>
                      <span style={{fontSize:12,fontWeight:500,color:c,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>+{days}g</span>
                    </div>
                  )
                })}
            </div>

            {/* Bu Hafta */}
            <div className="card fade-in">
              <div className="card-h">
                <span className="card-title">Bu Hafta Teslim</span>
                <span className="card-meta">{weekTasks.length} görev</span>
              </div>
              {weekTasks.length===0
                ? <div style={{padding:'28px',textAlign:'center',color:'var(--text-faint)',fontSize:13}}>Bu hafta teslim yok</div>
                : weekTasks.map((t:any) => {
                  const diff=Math.ceil((new Date(t.due_date).getTime()-now.getTime())/86400000)
                  const urgent=diff<=1
                  return (
                    <div key={t.id} className="tr">
                      <div style={{width:6,height:6,borderRadius:'50%',background:urgent?'var(--red)':'var(--border-strong)',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title||'Görev'}</div>
                        <div style={{fontSize:11.5,color:'var(--text-faint)',marginTop:2}}>
                          {diff===0?'Bugün':diff===1?'Yarın':`${diff} gün sonra`}
                        </div>
                      </div>
                      <span style={{fontSize:12,fontWeight:500,color:urgent?'var(--red)':'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                        {String(t.due_date).slice(5,10)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}