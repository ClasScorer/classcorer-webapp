import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get the auth token from the cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('authToken')?.value
    
    if (!authToken) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // In a real app, you would verify the token and get the user ID from it
    // For now, we'll just get the first user
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        department: true,
        joinDate: true,
        timezone: true,
        language: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 