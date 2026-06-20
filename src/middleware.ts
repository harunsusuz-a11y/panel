import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Daydream erişim matrisi
// admin   = Emir    → her şey
// manager = Mert    → operasyon hariç yaratıcı kararlar, finans dahil
// member  = Aslı, Gizem, Yasin, Caner, Batuhan&Kerem → kısıtlı

const ADMIN_ONLY = [
  '/dashboard/kullanicilar',
]

const MANAGER_PLUS = [
  '/dashboard/operasyon',
  '/dashboard/gecikmeler',
  '/dashboard/performans',
  '/dashboard/finans',
  '/dashboard/muhasebe',
  '/dashboard/otomasyonlar',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Login sayfasına oturum açık kullanıcı gelirse dashboard'a yönlendir
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

  // Sadece dashboard sayfaları kontrol et
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

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
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'member'

    // Admin (Emir) → her şeye erişim
    if (role === 'admin') return response

    // Admin-only sayfalar
    if (ADMIN_ONLY.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Manager (Mert) → admin-only hariç her şey
    if (role === 'manager') return response

    // Member → kısıtlı erişim
    if (MANAGER_PLUS.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

  } catch {
    // Hata durumunda geç
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
