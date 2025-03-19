import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET - Fetch lectures (with optional filters)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    const whereClause = courseId ? { courseId } : {};
    
    const lectures = await prisma.lecture.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(lectures);
  } catch (error) {
    console.error("[LECTURES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST - Create a new lecture
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { title, description, date, duration, courseId } = await request.json();
    
    if (!title || !date || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate that the course exists and belongs to the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        courses: {
          where: { id: courseId },
          select: { id: true },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (user.courses.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to add lectures to this course" },
        { status: 403 }
      );
    }
    
    // Create the lecture
    const lecture = await prisma.lecture.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration,
        courseId,
      },
    });
    
    return NextResponse.json(lecture);
  } catch (error) {
    console.error("[LECTURES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH - Update an existing lecture
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id, title, description, date, duration } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing lecture ID" },
        { status: 400 }
      );
    }
    
    // Get the lecture to check permissions
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }
    
    // Check if the user is the instructor of the course
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user || user.id !== lecture.course.instructorId) {
      return NextResponse.json(
        { error: "You don't have permission to update this lecture" },
        { status: 403 }
      );
    }
    
    // Update the lecture
    const updatedLecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(duration !== undefined && { duration }),
      },
    });
    
    return NextResponse.json(updatedLecture);
  } catch (error) {
    console.error("[LECTURES_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE - Remove a lecture
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing lecture ID" },
        { status: 400 }
      );
    }
    
    // Get the lecture to check permissions
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }
    
    // Check if the user is the instructor of the course
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user || user.id !== lecture.course.instructorId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this lecture" },
        { status: 403 }
      );
    }
    
    // Delete the lecture and associated attendance records
    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: { lectureId: id },
      }),
      prisma.lecture.delete({
        where: { id },
      }),
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LECTURES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 