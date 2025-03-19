import { NextResponse } from 'next/server';
import { fetchCanvasCourses, mapCanvasCourseToCourse } from '@/lib/canvas';

export async function GET() {
  try {
    // Fetch courses from Canvas LMS
    const canvasCourses = await fetchCanvasCourses();
    
    // Transform Canvas courses to our application format
    const courses = await Promise.all(
      canvasCourses.map(course => mapCanvasCourseToCourse(course))
    );
    
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Error fetching Canvas courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses from Canvas' },
      { status: 500 }
    );
  }
} 