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
    
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            name: true,
            email: true,
          },
        },
        students: true,
      },
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 })
  }
} 