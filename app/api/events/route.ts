import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the auth token from the cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('authToken')?.value
    
    if (!authToken) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const events = await prisma.event.findMany({
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Error fetching events' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Get the auth token from the cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('authToken')?.value
    
    if (!authToken) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { title, date, time, type, description, courseId } = body

    // Validate required fields
    if (!title || !date || !time || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create event with combined date and time
    const eventDateTime = new Date(date)
    const [hours, minutes] = time.split(":")
    eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10))

    const event = await prisma.event.create({
      data: {
        title,
        date: eventDateTime,
        time,
        type,
        description,
        courseId: courseId || null,
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
} 