'use client'
import { useState } from 'react'

const QUESTIONS = [
  { key: 'q1', text: 'Daydream ile çalışmaktan ne kadar memnun kaldınız?' },
  { key: 'q2', text: 'Ürettiğimiz işlerin yaratıcı kalitesinden memnun musunuz?' },
  { key: 'q3', text: 'İletişimimizi ve size geri dönüşlerimizi nasıl değerlendirirsiniz?' },
  { key: 'q4', text: 'Planlama, revizyon ve teslim sürecinden memnun kaldınız mı?' },
] as const

const WINE = '#111111'

export default function AnketPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [tried, setTried] = useState(false)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const allRated = QUESTIONS.every(q => scores[q.key])

  function next() {
    setTried(true)
    if (!allRated) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    setSending(true); setError('')
    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, full_name: fullName, company, comment, website }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Hata')
      setStep(3)
      window.scrollTo({ top: 0 })
    } catch (e: any) {
      setError(e.message || 'Gönderilemedi, lütfen tekrar deneyin.')
    }
    setSending(false)
  }

  return (
    <>
      <style>{`
        .an{display:flex;min-height:100vh;background:#fff;color:#1a1a1a;font-family:Inter,system-ui,sans-serif}
        .an-side{width:36%;max-width:580px;background:#0a0a0a;color:#fff;padding:48px;display:flex;flex-direction:column}
        .an-main{flex:1;padding:48px 24px;display:flex;justify-content:center}
        .an-box{width:100%;max-width:512px}
        .an-sc{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
        .an-sc button{height:48px;background:#fff;border:1px solid #dcdcdc;border-radius:4px;font-size:16px;cursor:pointer;color:#1a1a1a;transition:all .12s}
        .an-sc button:hover{border-color:${WINE}}
        .an-sc button.on{background:${WINE};border-color:${WINE};color:#fff}
        .an-inp{width:100%;box-sizing:border-box;border:1px solid #dcdcdc;border-radius:4px;padding:12px;font-size:14px;font-family:inherit;color:#1a1a1a;background:#fff}
        .an-inp:focus{outline:none;border-color:${WINE}}
        .an-btn{background:${WINE};color:#fff;border:none;border-radius:4px;padding:11px 22px;font-size:13px;font-weight:600;cursor:pointer}
        .an-btn:disabled{opacity:.5;cursor:not-allowed}
        .an-ghost{background:none;border:none;color:#666;font-size:13px;cursor:pointer;padding:11px 0}
        @media(max-width:860px){
          .an{flex-direction:column}
          .an-side{width:100%;max-width:none;padding:28px 24px}
          .an-side .an-hide{display:none}
          .an-main{padding:28px 20px 48px}
        }
      `}</style>

      <div className="an">
        {/* Sol panel */}
        <aside className="an-side">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Daydream" style={{ flexShrink: 0 }}>
              <rect width="100" height="100" rx="16" fill="#0c0c10" />
              <path d="M22 16 L22 84 L38 84 C62 84 76 70 76 50 C76 30 62 16 38 16 Z" fill="white" />
              <path d="M30 24 L30 76 L38 76 C56 76 67 65 67 50 C67 35 56 24 38 24 Z" fill="#0c0c10" />
              <path d="M36 30 L36 70 L40 70 C54 70 62 62 62 50 C62 38 54 30 40 30 Z" fill="white" />
              <path d="M42 36 L42 64 C52 62 57 57 57 50 C57 43 52 38 42 36 Z" fill="#0c0c10" />
              <polygon points="46,62 53,44 60,62" fill="white" />
              <polygon points="42,62 48,50 54,62" fill="white" />
            </svg>
          </div>

          <div style={{ marginTop: 80 }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#aaa', fontWeight: 600 }}>MÜŞTERİ DENEYİMİ</div>
            <h1 style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.15, margin: '18px 0 0', letterSpacing: '-.5px' }}>
              İyi işlerin<br />devamı,<br /><span style={{ color: '#9a9a9a' }}>iyi iletişim.</span>
            </h1>
            <p className="an-hide" style={{ fontSize: 12, color: '#ccc', lineHeight: 1.7, marginTop: 28 }}>
              Birlikte üretiyoruz.<br />Birlikte gelişiyoruz.
            </p>
          </div>

          <div className="an-hide" style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[{ n: '01', l: 'Puanlama', s: 1 }, { n: '02', l: 'Görüşünüz', s: 2 }].map(it => {
              const active = step === it.s, done = step > it.s
              return (
                <div key={it.n} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: active || done ? 1 : .55 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active || done ? '#fff' : 'transparent', color: active || done ? '#111' : '#fff', border: `1px solid ${active || done ? '#fff' : '#555'}` }}>
                    {it.n}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{it.l}</span>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Sağ içerik */}
        <main className="an-main">
          <div className="an-box">
            {step !== 3 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '.1em', fontWeight: 700, color: WINE }}>
                  <span>ADIM 0{step} / 02</span>
                  <span style={{ color: '#555', letterSpacing: 0, fontWeight: 400, fontSize: 12 }}>{step === 1 ? 'Puanlama' : 'Görüşünüz'}</span>
                </div>
                <div style={{ height: 3, background: '#e6e6e6', marginTop: 8 }}>
                  <div style={{ height: 3, background: WINE, width: step === 1 ? '50%' : '100%', transition: 'width .3s' }} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: '34px 0 8px', letterSpacing: '-.5px' }}>Deneyiminizi değerlendirin.</h2>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>Her soruya 1–5 arasında bir puan verin.</p>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '0 0 28px' }}>
                  Bu kısa anket, Daydream ile çalışma deneyiminizi anlamamıza ve hizmetimizi geliştirmemize yardımcı olur. Yaklaşık 1 dakikanızı alır.
                </p>

                {QUESTIONS.map((q, i) => {
                  const missing = tried && !scores[q.key]
                  return (
                    <div key={q.key} style={{ marginBottom: 30 }}>
                      <div style={{ fontSize: 13.5, marginBottom: 14 }}>
                        <span style={{ fontSize: 10, color: '#888', marginRight: 10 }}>0{i + 1}</span>
                        {q.text} <span style={{ color: WINE }}>*</span>
                      </div>
                      <div className="an-sc">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" className={scores[q.key] === n ? 'on' : ''}
                            onClick={() => setScores(s => ({ ...s, [q.key]: n }))}>{n}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#777', marginTop: 8 }}>
                        <span>Hiç memnun değilim</span><span>Çok memnunum</span>
                      </div>
                      {missing && <div style={{ fontSize: 11, color: '#111', fontWeight: 600, marginTop: 6 }}>Bir puan seçin</div>}
                    </div>
                  )
                })}

                <div style={{ borderTop: '1px solid #e6e6e6', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#777' }}>* Zorunlu sorular</span>
                  <button className="an-btn" onClick={next}>Devam et</button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: '34px 0 8px', letterSpacing: '-.5px' }}>Görüşünüzü paylaşın.</h2>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '0 0 26px' }}>
                  Bu adım isteğe bağlıdır. İsterseniz adınızı yazabilir veya anonim kalabilirsiniz.
                </p>

                <label style={{ fontSize: 12, fontWeight: 600 }}>Ad Soyad (isteğe bağlı)</label>
                <input className="an-inp" style={{ margin: '6px 0 16px' }} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={120} />

                <label style={{ fontSize: 12, fontWeight: 600 }}>Firma / Marka (isteğe bağlı)</label>
                <input className="an-inp" style={{ margin: '6px 0 16px' }} value={company} onChange={e => setCompany(e.target.value)} maxLength={120} />

                <label style={{ fontSize: 12, fontWeight: 600 }}>Eklemek istedikleriniz</label>
                <textarea className="an-inp" style={{ margin: '6px 0 16px', minHeight: 130, resize: 'vertical' }} value={comment}
                  onChange={e => setComment(e.target.value)} maxLength={2000}
                  placeholder="Öneri, eleştiri ya da teşekkür… Ne olursa." />

                {/* honeypot */}
                <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}
                  style={{ position: 'absolute', left: -9999, opacity: 0, height: 0 }} aria-hidden="true" />

                {error && <div style={{ fontSize: 12, color: '#111', fontWeight: 600, marginBottom: 12 }}>{error}</div>}

                <div style={{ borderTop: '1px solid #e6e6e6', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="an-ghost" onClick={() => setStep(1)}>← Geri</button>
                  <button className="an-btn" onClick={submit} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Gönder'}</button>
                </div>
              </>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '90px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: WINE, color: '#fff', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>✓</div>
                <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px' }}>Teşekkürler.</h2>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>Geri bildiriminiz bize ulaştı.<br />Birlikte daha iyi işler üretmeye devam edeceğiz.</p>
              </div>
            )}

            {step !== 3 && (
              <p style={{ fontSize: 10, color: '#777', marginTop: 20 }}>
                Yanıtlarınız Daydream tarafından hizmet deneyimini geliştirmek için değerlendirilir.
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
