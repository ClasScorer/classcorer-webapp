import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Simple in-memory store for activity data
// In production, this should use Redis or a database
const activityStore: {
  [key: string]: {
    lastUpdated: Date;
    activities: Array<{
      id: string;
      message: string;
      timestamp: Date;
      type: 'info' | 'warning' | 'error' | 'success';
      studentId?: string;
      studentName?: string;
      actionType?: 'hand_raised' | 'focus_change' | 'join' | 'leave';
      focused?: boolean;
    }>;
  };
} = {};

// In-memory store for simulated activities (per session)
const simulatedActivitiesStore: Record<string, any[]> = {};

// Clean up old sessions periodically (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
setInterval(() => {
  const now = new Date();
  Object.keys(activityStore).forEach((key) => {
    const session = activityStore[key];
    if (now.getTime() - session.lastUpdated.getTime() > SESSION_TIMEOUT) {
      delete activityStore[key];
    }
  });
}, 60000); // Check every minute

// GET - Retrieve activity data for a specific session
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    const lectureId = url.searchParams.get('lectureId');
    
    if (!sessionId || !lectureId) {
      return NextResponse.json({ error: 'Session ID and Lecture ID are required' }, { status: 400 });
    }
    
    // Check if we have simulated data for this session
    if (simulatedActivitiesStore[sessionId]) {
      console.log(`Returning ${simulatedActivitiesStore[sessionId].length} simulated activities for session ${sessionId}`);
      return NextResponse.json(simulatedActivitiesStore[sessionId]);
    }
    
    // Otherwise fetch from database
    // Your existing database fetch logic here...
    
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}

// POST - Add new activity data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, lectureId, activities, isSimulated = false } = body;
    
    console.log(`Received activity data: sessionId=${sessionId}, lectureId=${lectureId}, activities=${activities.length}`);
    
    // If this is simulated data, store in memory but don't update the database
    if (isSimulated) {
      console.log("Storing simulated activities in memory (not in database)");
      if (!simulatedActivitiesStore[sessionId]) {
        simulatedActivitiesStore[sessionId] = [];
      }
      
      // Add new activities to the store
      simulatedActivitiesStore[sessionId] = [
        ...simulatedActivitiesStore[sessionId],
        ...activities
      ];
      
      // Optional: Keep only the latest 50 activities
      if (simulatedActivitiesStore[sessionId].length > 50) {
        simulatedActivitiesStore[sessionId] = simulatedActivitiesStore[sessionId].slice(-50);
      }
      
      console.log(`Simulated activities stored for session ${sessionId}: ${simulatedActivitiesStore[sessionId].length} activities`);
      return NextResponse.json({ success: true });
    }
    
    // For real data, save to the database
    // Your existing database logic here...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling activity:', error);
    return NextResponse.json({ error: 'Failed to process activity data' }, { status: 500 });
  }
}
