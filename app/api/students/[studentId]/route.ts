import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const include = request.nextUrl.searchParams.get('include');

    // If include=all is specified, include all relations
    const includeRelations = include === 'all' ? {
      enrollments: {
        include: {
          course: true
        }
      },
      submissions: {
        include: {
          assignment: true
        }
      },
      attendances: true,
      engagements: true,
      badges: {
        include: {
          badge: true
        }
      }
    } : undefined;

    const student = await prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: includeRelations
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
} 