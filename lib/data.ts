import { prisma } from "@/lib/prisma"

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
  };
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
    // Get all courses with instructor data
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // For each course, get enrollments, assignments, and lectures
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        // Get enrollments for this course
        const enrollments = await prisma.studentEnrollment.findMany({
          where: {
            courseId: course.id
          },
          include: {
            student: true
          }
        });

        // Get assignments for this course
        const assignments = await prisma.assignment.findMany({
          where: {
            courseId: course.id
          },
          include: {
            submissions: true
          }
        });

        // Get lectures for this course
        const lectures = await prisma.lecture.findMany({
          where: {
            courseId: course.id
          },
          include: {
            attendances: true
          }
        });

        // Calculate metrics
        const totalStudents = enrollments.length;
        
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
        let atRiskCount = 0;
        
        assignments.forEach(assignment => {
          assignment.submissions.forEach(submission => {
            if (submission.score !== null && submission.score !== undefined) {
              totalScore += submission.score;
              totalAssignments++;
            }
          });
        });
        
        lectures.forEach(lecture => {
          lecture.attendances.forEach(attendance => {
            totalAttendances++;
            if (attendance.status === 'PRESENT') {
              presentAttendances++;
            }
          });
        });
        
        const average = totalAssignments > 0 ? Math.round(totalScore / totalAssignments) : 0;
        const attendance = totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 100;
        
        // Calculate at-risk students
        enrollments.forEach(enrollment => {
          const studentSubmissions = assignments.flatMap(a => 
            a.submissions.filter(s => s.studentId === enrollment.studentId)
          );
          
          const studentTotalScore = studentSubmissions.reduce((sum, s) => 
            sum + (s.score || 0), 0
          );
          
          const studentAverage = studentSubmissions.length > 0 
            ? studentTotalScore / studentSubmissions.length 
            : 0;
          
          if (studentAverage < 60) {
            atRiskCount++;
          }
        });
        
        // Calculate pass rate
        const passRate = totalStudents > 0 
          ? Math.round(((totalStudents - atRiskCount) / totalStudents) * 100) 
          : 100;
        
        // Build student list
        const students = enrollments.map(enrollment => {
          const student = enrollment.student;
          
          // Get student submissions for this course
          const studentSubmissions = assignments.flatMap(a => 
            a.submissions.filter(s => s.studentId === student.id)
          );
          
          // Get student attendances for this course
          const studentAttendances = lectures.flatMap(l => 
            l.attendances.filter(a => a.studentId === student.id)
          );
          
          const studentTotalScore = studentSubmissions.reduce((sum, s) => 
            sum + (s.score || 0), 0
          );
          
          const studentAverage = studentSubmissions.length > 0 
            ? studentTotalScore / studentSubmissions.length 
            : 0;
          
          const studentAttendanceCount = studentAttendances.length;
          const studentPresentCount = studentAttendances.filter(a => a.status === 'PRESENT').length;
          const studentAttendanceRate = studentAttendanceCount > 0 
            ? Math.round((studentPresentCount / studentAttendanceCount) * 100)
            : 100;
          
          // Determine grade based on average
          let grade = 'F';
          if (studentAverage >= 90) grade = 'A';
          else if (studentAverage >= 80) grade = 'B';
          else if (studentAverage >= 70) grade = 'C';
          else if (studentAverage >= 60) grade = 'D';
          
          // Calculate trend (up or down) based on recent submissions
          const sortedSubmissions = [...studentSubmissions].sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          
          const recentSubmissions = sortedSubmissions.slice(0, 3);
          const olderSubmissions = sortedSubmissions.slice(3, 6);
          
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
          const streak = calculateStreak(studentAttendances);
          
          // Most recent submission date
          const lastSubmission = sortedSubmissions.length > 0
            ? sortedSubmissions[0].submittedAt
            : undefined;
          
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            avatar: student.avatar || '/avatars/default.png',
            score: Math.round(studentTotalScore),
            level: calculateLevel(Math.round(studentTotalScore)),
            average: Math.round(studentAverage),
            attendance: studentAttendanceRate,
            submissions: studentSubmissions.length,
            lastSubmission,
            status: studentAverage < 60 ? 'At Risk' : 'Active',
            trend,
            badges: [], // Will be populated separately
            progress: Math.min(Math.round((studentSubmissions.length / Math.max(assignments.length, 1)) * 100), 100),
            streak,
            grade,
            courseId: course.id,
            course: {
              name: course.name,
              code: course.code
            }
          };
        });
        
        // Determine course status based on dates
        let status = 'Active';
        const now = new Date();
        
        if (course.startDate && new Date(course.startDate) > now) {
          status = 'Upcoming';
        } else if (course.endDate && new Date(course.endDate) < now) {
          status = 'Completed';
        }
        
        return {
          id: course.id,
          name: course.name,
          code: course.code,
          description: course.description || '',
          instructor: {
            name: course.instructor.name,
            email: course.instructor.email
          },
          startDate: course.startDate,
          endDate: course.endDate,
          credits: course.credits,
          status,
          week,
          progress,
          average,
          attendance,
          passRate,
          classAverage: average,
          totalStudents,
          atRiskCount,
          students
        };
      })
    );
    
    return enrichedCourses;
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
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/students?courseId=${courseId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) throw new Error("Failed to fetch students by course");
    
    const students = await res.json();
    return students;
  } catch (error) {
    console.error("Error fetching students by course:", error);
    return [];
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const courses = await fetchCourses();
    const course = courses.find((course: Course) => course.id === id) || null;
    if (course) {
      return transformCourseData(course);
    }
    return null;
  } catch (error) {
    console.error("Error in getCourseById:", error);
    return null;
  }
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const students = await fetchStudents();
  return students.find((student: Student) => student.id === studentId) || null;
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
  const res = await fetch(`${baseUrl}/api/courses`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function fetchStudents() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/students`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}

export async function getCurrentUser() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
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
    return await fetchLectures(courseId);
  } catch (error) {
    console.error('Error fetching lectures by course:', error);
    return [];
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
  return {
    ...course,
    students: Array.isArray(course.students) 
      ? course.students.map((enrollment: any) => 
          enrollment.student ? enrollment.student : enrollment)
      : []
  };
} 