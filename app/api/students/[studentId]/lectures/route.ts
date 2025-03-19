import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
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
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing studentId parameter' },
        { status: 400 }
      );
    }
    
    // Check if student exists and belongs to the current user (professor)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { professorId: true }
    });
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    if (student.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this student data' },
        { status: 403 }
      );
    }
    
    // Find all lectures this student has attended or has engagement data for
    const attendedLectures = await prisma.attendance.findMany({
      where: { studentId },
      select: { lectureId: true }
    });
    
    const engagementLectures = await prisma.studentEngagement.findMany({
      where: { studentId },
      select: { lectureId: true }
    });
    
    // Combine lecture IDs from both sources
    const allLectureIds = [
      ...new Set([
        ...attendedLectures.map(a => a.lectureId),
        ...engagementLectures.map(e => e.lectureId)
      ])
    ];
    
    // Fetch details for all these lectures
    const lectures = await prisma.lecture.findMany({
      where: { id: { in: allLectureIds } },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        duration: true,
        courseId: true,
        course: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    return NextResponse.json(lectures);
    
  } catch (error) {
    console.error('Error fetching lectures for student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lecture data' },
      { status: 500 }
    );
  }
} 