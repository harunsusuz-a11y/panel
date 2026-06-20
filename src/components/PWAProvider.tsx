'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray.buffer
}

// Bildirim sesi - Web Audio API ile üret (dosya gerekmez)
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const times = [[0, 880], [0.1, 1100], [0.2, 880]]
    times.forEach(([when, freq]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime + when)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.15)
      osc.start(ctx.currentTime + when)
      osc.stop(ctx.currentTime + when + 0.15)
    })
  } catch {}
}

export default function PWAProvider() {
  const prevCount = useRef(0)

  useEffect(() => {
    // Masaüstü install prompt'unu yakala ve sakla
    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as any).__pwaInstallPrompt = e
    }
    window.addEventListener('beforeinstallprompt', handler)

    // 1. Service Worker kaydet
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(async reg => {
        // 2. Push izni iste ve subscribe ol
        if (!('PushManager' in window)) return
        if (!VAPID_PUBLIC_KEY) return

        let perm = Notification.permission
        if (perm === 'default') {
          perm = await Notification.requestPermission()
        }
        if (perm !== 'granted') return

        // Mevcut subscription var mı?
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })
        }

        // Sunucuya kaydet
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() })
        })
      })
      .catch(err => console.warn('SW registration failed:', err))

    return () => { window.removeEventListener('beforeinstallprompt', handler) }

    // 3. Realtime bildirimleri dinle + ses çal
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const ch = sb.channel(`pwa-notif-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          playNotifSound()
        })
        .subscribe()

      return () => { sb.removeChannel(ch) }
    })
  }, [])

  return null
}
