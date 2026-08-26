import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/register', '/forgot-password', '/reset-password', '/verify', '/rentpass/view'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (
    PUBLIC.some((p) => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('rf_tenant_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    if (path !== '/') loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as string | undefined;
    if (!role || role !== 'TENANT') {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('rf_tenant_token');
      return res;
    }

    return NextResponse.next();
  } catch {
    // Token is invalid or expired
    const loginUrl = new URL('/login', req.url);
    if (path !== '/') loginUrl.searchParams.set('next', path);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('rf_tenant_token');
    return res;
  }
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
