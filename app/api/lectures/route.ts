import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// GET - Fetch lectures (with optional filters)
export async function GET(req: NextRequest) {
  try {
    // Check authentication - but allow development access
    let userId = 'dev-user-id';
    let isDevMode = false;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id as string;
      } else if (process.env.NODE_ENV === 'production') {
        // Only enforce strict auth in production
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      } else {
        isDevMode = true;
      }
    } catch (authError) {
      console.warn('Auth check failed, using development fallback:', authError);
      // Continue with development fallback in dev mode
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      isDevMode = true;
    }
    
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    
    // Prepare the query
    const query: any = {};
    
    // Filter by course if provided
    if (courseId) {
      // Check if course exists and belongs to the user
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, instructorId: true }
      });
      
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
      
      // Skip permission check in dev mode
      if (!isDevMode && course.instructorId !== userId) {
        return NextResponse.json(
          { error: 'You are not authorized to view lectures for this course' },
          { status: 403 }
        );
      }
      
      query.courseId = courseId;
    } else if (!isDevMode) {
      // If no course specified and not in dev mode, restrict to user's courses
      query.course = {
        instructorId: userId
      };
    }
    
    // Get lectures
    const lectures = await prisma.lecture.findMany({
      where: query,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return NextResponse.json(lectures);
    
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lectures', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new lecture
export async function POST(req: NextRequest) {
  try {
    // Check authentication - but allow development access
    let userId = 'dev-user-id';
    let isDevMode = false;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id as string;
      } else if (process.env.NODE_ENV === 'production') {
        // Only enforce strict auth in production
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      } else {
        isDevMode = true;
        console.log('DEV MODE: Using dev-user-id for authentication');
      }
    } catch (authError) {
      console.warn('Auth check failed, using development fallback:', authError);
      // Continue with development fallback in dev mode
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      isDevMode = true;
    }

    const data = await req.json();
    
    // Validate required fields
    if (!data.courseId || !data.title) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId and title' },
        { status: 400 }
      );
    }

    // Check if course exists and belongs to the user
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Skip permission check in dev mode
    if (!isDevMode && course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to create lectures for this course' },
        { status: 403 }
      );
    }
    
    // Create the lecture
    const lecture = await prisma.lecture.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date ? new Date(data.date) : new Date(),
        duration: data.duration || 60, // Default 60 minutes
        isActive: true,
        courseId: data.courseId,
      }
    });
    
    return NextResponse.json(lecture);
    
  } catch (error) {
    console.error('Error creating lecture:', error);
    return NextResponse.json(
      { error: 'Failed to create lecture', details: String(error) },
      { status: 500 }
    );
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