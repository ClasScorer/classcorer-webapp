import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { loadStudents } from "@/lib/data"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    // Enhanced logging for auth debugging
    console.log('Students API - Auth session check:', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'not available' 
    });
    
    if (!session?.user) {
      console.error('Authentication failed: No valid session user found');
      return NextResponse.json({ error: 'Unauthorized: No valid session' }, { status: 401 })
    }
    
    if (!session.user.id) {
      console.error('Authentication issue: User ID missing in session');
      return NextResponse.json({ error: 'Unauthorized: User ID missing' }, { status: 401 })
    }
    
    // Get the user's ID from the session
    const userId = session.user.id;
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const include = searchParams.get('include');
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '1000'); // Increased from 10 to 1000 to ensure we get all students
    const minGrade = searchParams.get('minGrade') ? parseInt(searchParams.get('minGrade') || '0') : undefined;
    const maxGrade = searchParams.get('maxGrade') ? parseInt(searchParams.get('maxGrade') || '100') : undefined;
    const minAttendance = searchParams.get('minAttendance') ? parseInt(searchParams.get('minAttendance') || '0') : undefined;
    const engagementLevel = searchParams.get('engagementLevel');
    const status = searchParams.get('status');

    // Build where conditions
    let whereConditions: Prisma.StudentWhereInput = {};

    // Course filter
    if (courseId) {
      console.log(`Filtering students by courseId: ${courseId}`);
      
      // Check how many enrollments exist for this course
      const enrollmentsCount = await prisma.studentEnrollment.count({
        where: { courseId }
      });
      console.log(`Found ${enrollmentsCount} enrollments for courseId: ${courseId}`);
      
      // Include enrollments for the specified course
      whereConditions.enrollments = {
        some: {
          courseId
        }
      };
    } else {
      // If no courseId is provided, get all students for the current user
      console.log(`No courseId provided, getting all students for user: ${userId}`);
      
      // Get all students enrolled in courses taught by this user
      whereConditions = {
        enrollments: {
          some: {
            course: {
              instructorId: userId
            }
          }
        }
      };
      
      // Log what we're doing
      console.log("Using query to find all students enrolled in current user's courses");
    }

    // Text search (name or email)
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Include relations based on request
    const includeRelations = include === 'all' ? {
      enrollments: {
        include: {
          course: true
        }
      },
      submissions: {
        include: {
          assignment: true
        }
      },
      attendances: true,
      engagements: true,
      badges: {
        include: {
          badge: true
        }
      }
    } : {
      enrollments: true
    };

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: whereConditions
    });

    // Apply pagination
    const skip = (page - 1) * limit;

    // Get students with pagination
    const students = await prisma.student.findMany({
      where: whereConditions,
      include: includeRelations,
      skip,
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    // Extra logging for debugging
    console.log(`Found ${students.length} students matching query. Pagination: page ${page}, limit ${limit}, skip ${skip}`);
    if (students.length > 0) {
      console.log('First few students:');
      students.slice(0, 3).forEach(student => {
        console.log({
          id: student.id,
          name: student.name,
          enrollmentsCount: student.enrollments?.length || 0,
          enrollmentCourseIds: student.enrollments?.map(e => e.courseId) || []
        });
      });
    }

    // Post-process filtering for complex conditions
    // These filters need the relational data so we do them in memory
    let filteredStudents = students;

    // Apply grade filter
    if (minGrade !== undefined || maxGrade !== undefined) {
      filteredStudents = filteredStudents.filter(student => {
        const studentSubmissions = student.submissions as any[];
        if (!Array.isArray(studentSubmissions) || studentSubmissions.length === 0) {
          return minGrade === 0; // Only include students with no submissions if min grade is 0
        }
        
        const avgGrade = studentSubmissions.reduce((sum, sub) => 
          sum + (sub.score || 0), 0) / studentSubmissions.length;
        
        if (minGrade !== undefined && avgGrade < minGrade) return false;
        if (maxGrade !== undefined && avgGrade > maxGrade) return false;
        
        return true;
      });
    }

    // Apply attendance filter
    if (minAttendance !== undefined) {
      filteredStudents = filteredStudents.filter(student => {
        const studentAttendances = student.attendances as any[];
        if (!Array.isArray(studentAttendances) || studentAttendances.length === 0) {
          return minAttendance === 0; // Only include students with no attendance if min attendance is 0
        }
        
        const presentCount = studentAttendances.filter(att => att.status === 'PRESENT').length;
        const attendanceRate = (presentCount / studentAttendances.length) * 100;
        
        return attendanceRate >= minAttendance;
      });
    }

    // Apply engagement level filter
    if (engagementLevel) {
      filteredStudents = filteredStudents.filter(student => {
        const studentEngagements = student.engagements as any[];
        if (!Array.isArray(studentEngagements) || studentEngagements.length === 0) {
          return engagementLevel === 'low'; // Students with no engagement are considered low
        }
        
        const avgEngagement = studentEngagements.reduce((sum, eng) => 
          sum + eng.focusScore, 0) / studentEngagements.length;
        
        const level = 
          avgEngagement >= 80 ? 'high' :
          avgEngagement >= 50 ? 'medium' : 'low';
        
        return level === engagementLevel;
      });
    }

    // Apply status filter
    if (status) {
      filteredStudents = filteredStudents.filter(student => {
        const studentSubmissions = student.submissions as any[];
        if (!Array.isArray(studentSubmissions) || studentSubmissions.length === 0) {
          return status === 'Needs Help'; // Students with no submissions need help
        }
        
        const avgGrade = studentSubmissions.reduce((sum, sub) => 
          sum + (sub.score || 0), 0) / studentSubmissions.length;
        
        const gradeStatus = 
          avgGrade >= 85 ? 'Excellent' :
          avgGrade >= 70 ? 'Good' : 'Needs Help';
        
        return gradeStatus === status;
      });
    }

    // Adjust count if filtered in memory
    const filteredCount = filteredStudents.length !== students.length 
      ? await calculateFilteredCount(
          whereConditions, 
          minGrade, 
          maxGrade, 
          minAttendance, 
          engagementLevel || undefined, 
          status || undefined
        )
      : totalCount;

    return NextResponse.json({
      students: filteredStudents,
      total: filteredCount,
      page,
      limit,
      totalPages: Math.ceil(filteredCount / limit)
    });
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// Helper function to calculate total count with all filters
async function calculateFilteredCount(
  baseWhere: Prisma.StudentWhereInput,
  minGrade?: number,
  maxGrade?: number,
  minAttendance?: number,
  engagementLevel?: string,
  status?: string
): Promise<number> {
  // For complex filters, we might need to fetch all matching records and count
  // This is a simplified version and may not be efficient for large datasets
  // In a real app, you'd use database-specific optimizations
  
  const students = await prisma.student.findMany({
    where: baseWhere,
    include: {
      submissions: true,
      attendances: true,
      engagements: true
    }
  });
  
  let filtered = students;
  
  // Apply the same filters as in the main query
  if (minGrade !== undefined || maxGrade !== undefined) {
    filtered = filtered.filter(student => {
      const studentSubmissions = student.submissions;
      if (!studentSubmissions || studentSubmissions.length === 0) {
        return minGrade === 0;
      }
      
      const avgGrade = studentSubmissions.reduce((sum, sub) => 
        sum + (sub.score || 0), 0) / studentSubmissions.length;
      
      if (minGrade !== undefined && avgGrade < minGrade) return false;
      if (maxGrade !== undefined && avgGrade > maxGrade) return false;
      
      return true;
    });
  }
  
  if (minAttendance !== undefined) {
    filtered = filtered.filter(student => {
      const studentAttendances = student.attendances;
      if (!studentAttendances || studentAttendances.length === 0) {
        return minAttendance === 0;
      }
      
      const presentCount = studentAttendances.filter(att => att.status === 'PRESENT').length;
      const attendanceRate = (presentCount / studentAttendances.length) * 100;
      
      return attendanceRate >= minAttendance;
    });
  }
  
  if (engagementLevel) {
    filtered = filtered.filter(student => {
      const studentEngagements = student.engagements;
      if (!studentEngagements || studentEngagements.length === 0) {
        return engagementLevel === 'low';
      }
      
      const avgEngagement = studentEngagements.reduce((sum, eng) => 
        sum + eng.focusScore, 0) / studentEngagements.length;
      
      const level = 
        avgEngagement >= 80 ? 'high' :
        avgEngagement >= 50 ? 'medium' : 'low';
      
      return level === engagementLevel;
    });
  }
  
  if (status) {
    filtered = filtered.filter(student => {
      const studentSubmissions = student.submissions;
      if (!studentSubmissions || studentSubmissions.length === 0) {
        return status === 'Needs Help';
      }
      
      const avgGrade = studentSubmissions.reduce((sum, sub) => 
        sum + (sub.score || 0), 0) / studentSubmissions.length;
      
      const gradeStatus = 
        avgGrade >= 85 ? 'Excellent' :
        avgGrade >= 70 ? 'Good' : 'Needs Help';
      
      return gradeStatus === status;
    });
  }
  
  return filtered.length;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, courseId } = body;

    // Validate required fields
    if (!name || !email || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this email already exists" },
        { status: 400 }
      );
    }

    // Create new student and enrollment
    const student = await prisma.student.create({
      data: {
        name,
        email,
        enrollments: {
          create: {
            courseId,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
} 