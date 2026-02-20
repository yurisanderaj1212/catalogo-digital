import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Rutas protegidas del admin (excepto login)
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = req.nextUrl.pathname === '/admin/login';

  // Si es ruta de admin (no login), verificar autenticación en el cliente
  // El middleware solo redirige, la verificación real se hace en el layout
  if (isAdminRoute && !isLoginRoute) {
    // Permitir acceso, el layout verificará la sesión
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
