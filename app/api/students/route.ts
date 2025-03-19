import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadStudents } from "@/lib/data"

export async function GET(request: NextRequest) {
  try {
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

    const students = await prisma.student.findMany({
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