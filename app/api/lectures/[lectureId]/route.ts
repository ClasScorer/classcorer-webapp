import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: {
    lectureId: string;
  };
}

// PATCH - Update a lecture's status
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
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

// DELETE - Remove a lecture and related data
export async function DELETE(request: Request, { params }: Params) {
  try {
    console.log("DELETE lecture: Processing request for", params.lectureId);
    const session = await getServerSession(authOptions);
    const { lectureId } = params;
    
    console.log("DELETE lecture: Auth check for lecture", lectureId);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!lectureId) {
      return NextResponse.json(
        { error: "Missing lecture ID" },
        { status: 400 }
      );
    }
    
    // Get the lecture to check permissions
    console.log("DELETE lecture: Fetching lecture", lectureId);
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
    console.log("DELETE lecture: Checking permissions");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user || user.id !== lecture.course.instructorId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this lecture" },
        { status: 403 }
      );
    }
    
    // Delete all related records first (attendance, engagement data, etc.)
    // We use a transaction to ensure all deletions succeed or none do
    console.log("DELETE lecture: Deleting lecture and related data");
    await prisma.$transaction([
      // Delete attendance records
      prisma.attendance.deleteMany({
        where: { lectureId },
      }),
      
      // Delete engagement data - use the correct model name from the schema
      prisma.studentEngagement.deleteMany({
        where: { lectureId },
      }),
      
      // Delete the lecture itself
      prisma.lecture.delete({
        where: { id: lectureId },
      }),
    ]);
    
    console.log("DELETE lecture: Successfully deleted lecture", lectureId);
    return NextResponse.json({ success: true, message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("[LECTURE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete lecture", details: String(error) }, { status: 500 });
  }
} 