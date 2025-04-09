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

    const { name, coordinates } = body

    if (!name || !coordinates) {
      console.log("Invalid data:", { name, coordinates })
      return new NextResponse("Missing name or coordinates", { status: 400 })
    }
    
    const deadzone = await prisma.deadzone.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name
        }
      },
      update: {
        coordinates
      },
      create: {
        userId: session.user.id,
        name,
        coordinates
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