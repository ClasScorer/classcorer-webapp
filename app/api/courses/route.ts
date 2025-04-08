import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all courses with instructor data
    const courses = await prisma.course.findMany({
      where: {
        instructorId: session.user.id
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        },
        assignments: {
          include: {
            submissions: true
          }
        },
        lectures: {
          include: {
            attendances: true
          }
        }
      }
    });

    // Transform the courses data to include totalStudents and other computed fields
    const transformedCourses = courses.map(course => {
      const totalStudents = course.students?.length || 0;
      
      // Calculate week number based on start date
      const week = course.startDate 
        ? Math.ceil(Math.abs(new Date().getTime() - new Date(course.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 1;
      
      // Calculate progress based on start and end dates
      let progress = 0;
      if (course.startDate && course.endDate) {
        const start = new Date(course.startDate).getTime();
        const end = new Date(course.endDate).getTime();
        const now = new Date().getTime();
        
        if (now <= start) progress = 0;
        else if (now >= end) progress = 100;
        else {
          const totalDuration = end - start;
          const elapsed = now - start;
          progress = Math.round((elapsed / totalDuration) * 100);
        }
      }

      return {
        ...course,
        totalStudents,
        week,
        progress,
        status: progress === 100 ? 'Completed' : progress > 0 ? 'Active' : 'Upcoming'
      };
    });

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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