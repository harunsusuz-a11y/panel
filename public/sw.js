const CACHE = 'daydream-v1'
const OFFLINE_URLS = ['/dashboard', '/login']

// Install - cache temel sayfalar
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS).catch(() => {}))
  )
})

// Activate - eski cache temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch - network first, cache fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (!e.request.url.startsWith(self.location.origin)) return
  if (e.request.url.includes('/api/')) return
  if (e.request.url.includes('supabase')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// Push bildirim al
self.addEventListener('push', e => {
  if (!e.data) return
  
  let data = {}
  try { data = e.data.json() } catch { data = { title: 'Daydream', body: e.data.text() } }

  const options = {
    body:    data.body    || 'Yeni bir bildirim var',
    icon:    data.icon    || '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag:     data.tag     || 'daydream-notif',
    renotify: true,
    data: {
      url:  data.url  || '/dashboard',
      type: data.type || 'general'
    },
    actions: data.actions || [
      { action: 'open',    title: 'Aç'     },
      { action: 'dismiss', title: 'Kapat'  },
    ]
  }

  e.waitUntil(
    self.registration.showNotification(data.title || 'Daydream Production', options)
  )
})

// Bildirime tıklanınca
self.addEventListener('notificationclick', e => {
  e.notification.close()
  
  if (e.action === 'dismiss') return

  const url = e.notification.data?.url || '/dashboard'
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Açık sekme varsa ona git
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Yoksa yeni sekme aç
      return clients.openWindow(url)
    })
  )
})

// Subscription güncelleme
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.vapidPublicKey
    })
  )
})
