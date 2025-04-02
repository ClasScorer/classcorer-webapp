import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const config = await prisma.thresholdConfig.findUnique({
      where: { userId: session.user.id }
    })

    if (!config) {
      // Create default config if it doesn't exist
      const defaultConfig = await prisma.thresholdConfig.create({
        data: {
          userId: session.user.id,
          attendanceThreshold: 70,
          engagementThreshold: 60,
          atRiskThreshold: 60,
          maxScoreThreshold: 100,
          minScoreThreshold: 0,
        }
      })
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("[THRESHOLD_CONFIG_GET]", error)
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
    const config = await prisma.thresholdConfig.upsert({
      where: { userId: session.user.id },
      update: body,
      create: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("[THRESHOLD_CONFIG_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 