import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

interface Params {
  params: {
    lectureId: string;
  };
}

// PATCH - Update a lecture's status
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession();
    const { lectureId } = params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!lectureId) {
      return NextResponse.json(
        { error: "Missing lecture ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { isActive, endTime } = body;
    
    // Get the lecture to check permissions
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
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
    
    // Update the lecture status
    const updatedLecture = await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        isActive: isActive,
        ...(endTime && { endTime: new Date(endTime) }),
      },
    });
    
    return NextResponse.json(updatedLecture);
  } catch (error) {
    console.error("[LECTURE_STATUS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 