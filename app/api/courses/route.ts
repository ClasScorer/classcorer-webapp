import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { z } from 'zod'

// Course validation schema
const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  credits: z.number().min(0).default(3),
})

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get courses for the current instructor
    const courses = await prisma.course.findMany({
      where: { 
        instructorId: session.user.id 
      },
      include: {
        instructor: {
          select: {
            name: true,
            email: true,
          },
        },
        students: true,
        lectures: true,
        assignments: true,
        announcements: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('[COURSES_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = courseSchema.parse(body)

    // Create new course
    const course = await prisma.course.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        credits: validatedData.credits,
        instructor: {
          connect: { id: session.user.id }
        }
      },
      include: {
        instructor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[COURSES_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 