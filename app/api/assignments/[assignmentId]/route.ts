import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssignmentType } from '@prisma/client';

interface RouteParams {
  params: {
    assignmentId: string;
  };
}

// GET - Fetch a specific assignment
export async function GET(request: Request, { params }: RouteParams) {
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

    // Fetch assignment with full details
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
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
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or you do not have permission to view it' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT - Update an assignment
export async function PUT(request: Request, { params }: RouteParams) {
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

    // Verify the assignment exists and user has permission
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
        course: {
          instructorId: user.id
        }
      }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    // If courseId is being changed, verify the new course exists and user owns it
    if (courseId && courseId !== existingAssignment.courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId: user.id
        }
      });

      if (!course) {
        return NextResponse.json(
          { error: 'Target course not found or you do not have permission to move assignments to this course' },
          { status: 404 }
        );
      }
    }

    // Validate assignment type if provided
    if (assignmentType) {
      const validTypes = Object.values(AssignmentType);
      if (!validTypes.includes(assignmentType as AssignmentType)) {
        return NextResponse.json(
          { error: `Invalid assignment type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.assignmentId },
      data: {
        title: title || existingAssignment.title,
        description: description !== undefined ? description : existingAssignment.description,
        dueDate: dueDate ? new Date(dueDate) : existingAssignment.dueDate,
        pointsPossible: pointsPossible !== undefined ? pointsPossible : existingAssignment.pointsPossible,
        weight: weight !== undefined ? weight : existingAssignment.weight,
        assignmentType: (assignmentType as AssignmentType) || existingAssignment.assignmentType,
        courseId: courseId || existingAssignment.courseId
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

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an assignment
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Verify the assignment exists and user has permission
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: params.assignmentId,
        course: {
          instructorId: user.id
        }
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Check if there are submissions and warn (but still allow deletion)
    if (existingAssignment._count.submissions > 0) {
      console.warn(
        `Deleting assignment ${params.assignmentId} which has ${existingAssignment._count.submissions} submissions`
      );
    }

    // Delete assignment (cascade will handle submissions)
    await prisma.assignment.delete({
      where: { id: params.assignmentId }
    });

    return NextResponse.json(
      { message: 'Assignment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
} 