import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validatePointValue } from '@/lib/utils/student-actions';

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
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

    const { studentId } = params;
    const body = await req.json();
    const { lectureId, points, actionType, reason, timestamp } = body;

    // Basic validation
    if (!lectureId || points === undefined || !actionType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: lectureId, points, actionType, reason' },
        { status: 400 }
      );
    }

    // Validate points
    const pointValidation = validatePointValue(points, actionType);
    if (!pointValidation.isValid) {
      return NextResponse.json(
        { error: pointValidation.error },
        { status: 400 }
      );
    }

    // Verify the student exists and belongs to the authenticated user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        name: true, 
        professorId: true,
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this student' },
        { status: 403 }
      );
    }

    // Verify the lecture exists and belongs to the authenticated user
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

    // Verify the student is enrolled in the lecture's course
    const isEnrolled = student.enrollments.some(enrollment => 
      enrollment.course.id === lecture.courseId
    );
    
    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this course' },
        { status: 400 }
      );
    }

    // Get or create scoring configuration for the course
    const scoringConfig = await prisma.scoringConfig.findFirst({
      where: { 
        userId: session.user.id
      }
    });

    const basePoints = scoringConfig?.participationPoints || 5;

    // Create the student action record
    const action = await prisma.studentAction.create({
      data: {
        type: actionType === 'award' ? 'score_award' : 'score_deduct',
        studentId,
        lectureId,
        points,
        reason,
        details: {
          basePoints,
          finalPoints: points,
          actionType,
          timestamp: timestamp || new Date().toISOString(),
          manual: true
        },
        instructorId: session.user.id,
        status: 'completed'
      },
      include: {
        student: {
          select: { name: true, email: true }
        },
        lecture: {
          select: { title: true, date: true }
        }
      }
    });

    // Update student's currentScore
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { currentScore: true }
    });
    
    const newCurrentScore = Math.max(0, (currentStudent?.currentScore || 0) + points);
    
    await prisma.student.update({
      where: { id: studentId },
      data: { currentScore: newCurrentScore }
    });

    // Update student engagement record if it exists
    const existingEngagement = await prisma.studentEngagement.findFirst({
      where: {
        studentId,
        lectureId
      }
    });

    if (existingEngagement) {
      // Update existing engagement record
      const newScore = Math.max(0, existingEngagement.engagementScore + points);
      
      await prisma.studentEngagement.update({
        where: { id: existingEngagement.id },
        data: {
          engagementScore: newScore,
          lastUpdated: new Date(),
          // Increment participation if points are positive
          participationCount: points > 0 ? 
            existingEngagement.participationCount + 1 : 
            existingEngagement.participationCount
        }
      });
    } else {
      // Create new engagement record
      await prisma.studentEngagement.create({
        data: {
          studentId,
          lectureId,
          engagementScore: Math.max(0, points),
          participationCount: points > 0 ? 1 : 0,
          attentionScore: 50, // Default attention score
          lastUpdated: new Date()
        }
      });
    }

    // Get updated student statistics
    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        engagements: {
          where: { lectureId },
          select: { engagementScore: true, participationCount: true }
        },
        _count: {
          select: {
            actions: {
              where: { 
                lectureId,
                type: { in: ['score_award', 'score_deduct'] }
              }
            }
          }
        }
      }
    });

    console.log(`Score ${actionType}: ${points} points ${actionType === 'award' ? 'awarded to' : 'deducted from'} ${student.name} in lecture ${lectureId}`);

    return NextResponse.json({
      success: true,
      action: {
        id: action.id,
        type: action.type,
        points: action.points,
        reason: action.reason,
        timestamp: action.timestamp,
        student: action.student,
        lecture: action.lecture
      },
      student: {
        id: updatedStudent?.id,
        name: updatedStudent?.name,
        currentEngagement: updatedStudent?.engagements[0] || null,
        totalActions: updatedStudent?._count.actions || 0
      },
      message: `Successfully ${actionType === 'award' ? 'awarded' : 'deducted'} ${Math.abs(points)} points`
    });

  } catch (error) {
    console.error('Error in score management:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 