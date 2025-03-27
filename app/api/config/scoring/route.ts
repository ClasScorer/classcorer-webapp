import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
    import prisma from "@/app/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const config = await prisma.scoringConfig.findUnique({
      where: { userId: session.user.id }
    })

    if (!config) {
      // Create default config if it doesn't exist
      const defaultConfig = await prisma.scoringConfig.create({
        data: {
          userId: session.user.id,
          participationScore: 5,
          engagementScore: 5,
          attendanceScore: 5,
          answerScore: 15,
          talkingBadScore: -10,
          attendanceBadScore: -10,
          repeatedBadScore: -20,
        }
      })
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("[SCORING_CONFIG_GET]", error)
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
    const config = await prisma.scoringConfig.upsert({
      where: { userId: session.user.id },
      update: body,
      create: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("[SCORING_CONFIG_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 