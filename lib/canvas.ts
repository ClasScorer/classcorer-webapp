import { getCourseById } from './data';
import { prisma } from './prisma';

// Canvas API base URL and token will be fetched from environment variables
const CANVAS_API_URL = process.env.CANVAS_API_URL || '';
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN || '';

// Types for Canvas API responses
export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  start_at: string;
  end_at: string;
  total_students: number;
}

export interface CanvasStudent {
  id: number;
  name: string;
  sortable_name: string;
  email: string;
  avatar_url: string;
  enrollments: {
    type: string;
    grades: {
      current_score: number;
      current_grade: string;
    };
  }[];
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string;
  points_possible: number;
  course_id: number;
  submission_types: string[];
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string;
  score: number;
  grade: string;
  late: boolean;
}

// Utility function to make authenticated requests to Canvas API
async function canvasApiFetch(endpoint: string, options: RequestInit = {}) {
  if (!CANVAS_API_URL || !CANVAS_API_TOKEN) {
    throw new Error('Canvas API URL or token is not configured');
  }

  const url = `${CANVAS_API_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${CANVAS_API_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch courses from Canvas
export async function fetchCanvasCourses(): Promise<CanvasCourse[]> {
  try {
    return await canvasApiFetch('/courses?include[]=total_students&state[]=available');
  } catch (error) {
    console.error('Error fetching Canvas courses:', error);
    return [];
  }
}

// Fetch students enrolled in a specific course
export async function fetchCanvasStudents(canvasCourseId: number): Promise<CanvasStudent[]> {
  try {
    return await canvasApiFetch(`/courses/${canvasCourseId}/users?enrollment_type[]=student&include[]=avatar_url&include[]=enrollments`);
  } catch (error) {
    console.error(`Error fetching Canvas students for course ${canvasCourseId}:`, error);
    return [];
  }
}

// Fetch assignments for a specific course
export async function fetchCanvasAssignments(canvasCourseId: number): Promise<CanvasAssignment[]> {
  try {
    return await canvasApiFetch(`/courses/${canvasCourseId}/assignments`);
  } catch (error) {
    console.error(`Error fetching Canvas assignments for course ${canvasCourseId}:`, error);
    return [];
  }
}

// Fetch submissions for a specific assignment
export async function fetchCanvasSubmissions(canvasCourseId: number, assignmentId: number): Promise<CanvasSubmission[]> {
  try {
    return await canvasApiFetch(`/courses/${canvasCourseId}/assignments/${assignmentId}/submissions`);
  } catch (error) {
    console.error(`Error fetching Canvas submissions for assignment ${assignmentId}:`, error);
    return [];
  }
}

// Synchronize Canvas courses with database
export async function syncCanvasCourses(userId: string): Promise<void> {
  try {
    const canvasCourses = await fetchCanvasCourses();
    
    for (const canvasCourse of canvasCourses) {
      // Check if course already exists
      const existingCourse = await prisma.course.findFirst({
        where: { canvasCourseId: canvasCourse.id.toString() }
      });
      
      if (existingCourse) {
        // Update course
        await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            name: canvasCourse.name,
            code: canvasCourse.course_code,
            startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
            endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
          }
        });
      } else {
        // Create new course
        await prisma.course.create({
          data: {
            name: canvasCourse.name,
            code: canvasCourse.course_code,
            startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
            endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
            canvasCourseId: canvasCourse.id.toString(),
            instructorId: userId
          }
        });
      }
    }
  } catch (error) {
    console.error('Error syncing Canvas courses:', error);
    throw error;
  }
}

// Synchronize Canvas students with database
export async function syncCanvasStudents(courseId: string, canvasCourseId: number): Promise<void> {
  try {
    const canvasStudents = await fetchCanvasStudents(canvasCourseId);
    
    for (const canvasStudent of canvasStudents) {
      // Check if student already exists
      let student = await prisma.student.findFirst({
        where: { 
          OR: [
            { canvasStudentId: canvasStudent.id.toString() },
            { email: canvasStudent.email }
          ]
        }
      });
      
      if (student) {
        // Update student
        student = await prisma.student.update({
          where: { id: student.id },
          data: {
            name: canvasStudent.name,
            email: canvasStudent.email,
            avatar: canvasStudent.avatar_url,
            canvasStudentId: canvasStudent.id.toString()
          }
        });
      } else {
        // Create new student
        student = await prisma.student.create({
          data: {
            name: canvasStudent.name,
            email: canvasStudent.email,
            avatar: canvasStudent.avatar_url,
            canvasStudentId: canvasStudent.id.toString()
          }
        });
      }
      
      // Check if enrollment exists
      const enrollment = await prisma.studentEnrollment.findUnique({
        where: { 
          studentId_courseId: {
            studentId: student.id,
            courseId: courseId
          }
        }
      });
      
      if (!enrollment) {
        // Create enrollment
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            courseId: courseId,
            status: 'ACTIVE'
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error syncing Canvas students for course ${canvasCourseId}:`, error);
    throw error;
  }
}

// Synchronize Canvas assignments with database
export async function syncCanvasAssignments(courseId: string, canvasCourseId: number): Promise<void> {
  try {
    const canvasAssignments = await fetchCanvasAssignments(canvasCourseId);
    
    for (const canvasAssignment of canvasAssignments) {
      // Determine assignment type based on submission_types
      let assignmentType = 'OTHER';
      if (canvasAssignment.submission_types) {
        const submissionType = canvasAssignment.submission_types[0]?.toLowerCase() || '';
        if (submissionType.includes('quiz')) assignmentType = 'QUIZ';
        else if (submissionType.includes('discussion')) assignmentType = 'DISCUSSION';
        else if (submissionType.includes('online_upload')) assignmentType = 'ASSIGNMENT';
        else if (submissionType.includes('online_text_entry')) assignmentType = 'ASSIGNMENT';
      }
      
      // Check if assignment already exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: { canvasAssignmentId: canvasAssignment.id.toString() }
      });
      
      if (existingAssignment) {
        // Update assignment
        await prisma.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            title: canvasAssignment.name,
            description: canvasAssignment.description,
            dueDate: canvasAssignment.due_at ? new Date(canvasAssignment.due_at) : new Date(),
            pointsPossible: canvasAssignment.points_possible,
            assignmentType: assignmentType as any
          }
        });
      } else {
        // Create new assignment
        await prisma.assignment.create({
          data: {
            title: canvasAssignment.name,
            description: canvasAssignment.description,
            dueDate: canvasAssignment.due_at ? new Date(canvasAssignment.due_at) : new Date(),
            pointsPossible: canvasAssignment.points_possible,
            assignmentType: assignmentType as any,
            canvasAssignmentId: canvasAssignment.id.toString(),
            courseId: courseId
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error syncing Canvas assignments for course ${canvasCourseId}:`, error);
    throw error;
  }
}

// Synchronize Canvas submissions with database
export async function syncCanvasSubmissions(courseId: string, canvasCourseId: number): Promise<void> {
  try {
    // Get all assignments for the course
    const assignments = await prisma.assignment.findMany({
      where: { 
        courseId: courseId,
        canvasAssignmentId: { not: null }
      }
    });
    
    // For each assignment, fetch submissions
    for (const assignment of assignments) {
      if (!assignment.canvasAssignmentId) continue;
      
      const canvasAssignmentId = parseInt(assignment.canvasAssignmentId);
      const canvasSubmissions = await fetchCanvasSubmissions(canvasCourseId, canvasAssignmentId);
      
      for (const canvasSubmission of canvasSubmissions) {
        // Find student by Canvas ID
        const student = await prisma.student.findFirst({
          where: { canvasStudentId: canvasSubmission.user_id.toString() }
        });
        
        if (!student) continue;
        
        // Check if submission already exists
        const existingSubmission = await prisma.submission.findFirst({
          where: {
            studentId: student.id,
            assignmentId: assignment.id,
            canvasSubmissionId: canvasSubmission.id.toString()
          }
        });
        
        if (existingSubmission) {
          // Update submission
          await prisma.submission.update({
            where: { id: existingSubmission.id },
            data: {
              score: canvasSubmission.score,
              submittedAt: canvasSubmission.submitted_at ? new Date(canvasSubmission.submitted_at) : new Date(),
              isLate: canvasSubmission.late,
              status: canvasSubmission.grade ? 'GRADED' : 'SUBMITTED'
            }
          });
        } else if (canvasSubmission.submitted_at) {
          // Create new submission if it was actually submitted
          await prisma.submission.create({
            data: {
              studentId: student.id,
              assignmentId: assignment.id,
              score: canvasSubmission.score,
              submittedAt: new Date(canvasSubmission.submitted_at),
              isLate: canvasSubmission.late,
              status: canvasSubmission.grade ? 'GRADED' : 'SUBMITTED',
              canvasSubmissionId: canvasSubmission.id.toString()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error syncing Canvas submissions for course ${canvasCourseId}:`, error);
    throw error;
  }
}

// Get Canvas config for a user
export async function getCanvasConfig(userId: string) {
  return prisma.canvasConfig.findUnique({
    where: { userId }
  });
}

// Save Canvas config
export async function saveCanvasConfig(userId: string, apiUrl: string, apiToken: string) {
  // Check if config exists
  const existingConfig = await prisma.canvasConfig.findUnique({
    where: { userId }
  });
  
  if (existingConfig) {
    return prisma.canvasConfig.update({
      where: { id: existingConfig.id },
      data: { apiUrl, apiToken, updatedAt: new Date() }
    });
  } else {
    return prisma.canvasConfig.create({
      data: {
        userId,
        apiUrl,
        apiToken
      }
    });
  }
}

// Set Canvas config active state
export async function setCanvasConfigActive(userId: string, isActive: boolean) {
  const config = await prisma.canvasConfig.findUnique({
    where: { userId }
  });
  
  if (!config) throw new Error('Canvas config not found');
  
  return prisma.canvasConfig.update({
    where: { id: config.id },
    data: { isActive, updatedAt: new Date() }
  });
}

// Main synchronization function
export async function synchronizeCanvasData(userId: string): Promise<void> {
  // Get Canvas config
  const config = await getCanvasConfig(userId);
  if (!config || !config.isActive) return;
  
  try {
    // Update lastSyncedAt
    await prisma.canvasConfig.update({
      where: { id: config.id },
      data: { lastSyncedAt: new Date() }
    });
    
    // Sync courses
    await syncCanvasCourses(userId);
    
    // Get all courses with Canvas IDs
    const courses = await prisma.course.findMany({
      where: {
        instructorId: userId,
        canvasCourseId: { not: null }
      }
    });
    
    // Sync students, assignments and submissions for each course
    for (const course of courses) {
      if (!course.canvasCourseId) continue;
      
      const canvasCourseId = parseInt(course.canvasCourseId);
      await syncCanvasStudents(course.id, canvasCourseId);
      await syncCanvasAssignments(course.id, canvasCourseId);
      await syncCanvasSubmissions(course.id, canvasCourseId);
    }
  } catch (error) {
    console.error('Error synchronizing Canvas data:', error);
    throw error;
  }
}

// Map Canvas course data to our application's course format
export async function mapCanvasCourseToCourse(canvasCourse: CanvasCourse) {
  const students = await fetchCanvasStudents(canvasCourse.id);
  
  // Calculate course statistics
  const studentCount = students.length;
  let totalAttendance = 0;
  let totalAverage = 0;
  let atRiskCount = 0;
  
  students.forEach(student => {
    const currentScore = student.enrollments[0]?.grades?.current_score || 0;
    totalAverage += currentScore;
    
    // Assuming attendance data is not directly available from Canvas
    // This would need to be implemented based on your specific needs
    
    // Count at-risk students (score below 70%)
    if (currentScore < 70) {
      atRiskCount++;
    }
  });
  
  const averageScore = studentCount > 0 ? totalAverage / studentCount : 0;
  const passRate = studentCount > 0 ? ((studentCount - atRiskCount) / studentCount) * 100 : 0;
  
  return {
    id: canvasCourse.id.toString(),
    name: canvasCourse.name,
    code: canvasCourse.course_code,
    instructor: {
      name: 'Instructor Name', // This would need to be fetched separately
      email: 'instructor@example.com', // This would need to be fetched separately
    },
    status: 'active',
    week: calculateCurrentWeek(canvasCourse.start_at),
    progress: calculateProgress(canvasCourse.start_at, canvasCourse.end_at),
    credits: 3, // Default value, would need to be configured
    average: Math.round(averageScore),
    attendance: 0, // Not directly available from Canvas
    passRate: Math.round(passRate),
    classAverage: Math.round(averageScore),
    totalStudents: studentCount,
    atRiskCount: atRiskCount,
    // Other fields would be populated as needed
  };
}

// Helper function to calculate current week of the course
function calculateCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

// Helper function to calculate course progress
function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();
  
  if (elapsedDuration <= 0) return 0;
  if (elapsedDuration >= totalDuration) return 100;
  
  return Math.round((elapsedDuration / totalDuration) * 100);
}

// Map Canvas student data to our application's student format
export function mapCanvasStudentToStudent(canvasStudent: CanvasStudent, canvasCourseId: number) {
  const enrollment = canvasStudent.enrollments.find(e => e.type === 'student');
  const score = enrollment?.grades?.current_score || 0;
  const grade = enrollment?.grades?.current_grade || '';
  
  return {
    id: canvasStudent.id.toString(),
    name: canvasStudent.name,
    email: canvasStudent.email,
    avatar: canvasStudent.avatar_url,
    score: score,
    level: calculateLevel(score),
    average: score,
    attendance: 0, // Not directly available from Canvas
    submissions: 0, // Would need to be calculated from submissions data
    status: score >= 70 ? 'active' : 'at-risk',
    trend: '0%', // Would need historical data to calculate
    badges: [], // Would need to be determined based on your gamification strategy
    progress: score,
    streak: 0, // Would need attendance/submission data to calculate
    grade: grade,
    courseId: canvasCourseId.toString(),
    course: {
      name: '', // To be filled in later
      code: '',
    },
  };
}

// Helper function to calculate student level based on score
export function calculateLevel(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

// Function to check if Canvas integration is active for a user
export async function isCanvasActive(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const config = await prisma.canvasConfig.findUnique({
      where: { userId }
    });
    
    return config?.isActive || false;
  } catch (error) {
    console.error('Error checking Canvas active status:', error);
    return false;
  }
} 