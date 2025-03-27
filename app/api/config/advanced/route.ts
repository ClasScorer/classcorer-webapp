import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const config = await prisma.advancedConfig.findUnique({
      where: { userId: session.user.id }
    })

    if (!config) {
      // Create default config if it doesn't exist
      const defaultConfig = await prisma.advancedConfig.create({
        data: {
          userId: session.user.id,
          enableDeadzones: false,
          enableCustomScoring: false,
          customScoringRules: {},
          enableAnalytics: true,
          enableNotifications: true,
          notificationPreferences: {
            email: true,
            push: true,
            inApp: true
          }
        }
      })
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("[ADVANCED_CONFIG_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const config = await prisma.advancedConfig.upsert({
      where: { userId: session.user.id },
      update: body,
      create: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("[ADVANCED_CONFIG_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 