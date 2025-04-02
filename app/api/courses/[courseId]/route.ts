import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
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

    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 