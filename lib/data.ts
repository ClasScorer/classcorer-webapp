export interface Student {
  id: number;
  name: string;
  email: string;
  avatar: string;
  score: number;
  level: number;
  average: number;
  attendance: string;
  submissions: string;
  lastSubmission: string;
  status: 'Excellent' | 'Good' | 'At Risk';
  trend: 'up' | 'down' | 'stable';
  badges: string[];
  progress: number;
  streak: number;
  recentAchievement: string;
  courseId: number;
  grade: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  instructor: string;
  description: string;
  status: string;
  week: number;
  submissions: number;
  average: number;
  attendance: number;
  progress: number;
  credits: number;
  score: number;
  trend: string;
  lastSubmission: string;
  totalStudents: number;
  passRate: number;
  atRiskCount: number;
  classAverage: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'lecture' | 'exam' | 'deadline' | 'office-hours' | 'meeting';
  course?: string;
  description?: string;
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  if (process.env.VERCEL_URL) {
    // Reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }
  // Assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Data loading functions
export async function loadStudents(): Promise<Student[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/students`, { 
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
}

export async function loadCourses(): Promise<Course[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/courses`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
}

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/events`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }
}

export async function getStudentsByCourse(courseId: string): Promise<Student[]> {
  const students = await loadStudents();
  return students.filter(student => student.courseId.toString() === courseId);
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const courses = await loadCourses();
  return courses.find(course => course.id.toString() === courseId) || null;
}

export async function getStudentById(studentId: number): Promise<Student | null> {
  const students = await loadStudents();
  return students.find(student => student.id === studentId) || null;
}

export async function getEventsByCourse(courseId: string): Promise<CalendarEvent[]> {
  const events = await loadCalendarEvents();
  const courses = await loadCourses();
  
  const course = courses.find(c => c.id.toString() === courseId);
  if (!course) return [];
  
  return events.filter(event => event.course === course.name);
}

// Utility functions
export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatTrend(value: number): string {
  return value >= 0 ? `+${value}%` : `${value}%`;
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
} 