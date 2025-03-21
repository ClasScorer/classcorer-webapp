import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isCanvasActive, syncCanvasStudents, syncCanvasAssignments, syncCanvasSubmissions } from '@/lib/canvas';

// Updated type definition to match Next.js 15 requirements
type RouteContext = {
  params: {
    courseId: string;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { courseId } = context.params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if Canvas integration is active
    const canvasActive = await isCanvasActive(user.id);
    if (!canvasActive) {
      return NextResponse.json({ 
        error: 'Canvas integration is not active. Please enable it in your account settings.' 
      }, { status: 400 });
    }
    
    // Get course data and validate ownership
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        instructorId: user.id
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }
    
    // Validate course has a Canvas course ID
    if (!course.canvasCourseId) {
      return NextResponse.json({ 
        error: 'This course is not linked to Canvas. Please update the course settings first.' 
      }, { status: 400 });
    }
    
    const canvasCourseId = parseInt(course.canvasCourseId);
    
    // Sync course data from Canvas
    await Promise.all([
      syncCanvasStudents(courseId, canvasCourseId),
      syncCanvasAssignments(courseId, canvasCourseId),
      syncCanvasSubmissions(courseId, canvasCourseId)
    ]);
    
    // Update last synced timestamp
    await prisma.canvasConfig.update({
      where: { userId: user.id },
      data: {
        lastSyncedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully synchronized data for course ${course.name}`
    });
    
  } catch (error) {
    console.error('Error syncing course data from Canvas:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize course data from Canvas' },
      { status: 500 }
    );
  }
} 