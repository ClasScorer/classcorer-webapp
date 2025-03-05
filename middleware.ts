import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for a protected route
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/api') && 
    !pathname.startsWith('/api/auth') && 
    !pathname.startsWith('/api/register') &&
    !pathname.startsWith('/api/login') &&
    !pathname.startsWith('/api/signup');
  
  // Public routes that don't require authentication
  const isPublicRoute = 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/';
  
  // Check if the user is authenticated by looking for the authToken cookie
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthenticated = !!authToken;
  
  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect authenticated users away from login/register pages
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 