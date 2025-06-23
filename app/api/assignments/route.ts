import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssignmentType } from '@prisma/client';

// GET - Fetch all assignments for the authenticated user's courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch assignments for all courses taught by this user
    const assignments = await prisma.assignment.findMany({
      where: {
        course: {
          instructorId: user.id
        }
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            canvasCourseId: true
          }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST - Create a new assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      pointsPossible,
      weight,
      assignmentType,
      courseId
    } = body;

    // Validate required fields
    if (!title || !dueDate || !courseId || !assignmentType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, dueDate, courseId, and assignmentType are required' },
        { status: 400 }
      );
    }

    // Verify the user owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: user.id
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to create assignments for this course' },
        { status: 404 }
      );
    }

    // Validate assignment type
    const validTypes = Object.values(AssignmentType);
    if (!validTypes.includes(assignmentType as AssignmentType)) {
      return NextResponse.json(
        { error: `Invalid assignment type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        pointsPossible: pointsPossible || 100,
        weight: weight || 1,
        assignmentType: assignmentType as AssignmentType,
        courseId
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            canvasCourseId: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
} 