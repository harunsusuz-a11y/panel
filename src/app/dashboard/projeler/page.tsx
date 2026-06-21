'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjelerRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/musteriler')
  }, [router])
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--tx3)', fontSize: 13 }}>
      Projeler → Müşteriler sayfasına yönlendiriliyor...
    </div>
  )
}
