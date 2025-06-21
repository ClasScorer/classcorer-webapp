import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lectureId } = params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const actionType = url.searchParams.get('type');

    // Verify the lecture belongs to the authenticated user
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: { professorId: true }
        }
      }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    if (lecture.course.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this lecture' },
        { status: 403 }
      );
    }

    // Build query filters
    const whereClause: any = { lectureId };
    if (actionType) {
      whereClause.type = actionType;
    }

    // Get actions with pagination
    const actions = await prisma.studentAction.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        instructor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.studentAction.count({
      where: whereClause
    });

    // Get summary statistics
    const summary = await prisma.studentAction.groupBy({
      by: ['type'],
      where: { lectureId },
      _count: {
        id: true
      }
    });

    const summaryStats = summary.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      actions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: summaryStats
    });

  } catch (error) {
    console.error('Error fetching lecture actions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lectureId } = params;
    const body = await req.json();
    const { action, studentId, details, timestamp } = body;

    // Basic validation
    if (!action || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, studentId' },
        { status: 400 }
      );
    }

    // Verify the lecture belongs to the authenticated user
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: { professorId: true }
        }
      }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    if (lecture.course.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this lecture' },
        { status: 403 }
      );
    }

    // Verify the student exists and belongs to the course
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        name: true, 
        courseId: true,
        professorId: true 
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.courseId !== lecture.courseId) {
      return NextResponse.json(
        { error: 'Student does not belong to this course' },
        { status: 400 }
      );
    }

    if (student.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this student' },
        { status: 403 }
      );
    }

    // Create the action log
    const actionLog = await prisma.studentAction.create({
      data: {
        type: action,
        studentId,
        lectureId,
        details: details || {},
        instructorId: session.user.id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status: 'completed'
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        instructor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log(`Action logged: ${action} for student ${student.name} in lecture ${lectureId}`);

    return NextResponse.json({
      success: true,
      action: actionLog,
      message: `Action ${action} logged successfully`
    });

  } catch (error) {
    console.error('Error logging lecture action:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 