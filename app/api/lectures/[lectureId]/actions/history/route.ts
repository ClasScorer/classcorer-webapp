import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { StudentActionType } from '@/types/student-actions';

interface ActionHistoryQueryParams {
  actionType?: StudentActionType;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const lectureId = params.lectureId;
    
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams: ActionHistoryQueryParams = {
      actionType: url.searchParams.get('actionType') as StudentActionType | undefined,
      studentId: url.searchParams.get('studentId') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    };
    
    // Build the query filter
    const filter: any = {
      lectureId,
    };
    
    if (queryParams.actionType) {
      filter.type = queryParams.actionType;
    }
    
    if (queryParams.studentId) {
      filter.studentId = queryParams.studentId;
    }
    
    if (queryParams.startDate) {
      filter.createdAt = {
        ...filter.createdAt,
        gte: new Date(queryParams.startDate),
      };
    }
    
    if (queryParams.endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        lte: new Date(queryParams.endDate),
      };
    }
    
    // Determine limit
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;
    
    // Fetch actions with student data
    const actions = await prisma.studentAction.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Transform data for the response
    const formattedActions = actions.map(action => ({
      id: action.id,
      actionType: action.type,
      studentId: action.studentId,
      studentName: action.student.name,
      timestamp: action.createdAt.toISOString(),
      details: action.details,
      status: action.status,
    }));
    
    return NextResponse.json(formattedActions);
  } catch (error) {
    console.error('Error fetching action history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action history' },
      { status: 500 }
    );
  }
}

// Add new endpoint to clear history if needed
export async function DELETE(
  request: Request,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const lectureId = params.lectureId;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify lecture belongs to user
    const lecture = await prisma.lecture.findFirst({
      where: {
        id: lectureId,
        course: {
          instructorId: user.id,
        },
      },
    });
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found or not authorized' }, { status: 404 });
    }
    
    // Parse query parameters for selective deletion
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const actionType = url.searchParams.get('actionType') as StudentActionType | undefined;
    
    // Build delete filter
    const filter: any = {
      lectureId,
    };
    
    if (studentId) {
      filter.studentId = studentId;
    }
    
    if (actionType) {
      filter.type = actionType;
    }
    
    // Delete matching actions
    const result = await prisma.studentAction.deleteMany({
      where: filter,
    });
    
    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('Error deleting action history:', error);
    return NextResponse.json(
      { error: 'Failed to delete action history' },
      { status: 500 }
    );
  }
} 