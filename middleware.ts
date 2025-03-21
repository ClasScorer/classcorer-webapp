import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check user token
    const token = req.nextauth.token;
    console.log("Middleware - checking auth for:", req.nextUrl.pathname);
    console.log("Middleware - token present:", !!token);
    
    // Handle protected routes
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      // If no token or no user ID in token, redirect to login
      if (!token || !token.id) {
        console.log("Middleware - Auth failed, redirecting to login");
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    
    // Allow access to the protected route
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This ensures the middleware function runs for the paths in matcher
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/courses/:path*",
    "/api/students/:path*",
    "/api/lectures/:path*"
  ],
}; 