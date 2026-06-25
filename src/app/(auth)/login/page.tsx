'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Download, Smartphone, Monitor, Share, X, ChevronUp } from 'lucide-react'
import DaydreamLogo from '@/components/DaydreamLogo'

type Platform = 'ios' | 'android' | 'desktop' | 'other'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Win|Mac|Linux/.test(navigator.platform || '')) return 'desktop'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [checking, setChecking] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<Platform>('other')
  const [installed, setInstalled] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const redirected = useRef(false)

  useEffect(() => {
    const p = detectPlatform()
    setPlatform(p)
    setInstalled(isStandalone())

    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session && !redirected.current) {
        redirected.current = true
        window.location.href = '/dashboard'
      } else {
        setChecking(false)
      }
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN') && session && !redirected.current) {
        redirected.current = true
        window.location.href = '/dashboard'
      }
    })
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (platform === 'ios') {
      setShowIOSGuide(true)
      return
    }
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setInstalled(true)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    const { error: err } = await createClient().auth.signInWithPassword({ email, password })
    if (err) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
    }
  }

  // Platform bazlı buton içeriği
  function installButtonContent() {
    if (platform === 'ios') return { icon: <Smartphone size={14} strokeWidth={2} />, text: 'iPhone\'a Yükle', sub: 'Safari\'den ana ekrana ekle' }
    if (platform === 'android') return { icon: <Smartphone size={14} strokeWidth={2} />, text: 'Telefona Yükle', sub: 'Uygulama gibi kullan' }
    return { icon: <Monitor size={14} strokeWidth={2} />, text: 'Bilgisayara Yükle', sub: 'Masaüstüne uygulama ekle' }
  }

  const showInstallBtn = !installed && (platform === 'ios' || installPrompt)

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,var(--ac),#5b4de0)', animation: 'pulse 2s ease infinite', boxShadow: '0 0 20px rgba(124,106,247,.4)' }} />
      </div>
    )
  }

  const btnInfo = installButtonContent()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20, position: 'relative' }}>
      <style>{`
        @keyframes anim-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .anim-up{animation:anim-up .4s cubic-bezier(.22,1,.36,1) both}
        @keyframes logo-in{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        .logo-in{animation:logo-in .5s cubic-bezier(.22,1,.36,1) .05s both}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .logo-float{animation:float 4s ease-in-out infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .install-btn{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:var(--s2);border:1px solid var(--bdr);border-radius:9px;color:var(--tx2);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;margin-top:10px;text-align:left}
        .install-btn:hover{border-color:var(--ac);color:var(--ac);background:var(--ac2)}
        .ios-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;flex-direction:column;justify-content:flex-end}
        .ios-sheet{background:var(--s1);border-radius:20px 20px 0 0;padding:24px 20px 40px;animation:slide-up .3s cubic-bezier(.22,1,.36,1)}
        .ios-step{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr)}
        .ios-step:last-child{border-bottom:none}
        .ios-num{width:28px;height:28px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(124,106,247,0.12) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>

        <div className="logo-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div className="logo-float"><DaydreamLogo size={72} /></div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)', marginTop: 14, letterSpacing: '-.4px', lineHeight: 1.2 }}>Daydream Production</p>
          <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>Agency Operasyon Paneli</p>
        </div>

        <div className="card anim-up" style={{ overflow: 'hidden' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--ac), #5b4de0, transparent)' }} />
          <div style={{ padding: '26px 24px 30px' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.3px', marginBottom: 4 }}>Giriş Yap</h1>
            <p style={{ fontSize: 12.5, color: 'var(--tx3)', marginBottom: 22 }}>Ekibinizle çalışmaya başlayın.</p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="label">E-posta</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ad@daydream.com" className="inp" autoComplete="email" disabled={loading} />
              </div>
              <div>
                <label className="label">Şifre</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="inp" autoComplete="current-password" disabled={loading} />
              </div>
              {error && <div className="toast toast-err" style={{ margin: 0 }}>{error}</div>}
              <button type="submit" disabled={loading} className="btn" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 13.5 }}>
                {loading
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Giriş Yapılıyor...</>
                  : <><span>Giriş Yap</span><ArrowRight size={15} strokeWidth={2} /></>
                }
              </button>
            </form>

            {/* Install butonu */}
            {showInstallBtn && (
              <button className="install-btn" onClick={handleInstall}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ac2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ac)' }}>
                  {btnInfo.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{btnInfo.text}</p>
                  <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 1 }}>{btnInfo.sub}</p>
                </div>
                <Download size={13} strokeWidth={2} style={{ color: 'var(--tx3)', flexShrink: 0 }} />
              </button>
            )}

            {installed && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--green)' }}>
                <Smartphone size={13} strokeWidth={2} /> Uygulama yüklü ✓
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--tx3)', marginTop: 20 }}>Daydream Production © 2026</p>
      </div>

      {/* iOS Rehber Modal */}
      {showIOSGuide && (
        <div className="ios-overlay" onClick={e => { if (e.target === e.currentTarget) setShowIOSGuide(false) }}>
          <div className="ios-sheet">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700 }}>iPhone&apos;a Yükle</p>
                <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>Safari&apos;den 3 adımda tamamla</p>
              </div>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'var(--s3)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)' }}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="ios-step">
              <div className="ios-num">1</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Paylaş butonuna bas</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', borderRadius: 8, padding: '8px 12px', width: 'fit-content' }}>
                  <Share size={16} style={{ color: 'var(--ac)' }} strokeWidth={2} />
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Ekranın altındaki paylaş ikonu</span>
                </div>
              </div>
            </div>

            <div className="ios-step">
              <div className="ios-num">2</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Aşağı kaydır ve seç</p>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 600 }}>➕ Ana Ekrana Ekle</p>
                  <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>&quot;Add to Home Screen&quot;</p>
                </div>
              </div>
            </div>

            <div className="ios-step">
              <div className="ios-num">3</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ekle&apos;ye bas</p>
                <p style={{ fontSize: 12, color: 'var(--tx3)' }}>Sağ üstteki <strong style={{ color: 'var(--ac)' }}>Ekle</strong> butonuna bas. Daydream ikonu ana ekranında görünecek.</p>
              </div>
            </div>

            <div style={{ marginTop: 16, background: 'var(--ac2)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(124,106,247,.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChevronUp size={14} style={{ color: 'var(--ac)', flexShrink: 0 }} strokeWidth={2.5} />
              <p style={{ fontSize: 12, color: 'var(--tx2)' }}>Bu rehber <strong style={{ color: 'var(--ac)' }}>Safari</strong> tarayıcısında çalışır. Chrome veya başka tarayıcıda açıksan önce Safari&apos;ye geç.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
