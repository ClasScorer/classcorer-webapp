import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadStudents } from "@/lib/data"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit' }, { status: 400 })
    }

    // Build where conditions
    const whereConditions: any = {
      enrollments: {
        some: {
          course: {
            instructorId: session.user.id
          }
        }
      }
    }

    // Add search condition if provided
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add course filter if provided
    if (courseId && courseId !== '_all') {
      whereConditions.enrollments = {
        some: {
          courseId: courseId
        }
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: whereConditions
    })

    // Fetch students with all necessary relations
    const students = await prisma.student.findMany({
      where: whereConditions,
      include: {
        enrollments: {
          include: {
            course: true
          }
        },
        attendances: {
          include: {
            lecture: true
          }
        },
        submissions: {
          include: {
            assignment: true
          }
        },
        badges: {
          include: {
            badge: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to include calculated fields
    const transformedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      courses: student.enrollments.map(e => ({
        id: e.course.id,
        name: e.course.name,
        code: e.course.code
      })),
      badges: student.badges.map(b => ({
        id: b.badge.id,
        name: b.badge.name,
        icon: b.badge.icon
      })),
      attendances: student.attendances,
      submissions: student.submissions,
      // Calculate performance metrics
      averageGrade: calculateAverageGrade(student.submissions),
      attendanceRate: calculateAttendanceRate(student.attendances),
      submissionRate: calculateSubmissionRate(student.submissions),
      status: determineStudentStatus(student.submissions)
    }))

    return NextResponse.json({
      students: transformedStudents,
      totalCount
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// Helper functions for calculating metrics
function calculateAverageGrade(submissions: any[]): number {
  if (!submissions.length) return 0
  const total = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0)
  return Math.round(total / submissions.length)
}

function calculateAttendanceRate(attendances: any[]): number {
  if (!attendances.length) return 0
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  return Math.round((presentCount / attendances.length) * 100)
}

function calculateSubmissionRate(submissions: any[]): number {
  if (!submissions.length) return 0
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length
  return Math.round((submittedCount / submissions.length) * 100)
}

function determineStudentStatus(submissions: any[]): string {
  if (!submissions.length) return 'Needs Help'
  
  const avgGrade = calculateAverageGrade(submissions)
  if (avgGrade >= 85) return 'Excellent'
  if (avgGrade >= 70) return 'Good'
  return 'Needs Help'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, courseId } = body

    // Validate required fields
    if (!name || !email || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      )
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
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
} 