'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EntegrasyonlarPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/ayarlar') }, [router])
  return null
}
