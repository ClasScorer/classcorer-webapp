import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication - but allow development access
    let userId = 'dev-user-id';
    let isDevMode = false;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id as string;
      } else if (process.env.NODE_ENV === 'production') {
        // Only enforce strict auth in production
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      } else {
        isDevMode = true;
        console.log('DEV MODE: Using dev-user-id for authentication');
      }
    } catch (authError) {
      console.warn('Auth check failed, using development fallback:', authError);
      // Continue with development fallback in dev mode
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      isDevMode = true;
    }

    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.lecture_id || !body.faces || !body.summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if lecture exists and belongs to user
    const lecture = await prisma.lecture.findUnique({
      where: { id: body.lecture_id },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }
    
    // Skip permission check in dev mode
    if (!isDevMode && lecture.course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to access this lecture' },
        { status: 403 }
      );
    }
    
    // Process each face detected
    const processedFaces = {
      known: 0,
      new: 0,
      updated: 0,
      total: body.faces.length
    };
    
    // For each face, update or create attendance record
    for (const face of body.faces) {
      // Skip if not a known person
      if (face.recognition_status !== 'known') {
        processedFaces.new++;
        continue;
      }
      
      processedFaces.known++;
      
      // Get or create attendance record
      try {
        // Try to find existing attendance record
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            lectureId: body.lecture_id,
            studentId: face.person_id
          }
        });
        
        if (existingAttendance) {
          // Update existing record
          await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              status: 'PRESENT',
              leaveTime: new Date()
            }
          });
        } else {
          // Create new attendance record
          await prisma.attendance.create({
            data: {
              lectureId: body.lecture_id,
              studentId: face.person_id,
              joinTime: new Date(),
              status: 'PRESENT',
              leaveTime: null
            }
          });
        }
        
        // Save engagement data to StudentEngagement model
        await prisma.studentEngagement.create({
          data: {
            lectureId: body.lecture_id,
            studentId: face.person_id,
            timestamp: new Date(),
            focusScore: face.attention_status === 'focused' ? 100 : 50,
            distractionCount: face.attention_status === 'unfocused' ? 1 : 0,
            engagementLevel: face.attention_status === 'focused' ? 'high' : 'medium',
            handRaisedCount: face.hand_raising_status?.is_hand_raised ? 1 : 0,
            recognitionStatus: face.recognition_status
          }
        });
        
        processedFaces.updated++;
      } catch (error) {
        console.error(`Error processing face data for ${face.person_id}:`, error);
        // Continue with other faces
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processedFaces,
      timestamp: new Date().toISOString(),
      total_faces: body.total_faces
    });
    
  } catch (error) {
    console.error('Error processing engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to process engagement data', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication - but allow development access
    let userId = 'dev-user-id';
    let isDevMode = false;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id as string;
      } else if (process.env.NODE_ENV === 'production') {
        // Only enforce strict auth in production
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      } else {
        isDevMode = true;
      }
    } catch (authError) {
      console.warn('Auth check failed, using development fallback:', authError);
      // Continue with development fallback in dev mode
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      isDevMode = true;
    }
    
    const url = new URL(req.url);
    const lectureId = url.searchParams.get('lectureId');
    const studentId = url.searchParams.get('studentId');
    
    if (!lectureId) {
      return NextResponse.json(
        { error: 'Missing lectureId parameter' },
        { status: 400 }
      );
    }
    
    // Check if lecture belongs to the current user
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    });
    
    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }
    
    // Skip permission check in dev mode
    if (!isDevMode && lecture.course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to access this lecture data' },
        { status: 403 }
      );
    }
    
    // Query engagement data based on parameters
    const whereClause: any = { lectureId };
    if (studentId) whereClause.studentId = studentId;
    
    const engagementData = await prisma.studentEngagement.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });
    
    return NextResponse.json(engagementData);
    
  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data', details: String(error) },
      { status: 500 }
    );
  }
} 