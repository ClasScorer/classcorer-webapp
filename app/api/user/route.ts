import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

export async function GET() {
  try {
    // Get authenticated user from session
    const session = await getServerSession(authOptions)
    
    console.log('User API - Auth session check:', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'not available',
      email: session?.user?.email || 'not available'
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: No user session or missing ID' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        department: true,
        timezone: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_GET]", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 