import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Daydream Erişim Matrisi ──────────────────────────────
// admin   → her şey
// manager → ADMIN_ONLY hariç her şey
// member  → yalnızca MEMBER_ALLOWED

const ADMIN_ONLY = [
  '/dashboard/kullanicilar',
  '/dashboard/finans',
  '/dashboard/muhasebe',
]

const MANAGER_PLUS = [
  '/dashboard/musteriler',
  '/dashboard/operasyon',
  '/dashboard/gecikmeler',
  '/dashboard/performans',
  '/dashboard/otomasyonlar',
  '/dashboard/destek',
]

// Member'ların erişebildiği tam liste
const MEMBER_ALLOWED = [
  '/dashboard/gorevler',
  '/dashboard/takvim',
  '/dashboard/icerik',
  '/dashboard/onay',
  '/dashboard/ayarlar',
  '/dashboard/dokumantasyon',
  '/dashboard',          // sadece /dashboard (dashboard ana sayfa)
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Login / kök → oturum açıksa dashboard'a
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

  // Portal sayfası → auth gerekmez, geç
  if (pathname.startsWith('/portal')) {
    return NextResponse.next()
  }

  // Dashboard dışı → geç
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

    // Oturum kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Rol çek
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'member'

    // Admin → kısıtsız
    if (role === 'admin') return response

    // Admin-only sayfalar
    if (ADMIN_ONLY.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Manager → admin-only dışında kısıtsız
    if (role === 'manager') return response

    // Member → sadece izin verilen sayfalara
    const allowed = MEMBER_ALLOWED.some(p =>
      p === '/dashboard'
        ? pathname === '/dashboard'          // tam eşleşme
        : pathname.startsWith(p)
    )

    if (!allowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

  } catch {
    // Hata → geç (login sayfasında sonsuz döngü engeli)
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
