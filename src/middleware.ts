import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth cookie kontrolü - basit yöntem
  const authCookie = request.cookies.get('sb-pwqfpibzfruqydvskyda-auth-token') ||
                     request.cookies.get('supabase-auth-token') ||
                     request.cookies.getAll().find(c => c.name.includes('auth-token'))

  const isLoggedIn = !!authCookie

  if (!isLoggedIn && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
