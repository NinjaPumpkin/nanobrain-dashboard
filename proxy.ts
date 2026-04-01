import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('nb-session');
  const { pathname } = request.nextUrl;

  // Allow auth endpoint through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow login page through
  if (pathname === '/login') {
    // If already authenticated, redirect to home
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
