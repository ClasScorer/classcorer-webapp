import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface CanvasStudent {
  id: string;
  name: string;
  email?: string;
  sis_user_id?: string;
  enrollments?: Array<{
    type: string;
    role: string;
  }>;
}

interface CanvasCourse {
  id: string;
  name: string;
  course_code?: string;
  workflow_state?: string;
  start_at?: string;
  end_at?: string;
  enrollment_type?: string;
  students?: CanvasStudent[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { apiUrl, authToken, course } = body;

    if (!apiUrl || !authToken || !course) {
      return NextResponse.json({ 
        error: 'Missing required fields: apiUrl, authToken, course' 
      }, { status: 400 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    let syncResult = {
      courseCreated: false,
      courseUpdated: false,
      studentsProcessed: 0,
      studentsCreated: 0,
      studentsUpdated: 0,
      enrollmentsCreated: 0,
      errors: [] as string[]
    };

    const canvasCourse: CanvasCourse = course;

    try {
      console.log(`Processing course: ${canvasCourse.name} (ID: ${canvasCourse.id})`);

      // Check if course already exists in local database
      console.log(`Checking for existing course with Canvas ID: ${canvasCourse.id} or code: ${canvasCourse.course_code}`);
      
      let localCourse = await prisma.course.findFirst({
        where: {
          OR: [
            { canvasCourseId: String(canvasCourse.id) },
            { 
              AND: [
                { code: canvasCourse.course_code || `CANVAS-${canvasCourse.id}` },
                { instructorId: session.user.id }
              ]
            }
          ]
        }
      });

      // If no course found by Canvas ID or code+instructor, check if code exists globally
      let proposedCode = canvasCourse.course_code || `CANVAS-${canvasCourse.id}`;
      if (!localCourse) {
        const existingCourseWithCode = await prisma.course.findUnique({
          where: { code: proposedCode }
        });
        
        if (existingCourseWithCode) {
          // Generate a unique code by appending instructor info
          proposedCode = `${proposedCode}-${session.user.id.slice(-8)}`;
          console.log(`Code conflict detected, using unique code: ${proposedCode}`);
        }
      }

      console.log(`Existing course found: ${localCourse ? 'Yes' : 'No'}`);

      if (localCourse) {
        // Update existing course
        try {
          localCourse = await prisma.course.update({
            where: { id: localCourse.id },
            data: {
              name: canvasCourse.name,
              code: proposedCode,
              canvasCourseId: String(canvasCourse.id),
              startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
              endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
            }
          });
          syncResult.courseUpdated = true;
          console.log(`✅ Updated existing course: ${canvasCourse.name}`);
        } catch (updateError) {
          console.error(`❌ Error updating course ${canvasCourse.name}:`, updateError);
          syncResult.errors.push(`Failed to update course ${canvasCourse.name}: ${updateError}`);
          return NextResponse.json({
            success: false,
            error: `Failed to update course: ${updateError}`,
            result: syncResult
          }, { status: 500 });
        }
      } else {
        // Create new course
        try {
          localCourse = await prisma.course.create({
            data: {
              name: canvasCourse.name,
              code: proposedCode,
              canvasCourseId: String(canvasCourse.id),
              instructorId: session.user.id,
              startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
              endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
            }
          });
          syncResult.courseCreated = true;
          console.log(`✅ Created new course: ${canvasCourse.name}`);
        } catch (createError) {
          console.error(`❌ Error creating course ${canvasCourse.name}:`, createError);
          syncResult.errors.push(`Failed to create course ${canvasCourse.name}: ${createError}`);
          return NextResponse.json({
            success: false,
            error: `Failed to create course: ${createError}`,
            result: syncResult
          }, { status: 500 });
        }
      }

      // Step 2: Get students for this course if not already provided
      let canvasStudents: CanvasStudent[] = canvasCourse.students || [];
      
      if (!canvasCourse.students || canvasCourse.students.length === 0) {
        try {
          // Try to fetch students from Canvas API
          const studentsResponse = await fetch(
            `${apiUrl}/courses/${canvasCourse.id}/users?enrollment_type[]=student`,
            {
              headers
            }
          );

          if (studentsResponse.ok) {
            canvasStudents = await studentsResponse.json();
          } else {
            console.log(`No students found or access denied for course ${canvasCourse.name}`);
          }
        } catch (studentsError) {
          console.error(`Error fetching students for course ${canvasCourse.name}:`, studentsError);
          syncResult.errors.push(`Failed to fetch students: ${studentsError}`);
        }
      }

      // Process the students
      console.log(`Processing ${canvasStudents.length} students for course ${canvasCourse.name}`);
      
      for (const canvasStudent of canvasStudents) {
        try {
          syncResult.studentsProcessed++;
          console.log(`Processing student: ${canvasStudent.name} (${canvasStudent.email})`);

          if (!canvasStudent.email) {
            console.log(`❌ Student ${canvasStudent.name} has no email address`);
            syncResult.errors.push(`Student ${canvasStudent.name} has no email address`);
            continue;
          }

          // Check if student already exists
          console.log(`Checking for existing student with Canvas ID: ${canvasStudent.id} or email: ${canvasStudent.email}`);
          
          let localStudent = await prisma.student.findFirst({
            where: {
              OR: [
                { canvasStudentId: String(canvasStudent.id) },
                { email: canvasStudent.email }
              ]
            }
          });

          console.log(`Existing student found: ${localStudent ? 'Yes' : 'No'}`);

          if (localStudent) {
            // Update existing student
            try {
              localStudent = await prisma.student.update({
                where: { id: localStudent.id },
                data: {
                  name: canvasStudent.name,
                  email: canvasStudent.email,
                  canvasStudentId: String(canvasStudent.id),
                  professorId: session.user.id,
                }
              });
              syncResult.studentsUpdated++;
              console.log(`✅ Updated existing student: ${canvasStudent.name}`);
            } catch (updateError) {
              console.error(`❌ Error updating student ${canvasStudent.name}:`, updateError);
              syncResult.errors.push(`Failed to update student ${canvasStudent.name}: ${updateError}`);
              continue;
            }
          } else {
            // Create new student
            try {
              localStudent = await prisma.student.create({
                data: {
                  name: canvasStudent.name,
                  email: canvasStudent.email,
                  canvasStudentId: String(canvasStudent.id),
                  professorId: session.user.id,
                }
              });
              syncResult.studentsCreated++;
              console.log(`✅ Created new student: ${canvasStudent.name}`);
            } catch (createError) {
              console.error(`❌ Error creating student ${canvasStudent.name}:`, createError);
              syncResult.errors.push(`Failed to create student ${canvasStudent.name}: ${createError}`);
              continue;
            }
          }

          // Check if enrollment exists
          console.log(`Checking enrollment for student ${localStudent.id} in course ${localCourse.id}`);
          
          try {
            const existingEnrollment = await prisma.studentEnrollment.findUnique({
              where: {
                studentId_courseId: {
                  studentId: localStudent.id,
                  courseId: localCourse.id
                }
              }
            });

            console.log(`Existing enrollment found: ${existingEnrollment ? 'Yes' : 'No'}`);

            if (!existingEnrollment) {
              // Create enrollment
              await prisma.studentEnrollment.create({
                data: {
                  studentId: localStudent.id,
                  courseId: localCourse.id,
                  status: 'ACTIVE'
                }
              });
              syncResult.enrollmentsCreated++;
              console.log(`✅ Created enrollment for ${canvasStudent.name} in ${canvasCourse.name}`);
            } else {
              console.log(`ℹ️ Enrollment already exists for ${canvasStudent.name} in ${canvasCourse.name}`);
            }
          } catch (enrollmentError) {
            console.error(`❌ Error creating enrollment for ${canvasStudent.name}:`, enrollmentError);
            syncResult.errors.push(`Failed to create enrollment for ${canvasStudent.name}: ${enrollmentError}`);
          }

        } catch (studentError) {
          console.error(`❌ Error processing student ${canvasStudent.name}:`, studentError);
          syncResult.errors.push(`Failed to process student ${canvasStudent.name}: ${studentError}`);
        }
      }

    } catch (courseError) {
      console.error(`Error processing course ${canvasCourse.name}:`, courseError);
      syncResult.errors.push(`Failed to process course ${canvasCourse.name}: ${courseError}`);
      return NextResponse.json({
        success: false,
        error: `Failed to process course: ${courseError}`,
        result: syncResult
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced course: ${canvasCourse.name}`,
      result: syncResult
    });

  } catch (error) {
    console.error('Canvas course sync error:', error);
    return NextResponse.json(
      { error: `Canvas course sync failed: ${error}` },
      { status: 500 }
    );
  }
} 