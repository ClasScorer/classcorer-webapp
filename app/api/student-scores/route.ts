import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define scoring values
const SCORING = {
  CORRECT_ANSWER: 10,
  ATTEMPTED_ANSWER: 5,
  PENALIZE: -5,
  CUSTOM_POINTS: 0 // Will be specified in request
};

export async function POST(request: Request) {
  try {
    const { studentId, lectureId, actionType, customPoints } = await request.json();

    if (!studentId || !lectureId) {
      return NextResponse.json(
        { error: 'Student ID and Lecture ID are required' },
        { status: 400 }
      );
    }

    // Get existing engagement record or create one
    let engagement = await prisma.studentEngagement.findUnique({
      where: {
        studentId_lectureId: {
          studentId,
          lectureId
        }
      }
    });

    let pointsToAdd = 0;

    // Calculate points based on action type
    switch (actionType) {
      case 1: // Correct Answer
        pointsToAdd = SCORING.CORRECT_ANSWER;
        break;
      case 2: // Attempted Answer
        pointsToAdd = SCORING.ATTEMPTED_ANSWER;
        break;
      case 3: // Penalize
        pointsToAdd = SCORING.PENALIZE;
        break;
      case 5: // Custom Points
        pointsToAdd = customPoints || 0;
        break;
      default:
        pointsToAdd = 0;
    }

    if (engagement) {
      // Update existing record
      engagement = await prisma.studentEngagement.update({
        where: {
          id: engagement.id
        },
        data: {
          focusScore: Math.max(0, Math.min(100, engagement.focusScore + pointsToAdd)), // Keep between 0-100
          // For actions 1 and 2 (answers), also increase engagement metrics
          ...(actionType === 1 || actionType === 2 ? {
            engagementLevel: "high",
            handRaisedCount: { increment: 1 } 
          } : {})
        }
      });
    } else {
      // Create new record with initial values
      engagement = await prisma.studentEngagement.create({
        data: {
          studentId,
          lectureId,
          focusScore: Math.max(0, Math.min(100, 50 + pointsToAdd)), // Start at 50, apply action
          attentionDuration: 0,
          distractionCount: 0,
          handRaisedCount: actionType === 1 || actionType === 2 ? 1 : 0,
          recognitionStatus: "known",
          engagementLevel: actionType === 1 || actionType === 2 ? "high" : "medium",
          detectionCount: 1,
          averageConfidence: 1.0,
          detectionSnapshots: []
        }
      });
    }

    return NextResponse.json({
      success: true,
      engagement,
      pointsAdded: pointsToAdd
    });
  } catch (error) {
    console.error('Error updating student score:', error);
    return NextResponse.json(
      { error: 'Failed to update student score' },
      { status: 500 }
    );
  }
} 