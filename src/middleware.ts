import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_ONLY = [
  '/dashboard/kullanicilar',
  '/dashboard/araclar',
]

const MUHASEBE_ALLOWED = [
  '/dashboard/finans',
  '/dashboard/muhasebe',
  '/dashboard/gorevler',
  '/dashboard/ayarlar',
  '/dashboard/notlar',
]

const MANAGER_PLUS = [
  '/dashboard/musteriler',
  '/dashboard/operasyon',
  '/dashboard/gecikmeler',
  '/dashboard/performans',
  '/dashboard/otomasyonlar',
  '/dashboard/destek',
  '/dashboard/toplanti',
  '/dashboard/sablonlar',
]

const MEMBER_ALLOWED = [
  '/dashboard/gorevler',
  '/dashboard/takvim',
  '/dashboard/icerik',
  '/dashboard/onay',
  '/dashboard/ayarlar',
  '/dashboard/dokumantasyon',
  '/dashboard/notlar',
  '/dashboard',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/login' || pathname === '/') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return request.cookies.getAll() }, setAll() {} } }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {}
    return NextResponse.next()
  }

  if (pathname.startsWith('/portal')) return NextResponse.next()
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()

  const response = NextResponse.next({ request: { headers: request.headers } })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'member'

    if (role === 'admin') return response

    if (role === 'muhasebe') {
      const allowed = MUHASEBE_ALLOWED.some(p => pathname.startsWith(p))
      if (!allowed) return NextResponse.redirect(new URL('/dashboard/finans', request.url))
      return response
    }

    if (ADMIN_ONLY.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (role === 'manager') return response

    // Member kontrolü — MANAGER_PLUS sayfaları da engellenir
    if (MANAGER_PLUS.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const allowed = MEMBER_ALLOWED.some(p =>
      p === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(p)
    )

    if (!allowed) return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch {}

  return response
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}


