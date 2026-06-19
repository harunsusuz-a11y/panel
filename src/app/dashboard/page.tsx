'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/TopBar'
import StatCard from '@/components/StatCard'

const delays = [
  { av: 'EK', name: 'Emre K.', role: 'İçerik', task: 'Haziran sosyal medya postları', hrs: '+38 sa', pct: 100, c: 'var(--red)', sev: 'Kritik' },
  { av: 'SA', name: 'Selin A.', role: 'Tasarım', task: 'Logo 2. tur revizyonu', hrs: '+26 sa', pct: 75, c: 'var(--red)', sev: 'Kritik' },
  { av: 'ZY', name: 'Zeynep Y.', role: 'Müşteri İlişkileri', task: 'Brifing onayı', hrs: '+18 sa', pct: 55, c: 'var(--amber)', sev: 'Yüksek' },
  { av: 'CK', name: 'Can K.', role: 'Tasarım', task: 'Reklam görseli', hrs: '+8 sa', pct: 25, c: 'var(--blue)', sev: 'Normal' },
]

const liveTasks = [
  { user: 'Selin A.', task: 'Logo tasarımı', client: 'Beta Marka', start: '09:00', est: '12:00', status: 'Devam', color: 'var(--blue)' },
  { user: 'Emre K.', task: 'Blog yazısı', client: 'Alfa Ltd', start: '10:30', est: '13:00', status: 'Devam', color: 'var(--blue)' },
  { user: 'Mert Y.', task: 'Teklif hazırlığı', client: 'Gama AŞ', start: '11:00', est: '12:30', status: 'İnceleme', color: 'var(--amber)' },
]

const upcoming = [
  { task: 'Sosyal medya postları', client: 'Delta Ltd', assignee: 'Emre K.', date: 'Bugün 17:00', urgent: true },
  { task: 'Web site güncelleme', client: 'Alfa Dijital', assignee: 'Selin A.', date: 'Bugün 18:00', urgent: true },
  { task: 'SEO raporu', client: 'Epsilon Ltd', assignee: 'Mert Y.', date: 'Yarın 10:00', urgent: false },
  { task: 'Reklam görselleri', client: 'Beta Marka', assignee: 'Selin A.', date: 'Yarın 14:00', urgent: false },
]

const monthlyRevenue = [148, 162, 175, 190, 185, 210, 225, 198, 230, 218, 242, 248]
const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const teamPerf = [
  { name: 'Selin A.', role: 'Tasarım', score: 94, tasks: 18, c: 'var(--green)' },
  { name: 'Emre K.', role: 'İçerik', score: 87, tasks: 24, c: 'var(--green)' },
  { name: 'Zeynep Y.', role: 'Müşteri', score: 76, tasks: 12, c: 'var(--gold)' },
  { name: 'Can K.', role: 'Tasarım', score: 68, tasks: 15, c: 'var(--amber)' },
  { name: 'Mert Y.', role: 'Proje', score: 82, tasks: 9, c: 'var(--green)' },
]

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])
  const max = Math.max(...data)
  const h = 80
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: h + 24, padding: '0 2px' }}>
      {data.map((v, i) => {
        const isLast = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: mounted ? `${(v / max) * h}px` : '0px',
              background: isLast ? 'linear-gradient(180deg,#f0b429,#e8941a)' : 'linear-gradient(180deg,rgba(107,140,255,0.6),rgba(107,140,255,0.15))',
              borderRadius: '3px 3px 0 0',
              transition: `height 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 35}ms`,
              border: isLast ? '1px solid rgba(240,180,41,0.4)' : '1px solid rgba(107,140,255,0.2)',
            }}/>
            <div style={{ fontSize: 7.5, color: isLast ? 'var(--gold)' : 'var(--t3)', fontWeight: isLast ? 700 : 400 }}>{labels[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

function Ring({ value, color, size = 44 }: { value: number; color: string; size?: number }) {
  const r = (size - 7) / 2
  const circ = 2 * Math.PI * r
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 200) }, [])
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--s4)" strokeWidth="4.5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (mounted ? value/100 : 0)*circ}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) 0.3s' }}
      />
    </svg>
  )
}

const P: React.CSSProperties = { background: 'var(--s1)', border: '1px solid var(--glass-border)', borderRadius: 14, overflow: 'hidden' }

function PH({ title, badge, badgeColor = 'var(--gold)', action }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: `${badgeColor}18`, color: badgeColor }}>{badge}</span>}
      </div>
      {action && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{action}</span>}
    </div>
  )
}

export default function DashboardPage() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        .db-stats { display: grid; grid-template-columns: repeat(7,1fr); gap: 10px; }
        .db-row2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }
        .db-row3 { display: grid; grid-template-columns: 1fr 1.1fr 0.9fr; gap: 14px; }
        .db-col3 { display: flex; flex-direction: column; gap: 14px; }
        .live-table { display: grid; grid-template-columns: 1fr 1fr 65px 65px 80px; align-items: center; gap: 10px; }
        @media (max-width: 768px) {
          .db-stats { grid-template-columns: repeat(2,1fr); gap: 8px; }
          .db-row2 { grid-template-columns: 1fr; }
          .db-row3 { grid-template-columns: 1fr; }
          .db-col3 { gap: 10px; }
          .live-table { grid-template-columns: 1fr auto; }
          .live-col-hide { display: none; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
        <TopBar title="Dashboard" subtitle="Genel Bakış" action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--glass-border)' }}>
            <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }}/>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--green)', fontWeight: 600 }}>{time}</span>
          </div>
        }/>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 80px' }}>

          {/* KPI */}
          <div className="db-stats" style={{ marginBottom: 12 }}>
            <StatCard label="Aktif Müşteri" value="12" trend={18} accent="var(--gold)" icon="🏢" sparkline={[8,9,9,10,11,11,12]}/>
            <StatCard label="Aktif Proje" value="18" trend={12} accent="var(--blue)" icon="📁" sparkline={[12,14,13,15,16,17,18]}/>
            <StatCard label="Açık Görev" value="64" chip="bu hafta" accent="var(--purple)" icon="📋"/>
            <StatCard label="Tamamlanan" value="47" trend={8} accent="var(--green)" icon="✅"/>
            <StatCard label="Geciken" value="7" chip="⚠ dikkat" accent="var(--red)" icon="⏰"/>
            <StatCard label="Kritik" value="3" chip="acil" accent="var(--red)" icon="🚨"/>
            <StatCard label="Onay Bekl." value="5" chip="acil" accent="var(--amber)" icon="⏳"/>
          </div>

          {/* Canlı + Grafik */}
          <div className="db-row2" style={{ marginBottom: 12 }}>
            <div style={P}>
              <PH title="Canlı Operasyon" badge={`${liveTasks.length} aktif`} badgeColor="var(--green)"/>
              <div style={{ padding: '2px 14px' }}>
                {liveTasks.map((t, i) => (
                  <div key={i} className="live-table" style={{ padding: '10px 0', borderBottom: i < liveTasks.length-1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t.user}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{t.task}</div>
                    </div>
                    <div className="live-col-hide" style={{ fontSize: 11, color: 'var(--t2)' }}>{t.client}</div>
                    <div className="live-col-hide" style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--t3)' }}>{t.start}</div>
                    <div className="live-col-hide" style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--t3)' }}>{t.est}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${t.color}18`, color: t.color, whiteSpace: 'nowrap' }}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={P}>
              <PH title="Aylık Gelir" badge="2025" action="Detay →"/>
              <div style={{ padding: '12px 14px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--gold)', letterSpacing: '-0.5px' }}>₺248K</span>
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>↑ 12%</span>
                </div>
                <BarChart data={monthlyRevenue} labels={monthLabels}/>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="db-row3">
            <div style={P}>
              <PH title="Geciken İşler" badge="7" badgeColor="var(--red)" action="Tümü →"/>
              <div style={{ padding: '2px 14px' }}>
                {delays.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < delays.length-1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${d.c}18`, color: d.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, border: `1px solid ${d.c}30` }}>{d.av}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.task}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{d.name} · {d.role}</div>
                      <div style={{ marginTop: 4, height: 3, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                        <div className="bar-fill" style={{ height: '100%', '--w': `${d.pct}%`, width: `${d.pct}%`, background: d.c, borderRadius: 2 } as React.CSSProperties}/>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: d.c, fontFamily: 'JetBrains Mono' }}>{d.hrs}</div>
                      <div style={{ fontSize: 9, color: d.c, fontWeight: 600 }}>{d.sev}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={P}>
              <PH title="Ekip Performansı" action="Detay →"/>
              <div style={{ padding: '6px 14px' }}>
                {teamPerf.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < teamPerf.length-1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <Ring value={m.score} color={m.c} size={40}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono', color: m.c }}>{m.score}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{m.role} · {m.tasks} görev</div>
                      <div style={{ marginTop: 4, height: 2.5, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                        <div className="bar-fill" style={{ height: '100%', '--w': `${m.score}%`, width: `${m.score}%`, background: m.c, borderRadius: 2 } as React.CSSProperties}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="db-col3">
              <div style={P}>
                <PH title="SLA Durumu"/>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { label: 'Zamanında', count: 54, c: 'var(--green)', bg: 'var(--green-d)' },
                    { label: 'Uyarı', count: 4, c: 'var(--amber)', bg: 'var(--amber-d)' },
                    { label: 'Risk', count: 2, c: 'var(--red)', bg: 'var(--red-d)' },
                    { label: 'Kritik', count: 1, c: 'var(--red)', bg: 'var(--red-d)' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: s.bg, borderRadius: 7 }}>
                      <span style={{ fontSize: 11.5, color: s.c, fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: s.c, fontFamily: 'JetBrains Mono' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={P}>
                <PH title="Yaklaşan Teslimler"/>
                <div style={{ padding: '2px 12px' }}>
                  {upcoming.map((u, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < upcoming.length-1 ? '1px solid var(--glass-border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: u.urgent ? 'var(--red)' : 'var(--t3)', boxShadow: u.urgent ? '0 0 5px var(--red)' : 'none', flexShrink: 0 }}/>
                        <span style={{ fontSize: 11.5, fontWeight: 500, flex: 1 }}>{u.task}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 10 }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{u.client}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: u.urgent ? 'var(--red)' : 'var(--t2)', fontFamily: 'JetBrains Mono' }}>{u.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}