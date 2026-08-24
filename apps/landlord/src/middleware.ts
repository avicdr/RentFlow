import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public paths, Next.js internals, and API routes
  if (
    PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('rf_landlord_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    if (path !== '/') loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Verify role is landlord-eligible
    const role = payload.role as string | undefined;
    if (!role || !['LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN'].includes(role)) {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('rf_landlord_token');
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.sub as string);
    res.headers.set('x-user-role', role);
    return res;
  } catch {
    // Token is invalid or expired — clear cookie and redirect
    const loginUrl = new URL('/login', req.url);
    if (path !== '/') loginUrl.searchParams.set('next', path);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('rf_landlord_token');
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
