import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchCanvasCourses, fetchCanvasAssignments } from '@/lib/canvas';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all courses from Canvas LMS using user's credentials
    const canvasCourses = await fetchCanvasCourses(user.id);
    
    // Fetch assignments for each course
    const assignmentsPromises = canvasCourses.map(async (course) => {
      const assignments = await fetchCanvasAssignments(course.id, user.id);
      return assignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.name,
        description: assignment.description,
        date: assignment.due_at,
        type: 'deadline',
        courseId: course.id.toString(),
        course: {
          name: course.name,
          code: course.course_code,
        },
        // Convert to event format used by the app
        pointsPossible: assignment.points_possible,
      }));
    });
    
    // Flatten the array of arrays into a single array
    const events = (await Promise.all(assignmentsPromises)).flat();
    
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Error fetching Canvas assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments from Canvas' },
      { status: 500 }
    );
  }
} 