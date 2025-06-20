import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
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

    const { courseId } = params;
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const includePhotos = url.searchParams.get('includePhotos') === 'true';

    // Verify the course belongs to the authenticated user
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { professorId: true, name: true }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.professorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access this course' },
        { status: 403 }
      );
    }

    // Build search filters
    const whereClause: any = {
      courseId,
      professorId: session.user.id
    };

    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { id: { contains: searchTerm } }
      ];
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: includePhotos,
        courseId: true,
        createdAt: true,
        // Include engagement summary for context
        engagements: {
          select: {
            engagementScore: true,
            participationCount: true,
            attentionScore: true
          },
          take: 1,
          orderBy: { lastUpdated: 'desc' }
        },
        // Include attendance summary
        attendances: {
          select: {
            status: true
          }
        },
        _count: {
          select: {
            attendances: true,
            engagements: true,
            actions: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Enhance student data with calculated fields
    const enhancedStudents = students.map(student => {
      const attendanceRate = student._count.attendances > 0 
        ? (student.attendances.filter(a => a.status === 'present').length / student._count.attendances) * 100
        : 0;

      const lastEngagement = student.engagements[0];
      
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar || null,
        courseId: student.courseId,
        createdAt: student.createdAt,
        stats: {
          attendanceRate: Math.round(attendanceRate),
          totalLectures: student._count.attendances,
          totalEngagements: student._count.engagements,
          totalActions: student._count.actions,
          lastEngagementScore: lastEngagement?.engagementScore || 0,
          lastParticipationCount: lastEngagement?.participationCount || 0,
          lastAttentionScore: lastEngagement?.attentionScore || 0
        }
      };
    });

    console.log(`Fetched ${enhancedStudents.length} students for course ${courseId}${search ? ` (search: "${search}")` : ''}`);

    return NextResponse.json({
      students: enhancedStudents,
      meta: {
        total: enhancedStudents.length,
        courseId,
        courseName: course.name,
        hasSearch: !!search,
        includePhotos
      }
    });

  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 