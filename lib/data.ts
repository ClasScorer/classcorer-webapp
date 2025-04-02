import { prisma } from "./prisma"

// Data types based on the normalized schema
export type UserRole = 'PROFESSOR' | 'TEACHING_ASSISTANT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string | null;
  timezone?: string | null;
  language?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  // Relations that might be included when fetching with ?include=all
  enrollments?: Array<{
    id: string;
    courseId: string;
    studentId: string;
    status: string;
    enrolledAt: Date;
    course?: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  submissionList?: Array<{
    id: string;
    score?: number | null;
    submittedAt: Date;
    status: string;
    isLate: boolean;
    feedback?: string | null;
    assignmentId: string;
    studentId: string;
    assignment?: {
      id: string;
      title: string;
      dueDate: Date;
      pointsPossible: number;
    };
  }>;
  attendances?: Array<{
    id: string;
    status: string;
    studentId: string;
    lectureId: string;
    joinTime?: Date | null;
    leaveTime?: Date | null;
  }>;
  engagements?: Array<{
    id: string;
    focusScore: number;
    engagementLevel: string;
    lectureId: string;
    studentId: string;
  }>;
  // Computed fields
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
  description?: string | null;
  instructor: {
    name: string;
    email: string;
  } | string; // Can be either an object or a string
  startDate?: Date | null;
  endDate?: Date | null;
  credits: number;
  // Computed fields
  status: string;
  week: number;
  progress: number;
  average: number;
  attendance: number;
  passRate: number;
  classAverage: number;
  totalStudents: number;
  atRiskCount: number;
  students: Student[];
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  pointsPossible: number;
  weight?: number;
  assignmentType: string;
  courseId: string;
  course?: {
    name: string;
    code: string;
  };
}

export interface Submission {
  id: string;
  submittedAt: Date;
  score?: number;
  feedback?: string;
  isLate: boolean;
  status: string;
  studentId: string;
  assignmentId: string;
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  courseId: string;
}

export interface Attendance {
  id: string;
  status: string;
  studentId: string;
  lectureId: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  publishedAt: Date;
  courseId: string;
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

// Data source flag to toggle between mock data and Canvas
const USE_CANVAS = process.env.USE_CANVAS === 'true';

// Data loading functions - now using the database directly
export async function loadStudents(): Promise<Student[]> {
  try {
    // Get all enrollments with student and course data
    const enrollments = await prisma.studentEnrollment.findMany({
      include: {
        student: true,
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // For each enrollment, get submissions and attendance data
    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get submissions for this student in this course
        const submissions = await prisma.submission.findMany({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              courseId: enrollment.courseId
            }
          },
          include: {
            assignment: true
          },
          orderBy: {
            submittedAt: 'desc'
          }
        });

        // Get attendance for this student in this course
        const attendances = await prisma.attendance.findMany({
          where: {
            studentId: enrollment.studentId,
            lecture: {
              courseId: enrollment.courseId
            }
          }
        });

        // Get badges for this student
        const badgeEntries = await prisma.studentBadge.findMany({
          where: {
            studentId: enrollment.studentId
          },
          include: {
            badge: true
          }
        });

        // Calculate metrics
        const studentTotalScore = submissions.reduce((sum, submission) => 
          sum + (submission.score || 0), 0);
        
        const studentAverage = submissions.length > 0 
          ? studentTotalScore / submissions.length 
          : 0;
        
        const totalAttendances = attendances.length;
        const presentAttendances = attendances.filter(a => a.status === 'PRESENT').length;
        const attendanceRate = totalAttendances > 0 
          ? Math.round((presentAttendances / totalAttendances) * 100) 
          : 100;
        
        // Determine grade based on average
        let grade = 'F';
        if (studentAverage >= 90) grade = 'A';
        else if (studentAverage >= 80) grade = 'B';
        else if (studentAverage >= 70) grade = 'C';
        else if (studentAverage >= 60) grade = 'D';
        
        // Calculate trend (up or down) based on recent submissions
        const recentSubmissions = submissions.slice(0, 3);
        const olderSubmissions = submissions.slice(3, 6);
        
        const recentAvg = recentSubmissions.length > 0
          ? recentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSubmissions.length
          : 0;
          
        const olderAvg = olderSubmissions.length > 0
          ? olderSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / olderSubmissions.length
          : 0;
        
        const trend = recentSubmissions.length > 0 && olderSubmissions.length > 0
          ? recentAvg >= olderAvg ? 'up' : 'down'
          : 'up';
        
        // Calculate streak based on consecutive attendances
        const streak = calculateStreak(attendances);
        
        // Get last submission date
        const lastSubmission = submissions.length > 0 ? submissions[0].submittedAt : undefined;
        
        // Get badges
        const badgeNames = badgeEntries.map(entry => entry.badge.name);
        
        // Calculate progress based on assignments completed
        const progress = Math.min(
          Math.floor(Math.random() * 20) + 80, // Placeholder - would be based on actual progress
          100
        );
        
        const score = Math.round(studentTotalScore);
        
        return {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          avatar: enrollment.student.avatar || `/avatars/${Math.floor(Math.random() * 5) + 1}.png`,
          score,
          level: calculateLevel(score),
          average: Math.round(studentAverage),
          attendance: attendanceRate,
          submissions: submissions.length,
          lastSubmission,
          status: studentAverage < 60 ? 'At Risk' : 'Active',
          trend,
          badges: badgeNames,
          progress,
          streak,
          grade,
          courseId: enrollment.course.id,
          course: {
            name: enrollment.course.name,
            code: enrollment.course.code
          }
        };
      })
    );

    return students;
  } catch (error) {
    console.error("Error loading students:", error);
    return [];
  }
}

export async function loadCourses(): Promise<Course[]> {
  try {
    // Get all courses with instructor data directly from Prisma
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        },
        assignments: {
          include: {
            submissions: true
          }
        },
        lectures: {
          include: {
            attendances: true
          }
        }
      }
    });

    // Transform the courses data to match our Course interface
    return courses.map((course: any) => {
      // Calculate metrics
      const totalStudents = course.students?.length || 0;
      
      // Calculate week number based on start date
      const week = course.startDate 
        ? Math.ceil(Math.abs(new Date().getTime() - new Date(course.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 1;
      
      // Calculate progress based on start and end dates
      let progress = 0;
      if (course.startDate && course.endDate) {
        const start = new Date(course.startDate).getTime();
        const end = new Date(course.endDate).getTime();
        const now = new Date().getTime();
        
        if (now <= start) progress = 0;
        else if (now >= end) progress = 100;
        else {
          const totalDuration = end - start;
          const elapsed = now - start;
          progress = Math.round((elapsed / totalDuration) * 100);
        }
      }
      
      // Calculate average scores and attendance
      let totalScore = 0;
      let totalAssignments = 0;
      let totalAttendances = 0;
      let presentAttendances = 0;
      
      // Process assignments and submissions
      course.assignments?.forEach((assignment: any) => {
        assignment.submissions?.forEach((submission: any) => {
          if (submission.score !== null && submission.score !== undefined) {
            totalScore += submission.score;
            totalAssignments++;
          }
        });
      });
      
      // Process lectures and attendances
      course.lectures?.forEach((lecture: any) => {
        lecture.attendances?.forEach((attendance: any) => {
          totalAttendances++;
          if (attendance.status === 'PRESENT') {
            presentAttendances++;
          }
        });
      });
      
      // Calculate averages
      const averageScore = totalAssignments > 0 ? totalScore / totalAssignments : 0;
      const attendanceRate = totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 0;
      
      // Transform students data
      const students = course.students?.map((enrollment: any) => {
        const student = enrollment.student;
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar || `/avatars/${Math.floor(Math.random() * 5) + 1}.png`,
          score: Math.round(Math.random() * 100), // Placeholder
          level: Math.floor(Math.random() * 5) + 1, // Placeholder
          average: Math.round(Math.random() * 100), // Placeholder
          attendance: Math.round(Math.random() * 100), // Placeholder
          submissions: Math.floor(Math.random() * 10), // Placeholder
          status: Math.random() > 0.8 ? 'At Risk' : 'Active', // Placeholder
          trend: Math.random() > 0.5 ? 'up' : 'down', // Placeholder
          badges: [], // Placeholder
          progress: Math.round(Math.random() * 100), // Placeholder
          streak: Math.floor(Math.random() * 10), // Placeholder
          grade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)], // Placeholder
          courseId: course.id,
          course: {
            name: course.name,
            code: course.code
          }
        };
      }) || [];

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        instructor: course.instructor,
        startDate: course.startDate,
        endDate: course.endDate,
        credits: course.credits,
        status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started',
        week,
        progress,
        average: Math.round(averageScore),
        attendance: Math.round(attendanceRate),
        passRate: Math.round((students.filter(s => s.average >= 60).length / totalStudents) * 100),
        classAverage: Math.round(averageScore),
        totalStudents,
        atRiskCount: students.filter(s => s.status === 'At Risk').length,
        students
      };
    });
  } catch (error) {
    console.error("Error loading courses:", error);
    return [];
  }
}

export async function loadCalendarEvents(): Promise<any[]> {
  try {
    // Get all assignments (as deadlines)
    const assignments = await prisma.assignment.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Get all announcements
    const announcements = await prisma.announcement.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Get all lectures
    const lectures = await prisma.lecture.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Combine and format all events
    const events = [
      ...assignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        date: assignment.dueDate,
        type: 'deadline',
        description: assignment.description,
        courseId: assignment.courseId,
        course: {
          name: assignment.course.name,
          code: assignment.course.code
        }
      })),
      ...announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        date: announcement.publishedAt,
        type: announcement.isImportant ? 'urgent' : 'announcement',
        description: announcement.content,
        courseId: announcement.courseId,
        course: {
          name: announcement.course.name,
          code: announcement.course.code
        }
      })),
      ...lectures.map(lecture => ({
        id: lecture.id,
        title: lecture.title,
        date: lecture.date,
        type: 'lecture',
        description: lecture.description,
        courseId: lecture.courseId,
        course: {
          name: lecture.course.name,
          code: lecture.course.code
        }
      }))
    ];

    return events;
  } catch (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }
}

export async function getStudentsByCourse(courseId: string): Promise<Student[]> {
  try {
    // Direct API call with courseId filter for better performance
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/students?courseId=${courseId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch students for course: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    
    // Handle both response formats: either direct array or {students: [...]} format
    const students = Array.isArray(data) ? data : data.students || [];
    console.log(`Retrieved ${students.length} students for course ${courseId}`);
    
    return students;
  } catch (error) {
    console.error(`Error in getStudentsByCourse for courseId ${courseId}:`, error);
    throw new Error(`Failed to get students for course: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/courses/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch course: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const course = await res.json();
    return transformCourseData(course);
  } catch (error) {
    console.error("Error in getCourseById:", error);
    throw new Error(`Failed to get course: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/students/${studentId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return null; // Student not found
      }
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch student: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error in getStudentById for studentId ${studentId}:`, error);
    return null;
  }
}

export async function getEventsByCourse(courseId: string): Promise<any[]> {
  const events = await fetchCalendarEvents();
  return events.filter((event: any) => event.courseId === courseId);
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

// Client-safe data fetching methods
export async function fetchCourses() {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/courses?include=students`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch courses: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    console.log(`Retrieved ${data.length || 0} courses, checking student counts...`);
    
    // Check students for each course
    if (Array.isArray(data)) {
      data.forEach(course => {
        console.log(`Course ${course.name} (${course.id}) has ${Array.isArray(course.students) ? course.students.length : 0} students`);
      });
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
}

export async function fetchStudents() {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/students?limit=1000`, { // Set larger limit to get more students
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch students: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    console.log(`Retrieved ${data.students?.length || 0} total students`);
    
    // Return just the students array from the response
    return data.students || [];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

export async function fetchCalendarEvents() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/calendar-events`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  
  return res.json();
}

export async function getCanvasStatus() {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/canvas/config`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { isActive: false };
    }

    const config = await response.json();
    return { 
      isActive: Boolean(config?.isActive),
      isConnected: Boolean(config?.id)
    };
  } catch (error) {
    console.error('Error checking Canvas status:', error);
    return { isActive: false };
  }
}

export async function getCurrentUser() {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch user: ${res.status} ${res.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
}

// Helper functions
function calculateLevel(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

function calculateStreak(attendances: Attendance[]): number {
  // Sort attendances by date
  const sortedAttendances = [...attendances].sort((a, b) => {
    // This is a simplified approach - in a real app, you'd need to get the lecture dates
    return a.id.localeCompare(b.id);
  });
  
  // Count consecutive present or late statuses
  let streak = 0;
  for (let i = sortedAttendances.length - 1; i >= 0; i--) {
    const status = sortedAttendances[i].status;
    if (status === 'PRESENT' || status === 'LATE') {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateStudentAverage(submissions: Submission[], assignments: Assignment[]): number {
  let totalScore = 0;
  let totalPoints = 0;
  
  // Create a map of assignment IDs to assignments for quick lookup
  const assignmentMap = new Map<string, Assignment>();
  assignments.forEach(assignment => {
    assignmentMap.set(assignment.id, assignment);
  });
  
  submissions.forEach(submission => {
    const assignment = assignmentMap.get(submission.assignmentId);
    if (assignment && submission.score !== null && submission.score !== undefined && assignment.pointsPossible > 0) {
      totalScore += submission.score;
      totalPoints += assignment.pointsPossible;
    }
  });
  
  return totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
}

// Lecture fetching functions
export async function fetchLectures(courseId?: string) {
  try {
    const baseUrl = getBaseUrl();
    const url = courseId 
      ? `${baseUrl}/api/lectures?courseId=${courseId}` 
      : `${baseUrl}/api/lectures`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lectures');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return [];
  }
}

export async function fetchLectureById(id: string) {
  try {
    const lectures = await fetchLectures();
    return lectures.find((lecture: any) => lecture.id === id) || null;
  } catch (error) {
    console.error('Error fetching lecture by ID:', error);
    return null;
  }
}

export async function fetchLecturesByCourse(courseId: string) {
  try {
    const lectures = await fetchLectures(courseId);
    if (!Array.isArray(lectures)) {
      console.error("Unexpected response format from fetchLectures");
      return [];
    }
    return lectures;
  } catch (error) {
    console.error(`Error fetching lectures for course ${courseId}:`, error);
    throw new Error(`Failed to fetch lectures: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Attendance fetching functions
export async function fetchAttendance(lectureId?: string, studentId?: string) {
  try {
    const baseUrl = getBaseUrl();
    let url = `${baseUrl}/api/attendance`;
    const params = new URLSearchParams();
    
    if (lectureId) {
      params.append('lectureId', lectureId);
    }
    
    if (studentId) {
      params.append('studentId', studentId);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
}

export async function saveAttendance(data: {
  lectureId: string;
  studentId: string;
  status: string;
  joinTime?: Date;
  leaveTime?: Date;
  notes?: string;
}) {
  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save attendance');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw error;
  }
}

export async function updateBulkAttendance(lectureId: string, records: Array<{
  studentId: string;
  status: string;
  joinTime?: Date;
  leaveTime?: Date;
  notes?: string;
}>) {
  try {
    const response = await fetch('/api/attendance', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lectureId,
        records
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update attendance records');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating attendance records:', error);
    throw error;
  }
}

// Helper function to transform course data by properly formatting StudentEnrollment to Student
export function transformCourseData(course: any) {
  // If instructor is an object with properties, keep it; otherwise wrap in an object
  const instructorObj = course.instructor && typeof course.instructor === 'object' 
    ? course.instructor
    : { name: 'Instructor', email: course.instructor || 'no-email' };

  return {
    ...course,
    instructor: instructorObj,
    students: Array.isArray(course.students) 
      ? course.students.map((item: any) => {
          // Check if this is an enrollment object or a student object
          if (item.student) {
            return item.student;
          } else if (item.id) {
            // This is already a student object
            return item;
          } else {
            console.warn('Unknown student format:', item);
            return null;
          }
        }).filter(Boolean) // Remove any null values
      : []
  };
} 