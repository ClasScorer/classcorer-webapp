import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadStudents } from "@/lib/data"

export async function GET() {
  try {
    const students = await loadStudents()
    return NextResponse.json(students)
  } catch (error) {
    console.error("[STUDENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, courseId } = body

    // Validate required fields
    if (!name || !email || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this email already exists" },
        { status: 400 }
      )
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        name,
        email,
        courseId,
        // Set default values
        score: 0,
        level: 1,
        average: 0,
        attendance: 0,
        submissions: 0,
        status: "Good",
        trend: "stable",
        badges: [],
        progress: 0,
        streak: 0,
        grade: "N/A"
      },
      include: {
        course: true
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    )
  }
} 