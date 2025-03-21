import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Return detailed information about the session
    return NextResponse.json({
      hasSession: !!session,
      sessionObject: session,
      user: session?.user,
      userId: session?.user?.id,
      decodedToken: null, // We don't have access to the raw token server-side
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL?.substring(0, 10) + "..." // Don't show the full URL for security
      }
    });
  } catch (error) {
    console.error("[DEBUG_SESSION_ERROR]", error);
    return NextResponse.json({ error: "Error debugging session", details: String(error) }, { status: 500 });
  }
} 