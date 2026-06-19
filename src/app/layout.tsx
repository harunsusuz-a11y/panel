import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Agency ERP', description: 'Ajans Yönetim Sistemi' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>
}
