import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/app')) {
    const session = req.cookies.get('session')?.value;
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

// ✅ Ne cible que les routes d'app — n'impacte pas _next/, favicon, etc.
export const config = {
  matcher: ['/app/:path*'],
};
