import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWAProvider from '@/components/PWAProvider'

export const metadata: Metadata = {
  title: 'Daydream Production',
  description: 'Agency Operasyon Paneli',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daydream',
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#7c6af7',
    'msapplication-tap-highlight': 'no',
  }
}

export const viewport: Viewport = {
  themeColor: '#7c6af7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-title" content="Daydream" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('daydream-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })();
        ` }} />
        <PWAProvider />
        {children}
      </body>
    </html>
  )
}
