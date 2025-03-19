import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET - Fetch attendance records (with optional filters)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lectureId = searchParams.get("lectureId");
  const studentId = searchParams.get("studentId");

  try {
    const whereClause: any = {};
    
    if (lectureId) {
      whereClause.lectureId = lectureId;
    }
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lecture: {
          select: {
            id: true,
            title: true,
            date: true,
            courseId: true
          }
        }
      },
      orderBy: [
        { lecture: { date: 'desc' } },
        { student: { name: 'asc' } }
      ]
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST - Create or update attendance records
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { lectureId, studentId, status, joinTime, leaveTime, notes } = await request.json();
    
    if (!lectureId || !studentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if the lecture exists and get its courseId
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { 
        courseId: true,
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }
    
    // Verify the user has permission to update attendance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user || user.id !== lecture.course.instructorId) {
      return NextResponse.json(
        { error: "You don't have permission to update attendance records for this lecture" },
        { status: 403 }
      );
    }
    
    // Check if attendance record already exists
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        lectureId,
        studentId
      }
    });
    
    let attendanceRecord;
    
    if (existingAttendance) {
      // Update existing record
      attendanceRecord = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          joinTime: joinTime ? new Date(joinTime) : null,
          leaveTime: leaveTime ? new Date(leaveTime) : null,
          notes
        }
      });
    } else {
      // Create new record
      attendanceRecord = await prisma.attendance.create({
        data: {
          lectureId,
          studentId,
          status,
          joinTime: joinTime ? new Date(joinTime) : null,
          leaveTime: leaveTime ? new Date(leaveTime) : null,
          notes
        }
      });
    }
    
    return NextResponse.json(attendanceRecord);
  } catch (error) {
    console.error("[ATTENDANCE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH - Update attendance records in bulk
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { lectureId, records } = await request.json();
    
    if (!lectureId || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    // Check if the lecture exists and get its courseId
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { 
        courseId: true,
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }
    
    // Verify the user has permission to update attendance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user || user.id !== lecture.course.instructorId) {
      return NextResponse.json(
        { error: "You don't have permission to update attendance records for this lecture" },
        { status: 403 }
      );
    }
    
    // Process each record in the array
    const results = await Promise.all(
      records.map(async (record) => {
        const { studentId, status, joinTime, leaveTime, notes } = record;
        
        if (!studentId || !status) {
          return { error: `Missing required fields for student ${studentId}`, success: false };
        }
        
        // Check if attendance record already exists
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            lectureId,
            studentId
          }
        });
        
        if (existingAttendance) {
          // Update existing record
          return prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              status,
              joinTime: joinTime ? new Date(joinTime) : undefined,
              leaveTime: leaveTime ? new Date(leaveTime) : undefined,
              notes: notes !== undefined ? notes : undefined
            }
          });
        } else {
          // Create new record
          return prisma.attendance.create({
            data: {
              lectureId,
              studentId,
              status,
              joinTime: joinTime ? new Date(joinTime) : null,
              leaveTime: leaveTime ? new Date(leaveTime) : null,
              notes
            }
          });
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error("[ATTENDANCE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 