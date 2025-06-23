import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssignmentType } from '@prisma/client';

interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  course_id: number;
  submission_types: string[];
  published: boolean;
}

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}

// Utility function to make authenticated requests to Canvas API using user's config
async function canvasApiFetch(endpoint: string, canvasConfig: any) {
  const url = `${canvasConfig.apiUrl}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${canvasConfig.apiToken}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Map Canvas assignment type to our enum
function mapCanvasAssignmentType(submissionTypes: string[]): AssignmentType {
  if (submissionTypes.includes('online_quiz')) {
    return AssignmentType.QUIZ;
  } else if (submissionTypes.includes('discussion_topic')) {
    return AssignmentType.DISCUSSION;
  } else if (submissionTypes.includes('online_upload') && submissionTypes.length === 1) {
    return AssignmentType.PROJECT;
  } else if (submissionTypes.includes('external_tool')) {
    return AssignmentType.PROJECT;
  } else {
    return AssignmentType.ASSIGNMENT;
  }
}

// POST - Sync assignments from Canvas
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with Canvas config
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        canvasConfig: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.canvasConfig) {
      return NextResponse.json(
        { error: 'Canvas integration not configured. Please configure Canvas credentials first.' },
        { status: 400 }
      );
    }

    if (!user.canvasConfig.isActive) {
      return NextResponse.json(
        { error: 'Canvas integration is not active. Please activate Canvas integration first.' },
        { status: 400 }
      );
    }

    const canvasConfig = user.canvasConfig;
    let syncedCount = 0;
    let errors: string[] = [];

    try {
      // Fetch all courses from Canvas
      const canvasCourses: CanvasCourse[] = await canvasApiFetch('/courses?include[]=total_students&state[]=available', canvasConfig);
      
      // Get local courses that have Canvas course IDs
      const localCourses = await prisma.course.findMany({
        where: {
          instructorId: user.id,
          canvasCourseId: {
            not: null
          }
        }
      });

      // Create a map of Canvas course ID to local course
      const courseMap = new Map(
        localCourses.map(course => [course.canvasCourseId!, course])
      );

      // Sync assignments for each course
      for (const canvasCourse of canvasCourses) {
        const localCourse = courseMap.get(canvasCourse.id.toString());
        
        if (!localCourse) {
          // Skip courses that don't exist locally or don't belong to this user
          continue;
        }

        try {
          // Fetch assignments for this course from Canvas
          const canvasAssignments: CanvasAssignment[] = await canvasApiFetch(
            `/courses/${canvasCourse.id}/assignments`,
            canvasConfig
          );

          // Sync each assignment
          for (const canvasAssignment of canvasAssignments) {
            try {
              // Skip unpublished assignments
              if (!canvasAssignment.published) {
                continue;
              }

              // Check if assignment already exists locally
              const existingAssignment = await prisma.assignment.findFirst({
                where: {
                  canvasAssignmentId: canvasAssignment.id.toString(),
                  courseId: localCourse.id
                }
              });

              const assignmentData = {
                title: canvasAssignment.name,
                description: canvasAssignment.description || null,
                dueDate: canvasAssignment.due_at ? new Date(canvasAssignment.due_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
                pointsPossible: canvasAssignment.points_possible || 100,
                weight: 1,
                assignmentType: mapCanvasAssignmentType(canvasAssignment.submission_types),
                courseId: localCourse.id,
                canvasAssignmentId: canvasAssignment.id.toString()
              };

              if (existingAssignment) {
                // Update existing assignment
                await prisma.assignment.update({
                  where: { id: existingAssignment.id },
                  data: {
                    title: assignmentData.title,
                    description: assignmentData.description,
                    dueDate: assignmentData.dueDate,
                    pointsPossible: assignmentData.pointsPossible,
                    assignmentType: assignmentData.assignmentType,
                    // Don't update weight and courseId for existing assignments
                  }
                });
              } else {
                // Create new assignment
                await prisma.assignment.create({
                  data: assignmentData
                });
                syncedCount++;
              }
            } catch (assignmentError) {
              console.error(`Error syncing assignment ${canvasAssignment.id}:`, assignmentError);
              errors.push(`Failed to sync assignment "${canvasAssignment.name}": ${assignmentError}`);
            }
          }
        } catch (courseError) {
          console.error(`Error fetching assignments for course ${canvasCourse.id}:`, courseError);
          errors.push(`Failed to fetch assignments for course "${canvasCourse.name}": ${courseError}`);
        }
      }

      // Update last synced timestamp
      await prisma.canvasConfig.update({
        where: { userId: user.id },
        data: { lastSyncedAt: new Date() }
      });

      return NextResponse.json({
        message: 'Canvas sync completed',
        synced: syncedCount,
        errors: errors,
        timestamp: new Date().toISOString()
      });

    } catch (canvasError) {
      console.error('Canvas API error:', canvasError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to Canvas API. Please check your Canvas credentials and try again.',
          details: canvasError instanceof Error ? canvasError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error syncing Canvas assignments:', error);
    return NextResponse.json(
      { error: 'Failed to sync assignments from Canvas' },
      { status: 500 }
    );
  }
} 