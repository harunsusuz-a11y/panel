import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Geri Bildirim — Daydream',
  description: 'Daydream ile çalışma deneyiminizi değerlendirin.',
  robots: { index: false, follow: false },
}

export default function AnketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
