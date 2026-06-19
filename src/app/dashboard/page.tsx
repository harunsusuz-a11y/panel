import { createClient } from '@/lib/supabase/server'

const stats = [
  { label: 'Aktif Müşteri', value: '12', chip: '↑ +2 bu ay', accent: 'var(--gold)', iconBg: 'rgba(233,168,37,0.12)', chipBg: 'rgba(233,168,37,0.12)', chipC: 'var(--gold)' },
  { label: 'Devam Eden Proje', value: '8', chip: '8 aktif', accent: 'var(--blue)', iconBg: 'rgba(91,124,246,0.1)', chipBg: 'rgba(91,124,246,0.1)', chipC: 'var(--blue)' },
  { label: 'Geciken Görev', value: '7', chip: '⚠ Kritik', accent: 'var(--red)', iconBg: 'rgba(240,68,68,0.1)', chipBg: 'rgba(240,68,68,0.1)', chipC: 'var(--red)' },
  { label: 'Onay Bekleyen', value: '3', chip: 'Acil', accent: 'var(--amber)', iconBg: 'rgba(245,158,11,0.1)', chipBg: 'rgba(245,158,11,0.1)', chipC: 'var(--amber)' },
]

const delays = [
  { initials: 'EK', name: 'Emre K.', role: 'İçerik', task: 'Delta Haziran postları', hours: '+38 sa', pct: 100, color: 'var(--red)', sev: 'Kritik' },
  { initials: 'SA', name: 'Selin A.', role: 'Tasarım', task: 'Beta logo 2. tur', hours: '+26 sa', pct: 75, color: 'var(--red)', sev: 'Kritik' },
  { initials: 'ZY', name: 'Zeynep Y.', role: 'Müşteri İlişkileri', task: 'Alfa brifing onayı', hours: '+18 sa', pct: 55, color: 'var(--amber)', sev: 'Yüksek' },
  { initials: 'EK', name: 'Emre K.', role: 'İçerik', task: 'Gama blog yazısı #2', hours: '+12 sa', pct: 40, color: 'var(--amber)', sev: 'Yüksek' },
  { initials: 'SA', name: 'Selin A.', role: 'Tasarım', task: 'Epsilon reklam görseli', hours: '+6 sa', pct: 22, color: 'var(--blue)', sev: 'Normal' },
]

const tasks = [
  { text: 'Alfa Dijital brifing', done: true, tag: null, time: '09:00' },
  { text: 'Gama teklif revizyonu gönder', done: false, tag: null },
  { text: 'Delta sosyal medya içerikleri', done: false, tag: { label: 'Gecikti', color: 'var(--red)', bg: 'rgba(240,68,68,0.1)' } },
  { text: 'Beta logo sunum dosyası', done: false, tag: { label: 'Bugün', color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)' } },
  { text: 'Epsilon fatura kesimi', done: false, tag: { label: 'Gecikti', color: 'var(--red)', bg: 'rgba(240,68,68,0.1)' }, urgent: true },
  { text: 'Onay bekleyen içerikleri incele', done: false, tag: { label: '14:00', color: 'var(--t2)', bg: 'var(--s3)' } },
  { text: 'Ekip toplantısı notları', done: true, tag: null, time: '10:30' },
]

const projects = [
  { name: 'Web Yenileme', client: 'Alfa Dijital', pct: 72, color: 'var(--green)' },
  { name: 'Sosyal Medya Yönetimi', client: 'Delta Ltd', pct: 45, color: 'var(--gold)' },
  { name: 'Logo & Kurumsal Kimlik', client: 'Beta Marka', pct: 90, color: 'var(--amber)' },
  { name: 'SEO Paketi', client: 'Gama AŞ', pct: 0, color: 'var(--blue)' },
  { name: 'Reklam Yönetimi', client: 'Epsilon Ltd', pct: 30, color: 'var(--red)' },
]

const activities = [
  { name: 'Selin A.', action: 'Beta logo taslağı yükledi', time: '14 dk önce', dot: 'var(--green)' },
  { name: 'Mert Yılmaz', action: 'Gama teklifini güncelledi', time: '1 sa önce', dot: 'var(--blue)' },
  { name: 'Emre K.', action: 'Delta içerikleri onaya gönderdi', time: '2 sa önce', dot: 'var(--amber)' },
  { name: 'Sistem', action: 'Epsilon fatura gecikme uyarısı', time: 'Dün 18:00', dot: 'var(--red)' },
  { name: 'Alfa Dijital', action: 'teklifi onayladı', time: 'Dün 11:30', dot: 'var(--green)' },
]

const metrics = [
  { label: 'Tamamlanan Görev', value: '47 / 60', pct: 78, color: 'var(--green)' },
  { label: 'Müşteri Memnuniyeti', value: '92%', pct: 92, color: 'var(--green)' },
  { label: 'Zamanında Teslim', value: '85%', pct: 85, color: 'var(--gold)' },
  { label: 'Yeni Müşteri Hedefi', value: '2 / 3', pct: 66, color: 'var(--blue)' },
  { label: 'İçerik Üretimi', value: '38 / 45', pct: 84, color: 'var(--green)' },
]

const panel: React.CSSProperties = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }
const ph: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--border)' }

export default async function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ height: 54, background: 'var(--s1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Dashboard</span>
        <div style={{ marginLeft: 18, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 7, padding: '0 11px', height: 32, width: 240 }}>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--text)', fontFamily: 'Inter, sans-serif', width: '100%' }} placeholder="Proje, müşteri veya görev ara..." />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
          <button style={{ background: 'var(--gold)', color: '#000', fontSize: 12, fontWeight: 600, padding: '0 14px', height: 32, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            + Yeni Görev
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.accent, borderRadius: '10px 10px 0 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.iconBg }} />
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.chipBg, color: s.chipC }}>{s.chip}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gecikme + Görevler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
          <div style={panel}>
            <div style={ph}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--red)' }}>⚠</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Geciken Görevler</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--s3)', color: 'var(--t2)' }}>7</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', cursor: 'pointer' }}>Tümünü gör →</span>
            </div>
            <div style={{ padding: '0 18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Kişi','Görev','Gecikme','Öncelik'].map(h => (
                    <th key={h} style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 0 8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {delays.map((d, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 0', borderBottom: i < delays.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${d.color}22`, color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{d.initials}</div>
                          <div><div style={{ fontSize: 12.5, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 10, color: 'var(--t3)' }}>{d.role}</div></div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--t2)', padding: '9px 8px 9px 0', borderBottom: i < delays.length-1 ? '1px solid var(--border)' : 'none', maxWidth: 140 }}>{d.task}</td>
                      <td style={{ padding: '9px 8px 9px 0', borderBottom: i < delays.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: d.color, minWidth: 52, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{d.hours}</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 0', borderBottom: i < delays.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: d.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          {d.sev}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Görevler */}
          <div style={panel}>
            <div style={ph}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--gold)' }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Bugünün Görevleri</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', cursor: 'pointer' }}>Tümünü gör →</span>
            </div>
            <div style={{ padding: '0 18px' }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < tasks.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: t.done ? 'none' : '1.5px solid var(--border2)', background: t.done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.done && <span style={{ fontSize: 9, color: '#fff' }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 12.5, color: t.urgent ? 'var(--red)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1 }}>{t.text}</span>
                  {t.tag && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: t.tag.bg, color: t.tag.color }}>{t.tag.label}</span>}
                  {t.time && <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>{t.time}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projeler + Aktivite */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
          <div style={panel}>
            <div style={ph}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--blue)' }}>📁</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Aktif Projeler</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', cursor: 'pointer' }}>Tümünü gör →</span>
            </div>
            <div style={{ padding: '4px 18px' }}>
              {projects.map((p, i) => (
                <div key={i} style={{ padding: '9px 0', borderBottom: i < projects.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{p.client}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: p.color }}>{p.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={panel}>
            <div style={ph}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--blue)' }}>⚡</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Son Aktiviteler</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', cursor: 'pointer' }}>Tümünü gör →</span>
            </div>
            <div style={{ padding: '2px 18px' }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < activities.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.dot }} />
                    {i < activities.length-1 && <div style={{ flex: 1, width: 1, background: 'var(--border)', marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}><b style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</b> {a.action}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bu Ay metrikleri */}
        <div style={panel}>
          <div style={ph}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--blue)' }}>📊</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bu Ay</span>
            </div>
          </div>
          <div style={{ padding: '4px 18px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ padding: '9px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: m.color }}>{m.value}</span>
                </div>
                <div style={{ height: 3, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
