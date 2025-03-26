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

    const deadzones = await prisma.deadzone.findMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json(deadzones)
  } catch (error) {
    console.error("[DEADZONES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const deadzone = await prisma.deadzone.create({
      data: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(deadzone)
  } catch (error) {
    console.error("[DEADZONES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("Deadzone ID is required", { status: 400 })
    }

    await prisma.deadzone.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DEADZONES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 