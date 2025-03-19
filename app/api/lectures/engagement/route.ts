import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.lecture_id || !data.faces || !data.summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First check if lecture exists and belongs to the current user
    const lecture = await prisma.lecture.findUnique({
      where: { id: data.lecture_id },
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

    if (lecture.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this lecture' },
        { status: 403 }
      );
    }

    // Now process each face detected
    const timestamp = new Date(data.timestamp || new Date());
    
    // First, update lecture status if not already active
    if (!lecture.isActive) {
      await prisma.lecture.update({
        where: { id: data.lecture_id },
        data: { isActive: true }
      });
    }

    // Process each known face (student)
    for (const face of data.faces.filter(f => f.recognition_status === 'known')) {
      const studentId = face.person_id;
      
      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) continue; // Skip if student not found
      
      // Update or create attendance record for the student
      await prisma.attendance.upsert({
        where: {
          studentId_lectureId: {
            studentId,
            lectureId: data.lecture_id
          }
        },
        update: {
          status: 'PRESENT',
          leaveTime: new Date() // Update leave time to current time
        },
        create: {
          studentId,
          lectureId: data.lecture_id,
          status: 'PRESENT',
          joinTime: new Date(),
          leaveTime: new Date()
        }
      });

      // Save engagement data - first check if there's an existing record
      const existingEngagement = await prisma.studentEngagement.findUnique({
        where: {
          studentId_lectureId: {
            studentId,
            lectureId: data.lecture_id
          }
        }
      });

      if (existingEngagement) {
        // Calculate new engagement metrics based on existing and new data
        const detectionCount = existingEngagement.detectionCount + 1;
        const wasAttentive = face.attention_status === 'focused';
        const focusScore = Math.round(
          (existingEngagement.focusScore * existingEngagement.detectionCount + (wasAttentive ? 100 : 0)) / detectionCount
        );
        
        // Update distractionCount if student was not focused
        const distractionCount = wasAttentive 
          ? existingEngagement.distractionCount 
          : existingEngagement.distractionCount + 1;

        // Determine engagement level
        let engagementLevel = 'medium';
        if (focusScore >= 75) engagementLevel = 'high';
        else if (focusScore <= 30) engagementLevel = 'low';

        // Update handRaisedCount if hand was raised
        const handRaisedCount = face.hand_raising_status?.is_hand_raised
          ? existingEngagement.handRaisedCount + 1
          : existingEngagement.handRaisedCount;

        // Calculate average confidence
        const averageConfidence = (
          (existingEngagement.averageConfidence * existingEngagement.detectionCount + face.confidence) /
          detectionCount
        );
          
        // Increment attention duration if student was focused (in seconds)
        const attentionDuration = wasAttentive 
          ? existingEngagement.attentionDuration + 5 // Assuming 5 second intervals
          : existingEngagement.attentionDuration;

        // Store snapshot of the detection data
        const detectionSnapshots = [
          ...existingEngagement.detectionSnapshots,
          {
            timestamp: timestamp.toISOString(),
            attention_status: face.attention_status,
            bounding_box: face.bounding_box,
            confidence: face.confidence,
            hand_raised: face.hand_raising_status?.is_hand_raised || false
          }
        ].slice(-50); // Keep last 50 snapshots
        
        // Update the engagement record
        await prisma.studentEngagement.update({
          where: {
            studentId_lectureId: {
              studentId,
              lectureId: data.lecture_id
            }
          },
          data: {
            detectionCount,
            focusScore,
            distractionCount,
            engagementLevel,
            handRaisedCount,
            averageConfidence,
            attentionDuration,
            detectionSnapshots
          }
        });
      } else {
        // Create new engagement record
        const wasAttentive = face.attention_status === 'focused';
        
        await prisma.studentEngagement.create({
          data: {
            lectureId: data.lecture_id,
            studentId,
            detectionCount: 1,
            focusScore: wasAttentive ? 100 : 0,
            distractionCount: wasAttentive ? 0 : 1,
            handRaisedCount: face.hand_raising_status?.is_hand_raised ? 1 : 0,
            attentionDuration: wasAttentive ? 5 : 0, // Assuming 5 second intervals
            recognitionStatus: face.recognition_status,
            engagementLevel: wasAttentive ? 'high' : 'low',
            averageConfidence: face.confidence || 0,
            detectionSnapshots: [{
              timestamp: timestamp.toISOString(),
              attention_status: face.attention_status,
              bounding_box: face.bounding_box,
              confidence: face.confidence,
              hand_raised: face.hand_raising_status?.is_hand_raised || false
            }]
          }
        });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Engagement data saved successfully',
      processed_faces: data.faces.filter(f => f.recognition_status === 'known').length,
      total_faces: data.total_faces
    });
    
  } catch (error) {
    console.error('Error processing engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to process engagement data' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    
    if (lecture.course.instructorId !== session.user.id) {
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
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
} 