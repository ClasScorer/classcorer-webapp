import { prisma } from "@/lib/prisma"

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  score: number;
  level: number;
  average: number;
  attendance: number;
  submissions: number;
  lastSubmission?: Date;
  status: string;
  trend: string;
  badges: string[];
  progress: number;
  streak: number;
  grade: string;
  courseId: string;
  course: {
    name: string;
    code: string;
  };
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  instructor: {
    name: string;
    email: string;
  };
  status: string;
  week: number;
  progress: number;
  credits: number;
  average: number;
  attendance: number;
  passRate: number;
  classAverage: number;
  totalStudents: number;
  atRiskCount: number;
  students: Student[];
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  description?: string;
  courseId?: string;
  course?: {
    name: string;
    code: string;
  };
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use current origin
    return window.location.origin;
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
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/students`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function loadCourses(): Promise<Course[]> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/courses`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function loadCalendarEvents(): Promise<Event[]> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function getStudentsByCourse(courseId: string): Promise<Student[]> {
  const students = await loadStudents();
  return students.filter(student => student.courseId === courseId);
}

export async function getCourseById(id: string): Promise<Course | null> {
  const courses = await loadCourses();
  return courses.find(course => course.id === id) || null;
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const students = await loadStudents();
  return students.find(student => student.id === studentId) || null;
}

export async function getEventsByCourse(courseId: string): Promise<Event[]> {
  const events = await loadCalendarEvents();
  const courses = await loadCourses();
  
  const course = courses.find(c => c.id === courseId);
  if (!course) return [];
  
  return events.filter(event => event.courseId === course.id);
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

export async function getCurrentUser() {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/user`)
  if (!res.ok) throw new Error("Failed to fetch user")
  return res.json()
} 