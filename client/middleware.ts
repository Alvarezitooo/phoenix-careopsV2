import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes publiques qui n'ont pas besoin d'authentification
const PUBLIC_ROUTES = ['/login', '/', '/signup', '/soutenir'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware - Pathname:', pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          if (name.startsWith('sb-')) {
            console.log('🍪 Cookie get:', name, value ? 'présent' : 'absent');
          }
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('👤 Middleware - User:', user?.id || 'null');
  if (error) console.log('❌ Middleware - Error:', error.message);

  // Si l'utilisateur est authentifié
  if (user) {
    // S'il essaie d'aller sur login/signup, on le redirige vers le dashboard
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    // Routes protégées: tout ce qui commence par /chat, /dashboard
    if (pathname.startsWith('/chat') || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

// Configuration du matcher pour spécifier quelles routes sont concernées par le middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}