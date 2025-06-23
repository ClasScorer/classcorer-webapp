import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processStudentGamification } from '@/lib/services/gamification';

export async function POST(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lectureId } = params;
    const body = await req.json();
    const { studentId, attentionStatus, handRaised } = body;

    // Validate required fields
    if (!studentId || !attentionStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, attentionStatus' },
        { status: 400 }
      );
    }

    // Verify lecture exists and belongs to the user
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: { instructorId: true }
        }
      }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    if (lecture.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to lecture' },
        { status: 403 }
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        name: true,
        enrollments: {
          include: { course: true }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify student is enrolled in the course
    const isEnrolled = student.enrollments.some(enrollment => 
      enrollment.course.id === lecture.courseId
    );

    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this course' },
        { status: 400 }
      );
    }

    // Process gamification
    const result = await processStudentGamification(
      studentId,
      lectureId,
      session.user.id,
      attentionStatus,
      handRaised || false
    );

    // Log the gamification event
    console.log(`Gamification processed for student ${student.name}: ${result.pointsAwarded} points awarded, ${result.bonusAwarded} bonus points`);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name
      },
      lecture: {
        id: lecture.id,
        title: lecture.title
      },
      gamification: {
        pointsAwarded: result.pointsAwarded,
        bonusAwarded: result.bonusAwarded,
        totalAwarded: result.pointsAwarded + result.bonusAwarded,
        messages: result.messages
      }
    });

  } catch (error) {
    console.error('Error in gamification processing:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch process gamification for multiple students
export async function PUT(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lectureId } = params;
    const body = await req.json();
    const { studentData } = body; // Array of { studentId, attentionStatus, handRaised }

    if (!Array.isArray(studentData) || studentData.length === 0) {
      return NextResponse.json(
        { error: 'studentData must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify lecture exists and belongs to the user
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: { instructorId: true }
        }
      }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    if (lecture.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to lecture' },
        { status: 403 }
      );
    }

    const results = [];

    // Process each student's gamification
    for (const data of studentData) {
      if (!data.studentId || !data.attentionStatus) {
        console.warn('Skipping invalid student data:', data);
        continue;
      }

      try {
        const result = await processStudentGamification(
          data.studentId,
          lectureId,
          session.user.id,
          data.attentionStatus,
          data.handRaised || false
        );

        results.push({
          studentId: data.studentId,
          success: true,
          pointsAwarded: result.pointsAwarded,
          bonusAwarded: result.bonusAwarded,
          messages: result.messages
        });

      } catch (error) {
        console.error(`Error processing gamification for student ${data.studentId}:`, error);
        results.push({
          studentId: data.studentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      lecture: {
        id: lecture.id,
        title: lecture.title
      },
      processed: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      summary: {
        totalPointsAwarded: successful.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
        totalBonusAwarded: successful.reduce((sum, r) => sum + (r.bonusAwarded || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error in batch gamification processing:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 