// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Check for token in cookies (if using cookies) or let client-side handle it
  // Since we're using localStorage, we can't access it in middleware
  // So we only block if explicitly needed, otherwise let client-side handle auth
  
  // Redirect root to login
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // For protected routes, let client-side handle authentication
  // Middleware can't access localStorage, so we allow through
  // The layout components will handle redirects if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/student/:path*',
    '/faculty/:path*',
    '/hod/:path*'
  ],
};

