'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { fmtDeadline, fmtRelative } from '@/lib/utils'
import {
  TrendingUp, Wallet, FolderOpen, Clock, ClipboardCheck, LifeBuoy,
  ArrowUpRight, ArrowDownRight, ArrowRight, CheckCircle2,
  Wifi, WifiOff, CalendarHeart, ChevronRight, Bell
} from 'lucide-react'

function BarChart({ bars }: { bars: { label: string; v: number; hi?: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            height: m ? `${Math.max((b.v / max) * 64, b.v > 0 ? 3 : 0)}px` : '0',
            background: b.hi ? 'linear-gradient(180deg,var(--ac) 0%,rgba(124,106,247,.4) 100%)' : 'var(--s4)',
            borderRadius: '4px 4px 0 0',
            boxShadow: b.hi ? '0 0 12px rgba(124,106,247,.35)' : 'none',
            transition: `height .55s cubic-bezier(.22,1,.36,1) ${i * 30}ms`,
          }} />
          <span style={{ fontSize: 9.5, color: b.hi ? 'var(--ac)' : 'var(--tx3)', fontWeight: b.hi ? 600 : 400 }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ segs }: { segs: { v: number; color: string; label: string }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 150) }, [])
  const total = segs.reduce((s, x) => s + x.v, 0) || 1
  const sz = 90, r = (sz - 14) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="var(--s4)" strokeWidth={10} />
        {segs.map((s, i) => {
          const pct = s.v / total, dash = m ? pct * circ : 0, o = off; off += pct * circ
          return <circle key={i} cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={s.color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-o}
            style={{ transition: `stroke-dasharray .75s ease ${i * 70}ms` }} />
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--tx2)' }}>{s.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)', fontFamily: 'JetBrains Mono,monospace', minWidth: 20, textAlign: 'right' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color, iconBg, Icon, trend, delay = 0, onClick, pulse }: any) {
  return (
    <div
      className="kpi"
      onClick={onClick}
      style={{
        borderLeft: `2.5px solid ${color}`,
        animationDelay: `${delay}ms`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s, transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}22` } }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      {pulse && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2.5s ease-in-out infinite' }} />
      )}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${color}18,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} style={{ color }} strokeWidth={1.9} />
        </div>
        {trend && (
          <span className="kpi-trend" style={{ color: trend.up ? 'var(--green)' : 'var(--red)', background: trend.up ? 'var(--green2)' : 'var(--red2)' }}>
            {trend.up ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}{trend.v}
          </span>
        )}
      </div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
      {onClick && <p style={{ fontSize: 10, color, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
        Görüntüle <ArrowRight size={10} />
      </p>}
    </div>
  )
}


// ─────────────────────────────────────────────────────────
// ÖZEL GÜNLER — 2026 & 2027
// ─────────────────────────────────────────────────────────
const SPECIAL_DAYS: { date: string; name: string; category: string }[] = [
  // ── 2026 KALAN ──────────────────────────────────────────
  { date:"2026-06-21", name:"🤳 Dünya Selfie Günü", category:"dijital" },
  { date:"2026-06-21", name:"☀️ Yaz Gündönümü", category:"kulturel" },
  { date:"2026-06-21", name:"🎵 Dünya Müzik Günü", category:"pazarlama" },
  { date:"2026-06-21", name:"👔 Babalar Günü", category:"pazarlama" },
  { date:"2026-06-30", name:"📱 Dünya Sosyal Medya Günü", category:"dijital" },
  { date:"2026-07-02", name:"📊 Yılın Ortası (Mid-Year)", category:"ticaret" },
  { date:"2026-07-07", name:"🍫 Dünya Çikolata Günü", category:"eğlenceli" },
  { date:"2026-07-15", name:"🇹🇷 Demokrasi ve Millî Birlik Günü", category:"resmi" },
  { date:"2026-07-17", name:"😀 Dünya Emoji Günü", category:"dijital" },
  { date:"2026-07-26", name:"🎂 Dünya Pasta Günü", category:"eğlenceli" },
  { date:"2026-08-08", name:"🐱 Dünya Kediler Günü", category:"eğlenceli" },
  { date:"2026-08-12", name:"👦 Dünya Gençlik Günü", category:"farkındalık" },
  { date:"2026-08-19", name:"📷 Dünya Fotoğraf Günü", category:"pazarlama" },
  { date:"2026-08-26", name:"🐶 Dünya Köpekler Günü", category:"eğlenceli" },
  { date:"2026-08-30", name:"⚔️ Zafer Bayramı", category:"resmi" },
  { date:"2026-09-12", name:"🧠 Dünya Migren Günü", category:"farkındalık" },
  { date:"2026-09-14", name:"📚 Okul Açılış Haftası", category:"ticaret" },
  { date:"2026-09-21", name:"🧡 Dünya Alzheimer Günü", category:"farkındalık" },
  { date:"2026-09-23", name:"🍂 Sonbahar Ekinoksu", category:"kulturel" },
  { date:"2026-09-27", name:"✈️ Dünya Turizm Günü", category:"pazarlama" },
  { date:"2026-09-29", name:"❤️ Dünya Kalp Günü", category:"farkındalık" },
  { date:"2026-10-01", name:"☕ Dünya Kahve Günü", category:"eğlenceli" },
  { date:"2026-10-01", name:"👴 Dünya Yaşlılar Günü", category:"farkındalık" },
  { date:"2026-10-04", name:"🐾 Dünya Hayvanları Koruma Günü", category:"pazarlama" },
  { date:"2026-10-05", name:"🍎 Dünya Öğretmenler Günü (UNESCO)", category:"farkındalık" },
  { date:"2026-10-09", name:"📮 Dünya Posta Günü", category:"pazarlama" },
  { date:"2026-10-10", name:"🧠 Dünya Ruh Sağlığı Günü", category:"pazarlama" },
  { date:"2026-10-12", name:"🦴 Dünya Artrit Günü", category:"farkındalık" },
  { date:"2026-10-14", name:"📏 Dünya Standartlar Günü", category:"dijital" },
  { date:"2026-10-15", name:"✍️ Dünya Blog Günü", category:"dijital" },
  { date:"2026-10-16", name:"🌾 Dünya Gıda Günü", category:"pazarlama" },
  { date:"2026-10-20", name:"📈 Dünya İstatistik Günü", category:"dijital" },
  { date:"2026-10-29", name:"🌐 Dünya İnternet Günü", category:"dijital" },
  { date:"2026-10-29", name:"🇹🇷 Cumhuriyet Bayramı", category:"resmi" },
  { date:"2026-10-31", name:"💰 Dünya Tasarruf Günü", category:"ticaret" },
  { date:"2026-10-31", name:"🎃 Cadılar Bayramı / Halloween", category:"pazarlama" },
  { date:"2026-11-08", name:"🏃 İstanbul Maratonu (yaklaşık)", category:"spor" },
  { date:"2026-11-12", name:"✅ Dünya Kalite Günü", category:"ticaret" },
  { date:"2026-11-14", name:"💉 Dünya Diyabet Günü", category:"farkındalık" },
  { date:"2026-11-16", name:"🚀 Dünya Girişimcilik Haftası", category:"dijital" },
  { date:"2026-11-19", name:"📢 Dünya Reklamcılık Haftası", category:"dijital" },
  { date:"2026-11-20", name:"🧒 Dünya Çocuk Hakları Günü", category:"pazarlama" },
  { date:"2026-11-24", name:"🍎 Öğretmenler Günü (TR)", category:"resmi" },
  { date:"2026-11-27", name:"🛍️ Black Friday", category:"ticaret" },
  { date:"2026-11-30", name:"💻 Siber Pazartesi", category:"ticaret" },
  { date:"2026-12-01", name:"🎗️ Dünya AIDS Günü", category:"farkındalık" },
  { date:"2026-12-02", name:"💻 Dünya Bilgisayar Günü", category:"dijital" },
  { date:"2026-12-03", name:"♿ Dünya Engelliler Günü", category:"farkındalık" },
  { date:"2026-12-05", name:"🤝 Dünya Gönüllüler Günü", category:"farkındalık" },
  { date:"2026-12-10", name:"🕊️ İnsan Hakları Günü", category:"farkındalık" },
  { date:"2026-12-21", name:"❄️ Kış Gündönümü", category:"kulturel" },
  { date:"2026-12-24", name:"🎄 Noel Arifesi", category:"kulturel" },
  { date:"2026-12-25", name:"🎄 Noel", category:"kulturel" },
  { date:"2026-12-26", name:"🛍️ Boxing Day", category:"ticaret" },
  { date:"2026-12-31", name:"🎆 Yılbaşı Arifesi", category:"kulturel" },
  // ── 2027 ──────────────────────────────────────────────────
  { date:"2027-01-01", name:"🎆 Yılbaşı", category:"resmi" },
  { date:"2027-01-31", name:"🤝 Dünya Lepra Günü", category:"farkındalık" },
  { date:"2027-02-04", name:"🎗️ Dünya Kanser Günü", category:"farkındalık" },
  { date:"2027-02-09", name:"🍕 Dünya Pizza Günü", category:"eğlenceli" },
  { date:"2027-02-14", name:"💕 Sevgililer Günü", category:"pazarlama" },
  { date:"2027-03-08", name:"👩 Dünya Kadınlar Günü", category:"pazarlama" },
  { date:"2027-03-09", name:"🌙 Ramazan Başlangıcı", category:"dini" },
  { date:"2027-03-11", name:"🎊 Ramazan Bayramı 1. Gün", category:"dini" },
  { date:"2027-03-12", name:"🎊 Ramazan Bayramı 2. Gün", category:"dini" },
  { date:"2027-03-13", name:"🎊 Ramazan Bayramı 3. Gün", category:"dini" },
  { date:"2027-03-14", name:"🔢 Pi Günü", category:"eğlenceli" },
  { date:"2027-03-15", name:"💄 Dünya Tüketici Hakları Günü", category:"ticaret" },
  { date:"2027-03-20", name:"🌸 İlkbahar Ekinoksu / Nevruz", category:"kulturel" },
  { date:"2027-03-21", name:"💛 Dünya Down Sendromu Günü", category:"farkındalık" },
  { date:"2027-03-21", name:"🌳 Dünya Ormancılık Günü", category:"farkındalık" },
  { date:"2027-03-22", name:"💧 Dünya Su Günü", category:"farkındalık" },
  { date:"2027-03-23", name:"🌤️ Dünya Meteoroloji Günü", category:"farkındalık" },
  { date:"2027-03-24", name:"🫁 Dünya Tüberküloz Günü", category:"farkındalık" },
  { date:"2027-03-27", name:"🎭 Dünya Tiyatro Günü", category:"kultur" },
  { date:"2027-04-01", name:"😂 Nisan Şakası Günü", category:"eğlenceli" },
  { date:"2027-04-02", name:"🧩 Dünya Otizm Farkındalık Günü", category:"farkındalık" },
  { date:"2027-04-06", name:"⚽ Dünya Spor Günü", category:"pazarlama" },
  { date:"2027-04-07", name:"🏥 Dünya Sağlık Günü", category:"farkındalık" },
  { date:"2027-04-11", name:"🐶 Dünya Evcil Hayvan Günü", category:"eğlenceli" },
  { date:"2027-04-23", name:"📚 Dünya Kitap Günü", category:"pazarlama" },
  { date:"2027-04-23", name:"🎈 Ulusal Egemenlik ve Çocuk Bayramı", category:"resmi" },
  { date:"2027-04-27", name:"🎨 Dünya Grafik Tasarım Günü", category:"pazarlama" },
  { date:"2027-04-29", name:"💃 Dünya Dans Günü", category:"kultur" },
  { date:"2027-05-01", name:"🔨 Emek ve Dayanışma Günü (1 Mayıs)", category:"resmi" },
  { date:"2027-05-03", name:"📰 Dünya Basın Özgürlüğü Günü", category:"farkındalık" },
  { date:"2027-05-09", name:"💐 Anneler Günü", category:"pazarlama" },
  { date:"2027-05-17", name:"📡 Dünya Telekomünikasyon Günü", category:"dijital" },
  { date:"2027-05-17", name:"🐑 Kurban Bayramı 1. Gün", category:"dini" },
  { date:"2027-05-18", name:"🐑 Kurban Bayramı 2. Gün", category:"dini" },
  { date:"2027-05-19", name:"🏃 Atatürk'ü Anma, Gençlik ve Spor Bayramı", category:"resmi" },
  { date:"2027-05-19", name:"🐑 Kurban Bayramı 3. Gün", category:"dini" },
  { date:"2027-05-20", name:"🐝 Dünya Arılar Günü", category:"farkındalık" },
  { date:"2027-05-20", name:"🐑 Kurban Bayramı 4. Gün", category:"dini" },
  { date:"2027-05-21", name:"🍵 Dünya Çay Günü", category:"eğlenceli" },
  { date:"2027-05-28", name:"🍔 Dünya Hamburger Günü", category:"eğlenceli" },
  { date:"2027-05-31", name:"🚭 Dünya Tütünsüz Günü", category:"farkındalık" },
  { date:"2027-06-01", name:"🌍 Dünya Çevre Haftası", category:"farkındalık" },
  { date:"2027-06-05", name:"🌿 Dünya Çevre Günü", category:"pazarlama" },
  { date:"2027-06-08", name:"🌊 Dünya Okyanuslar Günü", category:"farkındalık" },
  { date:"2027-06-14", name:"🩸 Dünya Kan Bağışçıları Günü", category:"farkındalık" },
  { date:"2027-06-18", name:"🍽️ Dünya Gastronomi Günü", category:"pazarlama" },
  { date:"2027-06-20", name:"👔 Babalar Günü", category:"pazarlama" },
  { date:"2027-06-21", name:"☀️ Yaz Gündönümü", category:"kulturel" },
  { date:"2027-06-21", name:"🎵 Dünya Müzik Günü", category:"pazarlama" },
  { date:"2027-06-30", name:"📱 Dünya Sosyal Medya Günü", category:"dijital" },
  { date:"2027-07-02", name:"📊 Yılın Ortası (Mid-Year)", category:"ticaret" },
  { date:"2027-07-07", name:"🍫 Dünya Çikolata Günü", category:"eğlenceli" },
  { date:"2027-07-15", name:"🇹🇷 Demokrasi ve Millî Birlik Günü", category:"resmi" },
  { date:"2027-07-17", name:"😀 Dünya Emoji Günü", category:"dijital" },
  { date:"2027-07-26", name:"🎂 Dünya Pasta Günü", category:"eğlenceli" },
  { date:"2027-08-08", name:"🐱 Dünya Kediler Günü", category:"eğlenceli" },
  { date:"2027-08-12", name:"👦 Dünya Gençlik Günü", category:"farkındalık" },
  { date:"2027-08-19", name:"📷 Dünya Fotoğraf Günü", category:"pazarlama" },
  { date:"2027-08-26", name:"🐶 Dünya Köpekler Günü", category:"eğlenceli" },
  { date:"2027-08-30", name:"⚔️ Zafer Bayramı", category:"resmi" },
  { date:"2027-09-12", name:"🧠 Dünya Migren Günü", category:"farkındalık" },
  { date:"2027-09-14", name:"📚 Okul Açılış Haftası", category:"ticaret" },
  { date:"2027-09-21", name:"🧡 Dünya Alzheimer Günü", category:"farkındalık" },
  { date:"2027-09-23", name:"🍂 Sonbahar Ekinoksu", category:"kulturel" },
  { date:"2027-09-27", name:"✈️ Dünya Turizm Günü", category:"pazarlama" },
  { date:"2027-09-29", name:"❤️ Dünya Kalp Günü", category:"farkındalık" },
  { date:"2027-10-01", name:"☕ Dünya Kahve Günü", category:"eğlenceli" },
  { date:"2027-10-01", name:"👴 Dünya Yaşlılar Günü", category:"farkındalık" },
  { date:"2027-10-04", name:"🐾 Dünya Hayvanları Koruma Günü", category:"pazarlama" },
  { date:"2027-10-05", name:"🍎 Dünya Öğretmenler Günü (UNESCO)", category:"farkındalık" },
  { date:"2027-10-09", name:"📮 Dünya Posta Günü", category:"pazarlama" },
  { date:"2027-10-10", name:"🧠 Dünya Ruh Sağlığı Günü", category:"pazarlama" },
  { date:"2027-10-12", name:"🦴 Dünya Artrit Günü", category:"farkındalık" },
  { date:"2027-10-14", name:"📏 Dünya Standartlar Günü", category:"dijital" },
  { date:"2027-10-15", name:"✍️ Dünya Blog Günü", category:"dijital" },
  { date:"2027-10-16", name:"🌾 Dünya Gıda Günü", category:"pazarlama" },
  { date:"2027-10-20", name:"📈 Dünya İstatistik Günü", category:"dijital" },
  { date:"2027-10-29", name:"🌐 Dünya İnternet Günü", category:"dijital" },
  { date:"2027-10-29", name:"🇹🇷 Cumhuriyet Bayramı", category:"resmi" },
  { date:"2027-10-31", name:"💰 Dünya Tasarruf Günü", category:"ticaret" },
  { date:"2027-10-31", name:"🎃 Cadılar Bayramı / Halloween", category:"pazarlama" },
  { date:"2027-11-08", name:"🏃 İstanbul Maratonu (yaklaşık)", category:"spor" },
  { date:"2027-11-11", name:"✅ Dünya Kalite Günü", category:"ticaret" },
  { date:"2027-11-14", name:"💉 Dünya Diyabet Günü", category:"farkındalık" },
  { date:"2027-11-15", name:"🚀 Dünya Girişimcilik Haftası", category:"dijital" },
  { date:"2027-11-19", name:"📢 Dünya Reklamcılık Haftası", category:"dijital" },
  { date:"2027-11-20", name:"🧒 Dünya Çocuk Hakları Günü", category:"pazarlama" },
  { date:"2027-11-24", name:"🍎 Öğretmenler Günü (TR)", category:"resmi" },
  { date:"2027-11-26", name:"🛍️ Black Friday", category:"ticaret" },
  { date:"2027-11-29", name:"💻 Siber Pazartesi", category:"ticaret" },
  { date:"2027-12-01", name:"🎗️ Dünya AIDS Günü", category:"farkındalık" },
  { date:"2027-12-02", name:"💻 Dünya Bilgisayar Günü", category:"dijital" },
  { date:"2027-12-03", name:"♿ Dünya Engelliler Günü", category:"farkındalık" },
  { date:"2027-12-05", name:"🤝 Dünya Gönüllüler Günü", category:"farkındalık" },
  { date:"2027-12-10", name:"🕊️ İnsan Hakları Günü", category:"farkındalık" },
  { date:"2027-12-21", name:"❄️ Kış Gündönümü", category:"kulturel" },
  { date:"2027-12-24", name:"🎄 Noel Arifesi", category:"kulturel" },
  { date:"2027-12-25", name:"🎄 Noel", category:"kulturel" },
  { date:"2027-12-26", name:"🛍️ Boxing Day", category:"ticaret" },
  { date:"2027-12-31", name:"🎆 Yılbaşı Arifesi", category:"kulturel" },
]

function getUpcomingSpecialDays(days: number = 7) {
  const today = new Date()
  today.setHours(0,0,0,0)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + days)
  return SPECIAL_DAYS.filter(d => {
    const dt = new Date(d.date)
    dt.setHours(0,0,0,0)
    return dt >= today && dt <= limit
  }).sort((a,b) => a.date.localeCompare(b.date))
}

const CAT_COLOR: Record<string,string> = {
  resmi:'var(--ac)', pazarlama:'var(--blue)', dijital:'var(--green)',
  ticaret:'var(--amber)', dini:'var(--red)', farkındalık:'var(--tx2)',
  kulturel:'#e879f9', eğlenceli:'#f97316', spor:'#06b6d4',
  ticaret2:'var(--amber)', kultur:'#a78bfa', default:'var(--tx3)'
}


const SUPPORT_TYPE: Record<string,{label:string;color:string}> = {
  oneri:   {label:'💡 Öneri',   color:'var(--blue)'},
  hata:    {label:'🐛 Hata',    color:'var(--red)'},
  sikayet: {label:'😤 Şikayet', color:'var(--amber)'},
  diger:   {label:'💬 Diğer',   color:'var(--tx3)'},
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], approvals: [] })
  const [activities, setActivities] = useState<any[]>([])
  const [support,     setSupport]     = useState<any[]>([])
  const [myRole,      setMyRole]      = useState('')
  const [myUserId,    setMyUserId]    = useState('')
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [userName, setUserName] = useState('')
  const [connected, setConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const channelsRef = useRef<any[]>([])

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])

  async function fetchAll() {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setMyUserId(user.id)
      sb.from('profiles').select('full_name,role').eq('id', user.id).single().then(({ data }) => { setUserName(data?.full_name?.split(' ')[0] || ''); setMyRole(data?.role || '') })
    })
    const [t, p, c, tr, ap, sp, act] = await Promise.all([
      sb.from('tasks').select('id,title,status,priority,due_date,assigned_to,client_id'),
      sb.from('projects').select('id,name,status,progress,deadline,client_id'),
      sb.from('clients').select('id,name,status'),
      sb.from('transactions').select('type,amount,date'),
      sb.from('approvals').select('id,title,type,status,client_status,created_at,client_id,requested_by,portal_tokens:client_portal_tokens(client_decision,client_note,client_decided_at),client:clients(name)'),
      sb.from('support_tickets').select('id,type,title,status,created_at,user_id').eq('status','open').order('created_at',{ascending:false}).limit(5),
      sb.from('activities').select('*, user:profiles!activities_user_id_fkey(full_name)').order('created_at',{ascending:false}).limit(8),
    ])
    setData({ tasks: t.data || [], projects: p.data || [], clients: c.data || [], transactions: tr.data || [], approvals: ap.data || [] })
    setSupport(sp.data || [])
    setActivities(act.data || [])
    setLoading(false)
    setLastUpdate(new Date())
  }

  useEffect(() => {
    fetchAll()

    // Realtime subscriptions
    const sb = createClient()
    const tables = ['tasks', 'projects', 'clients', 'transactions', 'approvals', 'client_portal_tokens']
    
    tables.forEach(table => {
      const ch = sb.channel(`db-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll()
        })
        .subscribe(status => {
          setConnected(status === 'SUBSCRIBED')
        })
      channelsRef.current.push(ch)
    })

    return () => {
      channelsRef.current.forEach(ch => sb.removeChannel(ch))
      channelsRef.current = []
    }
  }, [])

  const { tasks, projects, clients, transactions, approvals } = data
  const income  = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const expense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const net     = income - expense
  const isMember = myRole === 'member'
  const myTasks  = isMember ? tasks.filter((t: any) => t.assigned_to === myUserId) : tasks
  const done     = myTasks.filter((t: any) => t.status === 'done')
  const overdue  = myTasks.filter((t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
  const pending = approvals.filter((a: any) => a.status === 'pending')
  const clientPending = approvals.filter((a: any) => a.client_status === 'sent')
  const clientApproved = approvals.filter((a: any) => a.client_status === 'client_approved')
  const clientRevision = approvals.filter((a: any) => a.client_status === 'client_rejected')

  const clientDecided  = [...clientApproved, ...clientRevision].sort((a: any, b: any) => {
    const ta = a.portal_tokens?.[0]?.client_decided_at || ''
    const tb = b.portal_tokens?.[0]?.client_decided_at || ''
    return tb.localeCompare(ta)
  }).slice(0, 8)
  const activeP = projects.filter((p: any) => p.status === 'active')

  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const bars = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const v = transactions.filter((t: any) => t.type === 'income' && t.date && new Date(t.date).getMonth() === m).reduce((s: number, t: any) => s + Number(t.amount), 0)
    return { label: MONTHS[m], v: Math.round(v / 1000), hi: i === 5 }
  })

  const donutSegs = [
    { v: myTasks.filter((t: any) => t.status === 'todo').length,        color: 'var(--s5)',   label: 'Bekliyor' },
    { v: myTasks.filter((t: any) => t.status === 'in_progress').length, color: 'var(--blue)', label: 'Devam' },
    { v: myTasks.filter((t: any) => t.status === 'review').length,      color: 'var(--amber)',label: 'İnceleme' },
    { v: done.length,                                                    color: 'var(--green)',label: 'Tamamlandı' },
  ]

  const fmt = (v: number) => v >= 1000000 ? `₺${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₺${Math.round(v/1000)}K` : `₺${v}`
  const PRI: Record<string, string> = { critical: 'var(--red)', high: 'var(--amber)', normal: 'var(--blue)', low: 'var(--tx3)' }

  const overdueTop = [...overdue].sort((a: any, b: any) => {
    const o: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
    return (o[a.priority] ?? 2) - (o[b.priority] ?? 2)
  }).slice(0, 5)

  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const weekTasks = myTasks.filter((t: any) => t.due_date && t.status !== 'done' && new Date(t.due_date) >= now && new Date(t.due_date) <= weekEnd)
    .sort((a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date))).slice(0, 5)

  const timeSince = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
  const lastUpdStr = timeSince < 5 ? 'Az önce' : timeSince < 60 ? `${timeSince}s önce` : `${Math.floor(timeSince/60)}dk önce`

  return (
    <>
      <style>{`
        .db-kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:18px}
        .db-mid{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-bottom:16px}
        .db-bot{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px}
        @media(max-width:1200px){.db-kpi{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:768px){.db-kpi{grid-template-columns:repeat(2,1fr)}.db-mid{grid-template-columns:1fr}.db-bot{grid-template-columns:1fr}}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* ── Özel Gün Uyarı Bandı ─────────────────────── */}
        {(() => {
          const upcoming = getUpcomingSpecialDays(7)
          if (upcoming.length === 0) return null
          return (
            <div style={{
              background:'linear-gradient(90deg,rgba(124,106,247,.12) 0%,rgba(124,106,247,.04) 100%)',
              borderBottom:'1px solid rgba(124,106,247,.2)',
              padding:'9px 16px',
              display:'flex',
              alignItems:'center',
              gap:10,
              overflowX:'auto',
              flexShrink:0,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                <Bell size={13} style={{color:'var(--ac)'}} strokeWidth={2}/>
                <span style={{fontSize:11.5,fontWeight:700,color:'var(--ac)',whiteSpace:'nowrap'}}>Bu Hafta</span>
              </div>
              <div style={{display:'flex',gap:8,overflowX:'auto',flexShrink:0}}>
                {upcoming.map((d,i) => {
                  const dt = new Date(d.date)
                  const today2 = new Date(); today2.setHours(0,0,0,0)
                  const diff = Math.round((dt.getTime()-today2.getTime())/86400000)
                  const clr = CAT_COLOR[d.category] || 'var(--ac)'
                  const dayLabel = diff===0?'Bugün':diff===1?'Yarın':`${diff} gün`
                  return (
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:6,
                      background:`${clr}12`,
                      border:`1px solid ${clr}30`,
                      borderRadius:8,padding:'4px 10px',
                      flexShrink:0,whiteSpace:'nowrap',
                    }}>
                      <span style={{fontSize:12.5}}>{d.name.split(' ')[0]}</span>
                      <span style={{fontSize:12,color:'var(--tx2)',fontWeight:500}}>{d.name.split(' ').slice(1).join(' ')}</span>
                      <span style={{fontSize:10.5,fontWeight:700,color:clr,background:`${clr}20`,padding:'1px 6px',borderRadius:4,marginLeft:2}}>
                        {dayLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        <TopBar
          title={userName ? `Merhaba, ${userName}` : 'Dashboard'}
          subtitle={now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Realtime göstergesi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--s2)', border: `1px solid ${connected ? 'rgba(34,211,160,.2)' : 'rgba(242,87,87,.2)'}`, borderRadius: 8, padding: '5px 10px' }}>
                {connected
                  ? <Wifi size={11} style={{ color: 'var(--green)' }} strokeWidth={2} />
                  : <WifiOff size={11} style={{ color: 'var(--red)' }} strokeWidth={2} />}
                <span style={{ fontSize: 10.5, color: connected ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {connected ? 'Canlı' : 'Bağlantı yok'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--tx3)', borderLeft: '1px solid var(--bdr)', paddingLeft: 6 }}>{lastUpdStr}</span>
              </div>
              {/* Saat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '5px 11px' }}>
                <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)', fontWeight: 500 }}>
                  {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--tx3)', fontSize: 14, flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--ac),#5b4de0)', animation: 'pulse 2s ease infinite', boxShadow: '0 0 16px rgba(124,106,247,.4)' }} />
              Yükleniyor...
            </div>
          ) : (<>
            {/* KPI — her biri tıklanabilir */}
            <div className="db-kpi">
              {myRole === 'admin' && <KPI label="Toplam Gelir" value={fmt(income)} sub={`Gider: ${fmt(expense)}`}
                color="var(--green)" iconBg="var(--green2)" Icon={TrendingUp}
                trend={{ v: '+12%', up: true }} delay={0} pulse={connected}
                onClick={() => router.push('/dashboard/finans')} />}

              {myRole === 'admin' && <KPI label="Net Kar" value={fmt(net)} sub={net >= 0 ? 'Kârlı dönem' : 'Zarar'}
                color={net >= 0 ? 'var(--ac)' : 'var(--red)'}
                iconBg={net >= 0 ? 'var(--ac3)' : 'var(--red2)'} Icon={Wallet}
                delay={40} onClick={() => router.push('/dashboard/muhasebe')} />}

              <KPI label="Aktif Proje" value={isMember ? String(new Set(myTasks.filter((t:any)=>t.status!=='done').map((t:any)=>t.client_id)).size) : String(activeP.length)}
                sub={isMember ? `${myTasks.filter((t:any)=>t.status!=='done').length} aktif görevim` : `${clients.filter((c: any) => c.status === 'active').length} aktif müşteri`}
                color="var(--blue)" iconBg="var(--blue2)" Icon={FolderOpen}
                delay={80} onClick={() => router.push('/dashboard/musteriler')} />

              <KPI label="Geciken Görev" value={String(overdue.length)}
                sub={overdue.length > 0 ? `${overdue.filter((t:any)=>t.priority==='critical').length} kritik${isMember?' (benim)':''}` : 'Temiz 👌'}
                color={overdue.length > 0 ? 'var(--red)' : 'var(--green)'}
                iconBg={overdue.length > 0 ? 'var(--red2)' : 'var(--green2)'} Icon={Clock}
                delay={120} onClick={() => router.push('/dashboard/gecikmeler')} />

              <KPI label="Onay Bekliyor" value={String(pending.length)}
                sub={clientPending.length > 0 ? `${clientPending.length} müşteri yanıtı bekleniyor` : 'İç onay kuyruğu'}
                color="var(--amber)" iconBg="var(--amber2)" Icon={ClipboardCheck}
                delay={160} onClick={() => router.push('/dashboard/onay')} pulse={pending.length > 0} />

              <KPI label="Müşteri Kararları" value={String(clientApproved.length + clientRevision.length)}
                sub={clientRevision.length > 0 ? `${clientRevision.length} revizyon istedi` : clientApproved.length > 0 ? `${clientApproved.length} onayladı` : 'Beklenen karar yok'}
                color={clientRevision.length > 0 ? 'var(--red)' : clientApproved.length > 0 ? 'var(--green)' : 'var(--tx3)'}
                iconBg={clientRevision.length > 0 ? 'var(--red2)' : clientApproved.length > 0 ? 'var(--green2)' : 'var(--s3)'}
                Icon={CheckCircle2} delay={200} onClick={() => router.push('/dashboard/onay')} />
            </div>

            {/* Orta */}
            <div className="db-mid">
              {myRole === 'admin' && <div className="card anim-fade" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/finans')}>
                <div className="card-h">
                  <span className="card-title">Aylık Gelir Trendi</span>
                  <span className="card-meta">Son 6 ay · Tıkla</span>
                </div>
                <div style={{ padding: '16px 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--tx)', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(income)}</span>
                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ArrowUpRight size={13} strokeWidth={2.5} />12% artış
                    </span>
                  </div>
                  <BarChart bars={bars} />
                  <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bdr)' }}>
                    {[{ l: 'Gelir', v: income, c: 'var(--green)' }, { l: 'Gider', v: expense, c: 'var(--red)' }, { l: 'Net', v: net, c: 'var(--ac)' }].map(s => (
                      <div key={s.l}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{s.l}</p>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: s.c, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(s.v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>}

              <div className="card anim-fade" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/gorevler')}>
                <div className="card-h">
                  <span className="card-title">Görev Durumu</span>
                  <span className="card-meta">{myTasks.length} toplam · Tıkla</span>
                </div>
                <div style={{ padding: '18px' }}>
                  <Donut segs={donutSegs} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, background: 'var(--green2)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)', lineHeight: 1 }}>{done.length}</p>
                      <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tamamlandı</p>
                    </div>
                    <div style={{ flex: 1, background: 'var(--red2)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--red)', lineHeight: 1 }}>{overdue.length}</p>
                      <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Geciken</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt */}
            <div className="db-bot">

              {/* Müşteri Kararları */}
              <div className="card anim-fade" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/onay')}>
                <div className="card-h">
                  <span className="card-title">Müşteri Kararları</span>
                  <span className="card-meta">{clientDecided.length} karar · Tıkla</span>
                </div>
                {clientDecided.length === 0 ? (
                  <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                    Henüz müşteri kararı yok
                  </div>
                ) : (
                  <div style={{ padding: '6px 0' }}>
                    {clientDecided.map((a: any) => {
                      const isApproved = a.client_status === 'client_approved'
                      const token = a.portal_tokens?.[0]
                      const note = token?.client_note
                      const decidedAt = token?.client_decided_at
                      return (
                        <div key={a.id} className="row" style={{ borderLeft: `3px solid ${isApproved ? 'var(--green)' : 'var(--amber)'}`, paddingLeft: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                              <span style={{ fontSize: 13 }}>{isApproved ? '✅' : '🔄'}</span>
                              <p style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.client?.name || '—'}</p>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: isApproved ? 'var(--green)' : 'var(--amber)', background: isApproved ? 'var(--green2)' : 'var(--amber2)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                                {isApproved ? 'Onayladı' : 'Revizyon'}
                              </span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                            {note && <p style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{note}"</p>}
                          </div>
                          {decidedAt && <span style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{fmtRelative(decidedAt)}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Destek Talepleri — sadece admin/manager */}
              {(myRole === 'admin' || myRole === 'manager') && (
                <div className="card anim-fade" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/destek')}>
                  <div className="card-h">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <LifeBuoy size={14} style={{ color: 'var(--ac)' }} strokeWidth={2} />
                      <span className="card-title">Destek Talepleri</span>
                    </div>
                    <span className="card-meta">{support.length} açık · Tıkla</span>
                  </div>
                  {support.length === 0 ? (
                    <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                      Açık talep yok 🎉
                    </div>
                  ) : (
                    <div style={{ padding: '6px 0' }}>
                      {support.map((t: any) => {
                        const tp = SUPPORT_TYPE[t.type] || SUPPORT_TYPE.diger
                        return (
                          <div key={t.id} className="row" style={{ borderLeft: `3px solid ${tp.color}` }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                              <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{tp.label}</p>
                            </div>
                            <span style={{ fontSize: 10.5, color: 'var(--tx3)', flexShrink: 0 }}>{fmtRelative(t.created_at)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Aktif Projeler */}
              <div className="card anim-fade">
                <div className="card-h">
                  <span className="card-title">Aktif Projeler</span>
                  <button onClick={() => router.push('/dashboard/musteriler')}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--ac)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx3)')}>
                    Tümü <ArrowRight size={11} />
                  </button>
                </div>
                {activeP.length === 0
                  ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Aktif proje yok</div>
                  : activeP.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="row" style={{ cursor: 'pointer' }}
                      onClick={() => router.push('/dashboard/musteriler')}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{p.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="prog" style={{ flex: 1 }}>
                            <div className="prog-fill" style={{ width: `${p.progress || 0}%`, background: p.progress > 70 ? 'var(--green)' : p.progress > 40 ? 'var(--ac)' : 'var(--red)' }} />
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--tx2)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{p.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Gecikmeler */}
              <div className="card anim-fade">
                <div className="card-h">
                  <span className="card-title">Gecikmeler</span>
                  {overdue.length > 0 && (
                    <button onClick={() => router.push('/dashboard/gecikmeler')}
                      className="badge badge-red" style={{ cursor: 'pointer', border: 'none' }}>
                      {overdue.length} →
                    </button>
                  )}
                </div>
                {overdueTop.length === 0
                  ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 28, color: 'var(--green)', fontSize: 13, fontWeight: 500 }}>
                      <CheckCircle2 size={15} strokeWidth={2} /> Geciken görev yok
                    </div>
                  : overdueTop.map((t: any) => {
                    const days = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000)
                    const c = PRI[t.priority] || 'var(--tx3)'
                    return (
                      <div key={t.id} className="row" style={{ cursor: 'pointer' }}
                        onClick={() => router.push('/dashboard/gecikmeler')}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || 'Görev'}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{fmtDeadline(t.due_date)}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: c, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>+{days}g</span>
                      </div>
                    )
                  })}
              </div>

              {/* Bu Hafta */}
              <div className="card anim-fade">
                <div className="card-h">
                  <span className="card-title">Bu Hafta Teslim</span>
                  <button onClick={() => router.push('/dashboard/gorevler')}
                    style={{ fontSize: 11.5, color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {weekTasks.length} görev →
                  </button>
                </div>
                {weekTasks.length === 0
                  ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Bu hafta teslim yok</div>
                  : weekTasks.map((t: any) => {
                    const diff = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / 86400000)
                    const urgent = diff <= 1
                    return (
                      <div key={t.id} className="row" style={{ cursor: 'pointer' }}
                        onClick={() => router.push('/dashboard/gorevler')}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: urgent ? 'var(--red)' : 'var(--s5)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || 'Görev'}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                            {diff === 0 ? 'Bugün' : diff === 1 ? 'Yarın' : `${diff} gün sonra`}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: urgent ? 'var(--red)' : 'var(--tx2)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                          {fmtDeadline(t.due_date)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* ── AKTİVİTE FEED ── */}
            {myRole === 'admin' && activities.length > 0 && (
              <div className="card anim-fade" style={{ marginTop: 14 }}>
                <div className="card-h">
                  <span className="card-title">Son İşlemler</span>
                  <button onClick={() => router.push('/dashboard/performans')} style={{ fontSize: 11.5, color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer' }}>Tümü →</button>
                </div>
                {activities.map((a: any) => {
                  const init = (a.user?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  const ACTION: Record<string,string> = { created:'oluşturdu', updated:'güncelledi', deleted:'sildi', approval_approved:'onayladı', approval_rejected:'reddetti' }
                  const ENTITY: Record<string,string> = { tasks:'görev', projects:'proje', clients:'müşteri', contents:'içerik', approvals:'onay', transactions:'işlem' }
                  const action = a.action?.startsWith('status_changed') ? `durumu güncelledi` : a.action?.startsWith('progress') ? 'ilerlemeyi güncelledi' : ACTION[a.action] || a.action
                  return (
                    <div key={a.id} className="row">
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{init}</div>
                      <p style={{ flex: 1, fontSize: 12.5, color: 'var(--tx2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: 'var(--tx)' }}>{a.user?.full_name?.split(' ')[0] || '?'}</strong>
                        {' '}{ENTITY[a.entity_type] || a.entity_type} {action}
                        {a.entity_title && <span style={{ color: 'var(--tx3)' }}> — {a.entity_title}</span>}
                      </p>
                      <span style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{fmtRelative(a.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>)}

          {/* ── Özel Günler — Gelecek 30 Gün ─────────────────── */}
          {(() => {
            const next30 = (() => {
              const today2 = new Date(); today2.setHours(0,0,0,0)
              const limit = new Date(today2); limit.setDate(limit.getDate()+30)
              return SPECIAL_DAYS.filter(d => {
                const dt = new Date(d.date); dt.setHours(0,0,0,0)
                return dt >= today2 && dt <= limit
              }).sort((a,b)=>a.date.localeCompare(b.date))
            })()
            if (next30.length === 0) return null
            const months_tr: Record<number,string> = {1:'Oca',2:'Şub',3:'Mar',4:'Nis',5:'May',6:'Haz',7:'Tem',8:'Ağu',9:'Eyl',10:'Eki',11:'Kas',12:'Ara'}
            return (
              <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:14,padding:'16px 18px',marginTop:14,marginBottom:80}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <CalendarHeart size={15} style={{color:'var(--ac)'}} strokeWidth={2}/>
                  <span style={{fontSize:13.5,fontWeight:700}}>Yaklaşan Özel Günler</span>
                  <span style={{fontSize:11,color:'var(--tx3)',marginLeft:'auto'}}>Sonraki 30 gün · {next30.length} gün</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:8}}>
                  {next30.map((d,i) => {
                    const dt = new Date(d.date)
                    const today3 = new Date(); today3.setHours(0,0,0,0)
                    const diff = Math.round((dt.getTime()-today3.getTime())/86400000)
                    const clr = CAT_COLOR[d.category] || 'var(--tx3)'
                    const dayStr = diff===0?'Bugün 🔥':diff===1?'Yarın':diff<=7?`${diff} gün kaldı`:`${diff} gün kaldı`
                    const mo = dt.getMonth()+1
                    const urgent = diff <= 7
                    return (
                      <div key={i} style={{
                        display:'flex',alignItems:'center',gap:10,
                        padding:'9px 12px',
                        background:urgent?`${clr}08`:'var(--s2)',
                        border:`1px solid ${urgent?clr+'30':'var(--bdr)'}`,
                        borderRadius:9,
                        borderLeft:`3px solid ${clr}`,
                      }}>
                        <div style={{textAlign:'center',minWidth:34,flexShrink:0}}>
                          <div style={{fontSize:15,fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:clr,lineHeight:1}}>{dt.getDate()}</div>
                          <div style={{fontSize:9.5,color:'var(--tx3)',fontWeight:600,textTransform:'uppercase'}}>{months_tr[mo]}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
                          <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>{d.category}</div>
                        </div>
                        <span style={{fontSize:10.5,fontWeight:700,color:urgent?clr:'var(--tx3)',flexShrink:0,background:urgent?`${clr}15`:'transparent',padding:'2px 7px',borderRadius:5}}>
                          {dayStr}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

        </div>
      </div>
    </>
  )
}




