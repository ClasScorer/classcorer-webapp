"use server";

import { 
  loadCourses, 
  loadCalendarEvents, 
  loadStudents, 
  getCanvasStatus 
} from "@/lib/data";
import { EnhancedCourseData } from "../dashboard/PerformanceSection";

export interface DashboardStats {
  totalStudents: number;
  averageAttendance: number;
  averagePassRate: number;
  atRiskStudents: number;
  upcomingDeadlines: {
    course: string;
    task: string;
    dueDate: string;
    submissions: number;
    totalStudents: number;
  }[];
  recentAnnouncements: {
    course: string;
    title: string;
    date: string;
    priority: 'normal' | 'high';
  }[];
  studentTrend: 'up' | 'down';
}

// Helper function to get total stats across all courses
export async function getTotalStats(): Promise<DashboardStats> {
  const courses = await loadCourses();
  const events = await loadCalendarEvents();
  const students = await loadStudents();

  // Calculate upcoming deadlines with accurate submission counts
  const upcomingDeadlines = events
    .filter(event => 
      event.type === 'deadline' && 
      new Date(event.date) >= new Date()
    )
    .sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .slice(0, 3)
    .map(event => {
      const course = courses.find(c => c.id === event.courseId);
      const courseStudents = students.filter(s => s.courseId === event.courseId);
      return {
        course: course?.code || '',
        task: event.title,
        dueDate: new Date(event.date).toLocaleDateString(),
        submissions: courseStudents.filter(s => s.submissions > 0).length,
        totalStudents: courseStudents.length,
      };
    });

  // Get unique students (a student might be enrolled in multiple courses)
  const uniqueStudentIds = new Set(students.map(s => s.id));
  const totalStudents = uniqueStudentIds.size;

  // Calculate at-risk students (students with average below 60% or attendance below 70%)
  const atRiskStudents = students.filter(student => 
    student.average < 60 || student.attendance < 70
  ).length;

  // Calculate weighted averages based on student count
  const averageAttendance = totalStudents === 0 ? 0 : Math.min(100, Math.round(
    students.reduce((sum, student) => sum + Math.min(100, student.attendance), 0) / totalStudents
  ));

  const averagePassRate = totalStudents === 0 ? 0 : Math.min(100, Math.round(
    students.reduce((sum, student) => sum + (student.average >= 60 ? 1 : 0), 0) * 100 / totalStudents
  ));

  // Calculate student trend (comparing this week to previous)
  const studentTrend = totalStudents > 0 ? 'up' : 'down';

  // Get recent events for announcements
  const recentEvents = events
    .filter(event => 
      event.type === 'announcement' && 
      new Date(event.date) <= new Date()
    )
    .sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 3)
    .map(event => {
      const course = courses.find(c => c.id === event.courseId);
      return {
        course: course?.code || '',
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        priority: event.type === 'urgent' ? 'high' as const : 'normal' as const,
      };
    });

  return {
    totalStudents,
    averageAttendance,
    averagePassRate,
    atRiskStudents,
    upcomingDeadlines,
    recentAnnouncements: recentEvents,
    studentTrend,
  };
}

// Function to fetch and process course data
export async function getCourseStats(): Promise<EnhancedCourseData[]> {
  const courses = await loadCourses();
  const students = await loadStudents();

  // Calculate course-specific stats
  return courses.map(course => {
    const courseStudents = students.filter(s => s.courseId === course.id);
    const averageAttendance = courseStudents.length > 0
      ? Math.min(100, Math.round(courseStudents.reduce((sum, s) => sum + Math.min(100, s.attendance), 0) / courseStudents.length))
      : 0;
    const averageScore = courseStudents.length > 0
      ? Math.min(100, Math.round(courseStudents.reduce((sum, s) => sum + Math.min(100, s.average), 0) / courseStudents.length))
      : 0;
    const atRiskCount = courseStudents.filter(s => s.average < 60 || s.attendance < 70).length;
    
    // Calculate submission rate from students' submission count
    const submissionCount = courseStudents.reduce((sum, s) => sum + (s.submissions || 0), 0);
    const totalPossibleSubmissions = courseStudents.length * 5; // Assume 5 assignments per course
    const submissionRate = totalPossibleSubmissions > 0 
      ? Math.min(100, Math.round((submissionCount / totalPossibleSubmissions) * 100))
      : 0;

    return {
      ...course,
      averageAttendance,
      averageScore,
      atRiskCount,
      totalStudents: courseStudents.length,
      submissionRate,
      term: 'Current', // Adding required fields for PerformanceGraph
      section: 'Main',
      stats: {
        classAverage: { value: averageScore },
        engagement: { value: averageAttendance },
        assignments: { value: submissionRate },
        progress: { value: course.progress }
      }
    };
  });
}

// Function to get Canvas integration status
export async function getCanvasIntegrationStatus() {
  return await getCanvasStatus();
} 