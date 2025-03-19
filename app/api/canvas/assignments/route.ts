import { NextResponse } from 'next/server';
import { fetchCanvasCourses, fetchCanvasAssignments } from '@/lib/canvas';

export async function GET() {
  try {
    // Fetch all courses from Canvas LMS
    const canvasCourses = await fetchCanvasCourses();
    
    // Fetch assignments for each course
    const assignmentsPromises = canvasCourses.map(async (course) => {
      const assignments = await fetchCanvasAssignments(course.id);
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