import { NextResponse } from 'next/server';
import { fetchCanvasCourses, fetchCanvasStudents, mapCanvasStudentToStudent } from '@/lib/canvas';

export async function GET() {
  try {
    // Fetch all courses from Canvas LMS
    const canvasCourses = await fetchCanvasCourses();
    
    // Fetch students for each course and map them to our format
    const studentsPromises = canvasCourses.map(async (course) => {
      const canvasStudents = await fetchCanvasStudents(course.id);
      return canvasStudents.map(student => {
        const mappedStudent = mapCanvasStudentToStudent(student, course.id);
        // Add course name and code
        mappedStudent.course.name = course.name;
        mappedStudent.course.code = course.course_code;
        return mappedStudent;
      });
    });
    
    // Flatten the array of arrays into a single array
    const students = (await Promise.all(studentsPromises)).flat();
    
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching Canvas students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students from Canvas' },
      { status: 500 }
    );
  }
} 