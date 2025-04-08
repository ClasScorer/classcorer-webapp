import { getCourseById, getStudentsByCourse } from "@/lib/data";
import Link from "next/link";

async function fetchCourseStudents(courseId: string, courseName: string) {
  try {
    // Directly fetch students for this specific course
    const studentResults = await fetch(`/api/students?courseId=${courseId}`, { 
      next: { revalidate: 0 } 
    });
    
    if (!studentResults.ok) {
      console.error(`Failed to fetch students for course ${courseName} (${courseId}): ${studentResults.status}`);
      return [];
    }
    
    const data = await studentResults.json();
    
    // Handle both response formats: either direct array or {students: [...]} format
    const students = Array.isArray(data) ? data : data.students || [];
    console.log(`Fetched ${students.length} students for course ${courseName} (${courseId})`);
    
    // Log the first few students for debugging
    if (students.length > 0) {
      console.log("First 3 students:", students.slice(0, 3).map((s: any) => ({ id: s.id, name: s.name })));
    }
    
    return students;
  } catch (error) {
    console.error(`Error fetching students for course ${courseName} (${courseId}):`, error);
    return [];
  }
}

export default async function LectureRoom({
  params,
  searchParams,
}: {
  params: { course_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // ... existing code ...
  
  // Fetch the specific course using the getCourseById function from lib/data.ts
  const courseData = await getCourseById(params.course_id);
  if (!courseData) {
    console.error("Failed to fetch course: Course not found");
    return <div className="p-6">Course not found. <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link></div>;
  }
  
  // Get the students for this specific course
  console.log(`Getting students for course: ${courseData.name} (${courseData.id})`);
  const students = await fetchCourseStudents(courseData.id, courseData.name);
  
  console.log(`Retrieved ${students?.length || 0} students for lecture room display`);
  
  // ... existing code ...
} 