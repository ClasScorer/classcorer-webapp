import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { loadStudents } from "@/lib/data"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    // Enhanced logging for auth debugging
    console.log('Students API - Auth session check:', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'not available' 
    });
    
    if (!session?.user) {
      console.error('Authentication failed: No valid session user found');
      return NextResponse.json({ error: 'Unauthorized: No valid session' }, { status: 401 })
    }
    
    if (!session.user.id) {
      console.error('Authentication issue: User ID missing in session');
      return NextResponse.json({ error: 'Unauthorized: User ID missing' }, { status: 401 })
    }
    
    const include = request.nextUrl.searchParams.get('include');
    const courseId = request.nextUrl.searchParams.get('courseId');

    // Base query
    let query: any = {};

    // If courseId is provided, get only students enrolled in that course
    if (courseId) {
      query = {
        enrollments: {
          some: {
            courseId
          }
        }
      };
    }

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
    } : {
      enrollments: true
    };

    const students = await prisma.student.findMany({
      where: query,
      include: includeRelations
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, courseId } = body;

    // Validate required fields
    if (!name || !email || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this email already exists" },
        { status: 400 }
      );
    }

    // Create new student and enrollment
    const student = await prisma.student.create({
      data: {
        name,
        email,
        enrollments: {
          create: {
            courseId,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
} 