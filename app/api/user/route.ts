import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // For now, get the first user as current user
    // In a real app, this would use the session
    const user = await prisma.user.findFirst({
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
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 