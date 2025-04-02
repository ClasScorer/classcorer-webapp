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

    const bonusConfig = await prisma.bonusConfig.findUnique({
      where: { userId: session.user.id },
    })

    if (!bonusConfig) {
      // Create default configuration if none exists
      const defaultConfig = await prisma.bonusConfig.create({
        data: {
          userId: session.user.id,
          enableThreeStreak: true,
          threeStreakBonus: 10,
          enableFiveStreak: true,
          fiveStreakBonus: 20,
          constantEngagementBonus: 20,
        },
      })
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(bonusConfig)
  } catch (error) {
    console.error("[BONUS_CONFIG_GET]", error)
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
    const {
      enableThreeStreak,
      threeStreakBonus,
      enableFiveStreak,
      fiveStreakBonus,
      constantEngagementBonus,
    } = body

    const bonusConfig = await prisma.bonusConfig.upsert({
      where: { userId: session.user.id },
      update: {
        enableThreeStreak,
        threeStreakBonus,
        enableFiveStreak,
        fiveStreakBonus,
        constantEngagementBonus,
      },
      create: {
        userId: session.user.id,
        enableThreeStreak,
        threeStreakBonus,
        enableFiveStreak,
        fiveStreakBonus,
        constantEngagementBonus,
      },
    })

    return NextResponse.json(bonusConfig)
  } catch (error) {
    console.error("[BONUS_CONFIG_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 