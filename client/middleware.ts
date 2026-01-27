import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Si l'utilisateur est connecté et essaie d'accéder à /login ou /signup, on le redirige vers la page d'accueil.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si l'utilisateur n'est PAS connecté, le matcher garantit que cette page est protégée,
  // donc on le redirige vers la page de connexion.
  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response
}

// Le middleware ne s'appliquera qu'aux routes listées ici.
// Les pages publiques (accueil, cgu, etc.) ne seront pas affectées.
export const config = {
  matcher: [
    // Routes protégées
    '/guide/:path*',
    '/journal/:path*',
    '/decodeur/:path*',
    '/fragments/:path*',
    
    // Routes d'authentification (pour la logique de redirection si l'utilisateur est déjà connecté)
    '/login',
    '/signup',
  ],
}
