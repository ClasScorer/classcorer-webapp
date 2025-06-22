import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface CanvasUser {
  id: string;
  name: string;
  email: string;
  login_id?: string;
  sis_user_id?: string;
  created_at?: string;
  last_login?: string;
}

interface CanvasCourse {
  id: string;
  name: string;
  course_code?: string;
  workflow_state?: string;
  start_at?: string;
  end_at?: string;
  enrollment_type?: string;
}

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { apiUrl, authToken, userEmail } = body;

    if (!apiUrl || !authToken || !userEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: apiUrl, authToken, userEmail' 
      }, { status: 400 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    let syncResult = {
      coursesProcessed: 0,
      coursesCreated: 0,
      coursesUpdated: 0,
      studentsProcessed: 0,
      studentsCreated: 0,
      studentsUpdated: 0,
      enrollmentsCreated: 0,
      errors: [] as string[]
    };

    // Step 1: Find the Canvas user by email
    const usersResponse = await fetch(`${apiUrl}/users`, { 
      headers,
      signal: AbortSignal.timeout(30000)
    });

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status}`);
    }

    const users: CanvasUser[] = await usersResponse.json();
    console.log(`Found ${users.length} total users in Canvas`);
    console.log(`Searching for user with email: ${userEmail}`);
    
    const canvasUser = users.find(u => 
      u.email && u.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (!canvasUser) {
      console.log('Available user emails:', users.map(u => u.email).filter(Boolean));
      return NextResponse.json({ 
        error: `No Canvas user found with email: ${userEmail}. Available emails: ${users.map(u => u.email).filter(Boolean).join(', ')}` 
      }, { status: 404 });
    }

    console.log(`Found Canvas user: ${canvasUser.name} (ID: ${canvasUser.id})`);

    // Step 2: Get user's courses from Canvas
    const coursesResponse = await fetch(`${apiUrl}/users/${canvasUser.id}/courses`, {
      headers,
      signal: AbortSignal.timeout(30000)
    });

    if (!coursesResponse.ok) {
      throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
    }

    const canvasCourses: CanvasCourse[] = await coursesResponse.json();

    console.log(`Found ${canvasCourses.length} courses for user ${canvasUser.name}`);
    console.log('Course details:', canvasCourses.map(c => ({ id: c.id, name: c.name, code: c.course_code })));

    if (canvasCourses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No courses found for this user',
        result: {
          ...syncResult,
          errors: ['No courses found for the specified user. Make sure the email matches a Canvas instructor account.']
        }
      });
    }

    // Step 3: Process each course
    for (const canvasCourse of canvasCourses) {
      try {
        console.log(`Processing course: ${canvasCourse.name} (ID: ${canvasCourse.id})`);
        syncResult.coursesProcessed++;

        // Check if course already exists in local database
        console.log(`Checking for existing course with Canvas ID: ${canvasCourse.id} or code: ${canvasCourse.course_code}`);
        
        let localCourse = await prisma.course.findFirst({
          where: {
            OR: [
              { canvasCourseId: canvasCourse.id },
              { 
                AND: [
                  { code: canvasCourse.course_code || `CANVAS-${canvasCourse.id}` },
                  { instructorId: session.user.id }
                ]
              }
            ]
          }
        });

        console.log(`Existing course found: ${localCourse ? 'Yes' : 'No'}`);

        if (localCourse) {
          // Update existing course
          try {
            localCourse = await prisma.course.update({
              where: { id: localCourse.id },
              data: {
                name: canvasCourse.name,
                code: canvasCourse.course_code || `CANVAS-${canvasCourse.id}`,
                canvasCourseId: canvasCourse.id,
                startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
                endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
              }
            });
            syncResult.coursesUpdated++;
            console.log(`✅ Updated existing course: ${canvasCourse.name}`);
          } catch (updateError) {
            console.error(`❌ Error updating course ${canvasCourse.name}:`, updateError);
            syncResult.errors.push(`Failed to update course ${canvasCourse.name}: ${updateError}`);
            continue;
          }
        } else {
          // Create new course
          try {
            localCourse = await prisma.course.create({
              data: {
                name: canvasCourse.name,
                code: canvasCourse.course_code || `CANVAS-${canvasCourse.id}`,
                canvasCourseId: canvasCourse.id,
                instructorId: session.user.id,
                startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
                endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
              }
            });
            syncResult.coursesCreated++;
            console.log(`✅ Created new course: ${canvasCourse.name}`);
          } catch (createError) {
            console.error(`❌ Error creating course ${canvasCourse.name}:`, createError);
            syncResult.errors.push(`Failed to create course ${canvasCourse.name}: ${createError}`);
            continue;
          }
        }

        // Step 4: Get students for this course (with fallback method)
        let canvasStudents: CanvasStudent[] = [];
        
        try {
          // Primary method: Try with enrollment filter
          const studentsResponse = await fetch(
            `${apiUrl}/courses/${canvasCourse.id}/users?enrollment_type[]=student`,
            {
              headers,
              signal: AbortSignal.timeout(15000)
            }
          );

          if (studentsResponse.ok) {
            canvasStudents = await studentsResponse.json();
          } else {
            throw new Error(`Primary method failed: ${studentsResponse.status}`);
          }
        } catch (primaryError) {
          // Fallback method: Get all users and filter by course enrollment
          try {
            console.log(`Primary method failed for course ${canvasCourse.name}, trying fallback...`);
            
            // Get all users first
            const allUsersResponse = await fetch(`${apiUrl}/users`, { 
              headers,
              signal: AbortSignal.timeout(15000)
            });
            
            if (!allUsersResponse.ok) {
              throw new Error(`Failed to fetch all users: ${allUsersResponse.status}`);
            }
            
            const allUsers: CanvasUser[] = await allUsersResponse.json();
            
            // Check each user's courses to find students enrolled in this course
            for (const user of allUsers) {
              try {
                const userCoursesResponse = await fetch(`${apiUrl}/users/${user.id}/courses`, {
                  headers,
                  signal: AbortSignal.timeout(10000)
                });
                
                if (userCoursesResponse.ok) {
                  const userCourses: CanvasCourse[] = await userCoursesResponse.json();
                  const isEnrolledInCourse = userCourses.some(course => 
                    course.id === canvasCourse.id && 
                    (course.enrollment_type === 'student' || !course.enrollment_type)
                  );
                  
                  if (isEnrolledInCourse) {
                    canvasStudents.push({
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      sis_user_id: user.sis_user_id,
                      enrollments: [{ 
                        type: 'StudentEnrollment',
                        role: 'Student'
                      }]
                    });
                  }
                }
              } catch (userError) {
                // Skip this user if there's an error
                console.error(`Error checking courses for user ${user.name}:`, userError);
              }
            }
            
            console.log(`Fallback method found ${canvasStudents.length} students for course ${canvasCourse.name}`);
            
          } catch (fallbackError) {
            console.error(`Both methods failed for course ${canvasCourse.name}:`, fallbackError);
            syncResult.errors.push(`Failed to fetch students for course ${canvasCourse.name}: ${fallbackError}`);
            continue; // Skip to next course
          }
        }

        // Process the students we found
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
                  { canvasStudentId: canvasStudent.id },
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
                    canvasStudentId: canvasStudent.id,
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
                    canvasStudentId: canvasStudent.id,
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
      }
    }

    // Update user's Canvas config if it exists
    try {
      await prisma.canvasConfig.upsert({
        where: { userId: session.user.id },
        update: {
          apiUrl: apiUrl,
          apiToken: authToken,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          apiUrl: apiUrl,
          apiToken: authToken,
          isActive: true,
          lastSyncedAt: new Date(),
        }
      });
    } catch (configError) {
      console.error('Error updating Canvas config:', configError);
      syncResult.errors.push('Failed to update Canvas configuration');
    }

    return NextResponse.json({
      success: true,
      message: 'Canvas sync completed',
      result: syncResult
    });

  } catch (error) {
    console.error('Canvas sync error:', error);
    return NextResponse.json(
      { error: `Canvas sync failed: ${error}` },
      { status: 500 }
    );
  }
} 