import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/unauthorized'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC.some(p => path.startsWith(p)) || path.startsWith('/_next') || path.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('rf_admin_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.sub as string);
    res.headers.set('x-user-role', payload.role as string);
    return res;
  } catch {
    return NextResponse.redirect(new URL('/login?expired=1', req.url));
  }
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
