import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityEvent } from "@/hooks/lecture-room/useLectureEvents";

const prisma = new PrismaClient();

// In-memory storage for events as a temporary solution
// In a production environment, this would be stored in a database
const lectureEvents: Record<string, ActivityEvent[]> = {};

// This is just temporary for demo purposes
// In a real implementation, events would be stored in the database
export async function POST(
  request: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Need to await params to resolve the dynamic route parameter
    const lectureId = params.lectureId;
    const { event } = await request.json();

    if (!event || !event.message || !event.type) {
      return NextResponse.json(
        { error: "Invalid event data" },
        { status: 400 }
      );
    }

    // Initialize array for this lecture if it doesn't exist
    if (!lectureEvents[lectureId]) {
      lectureEvents[lectureId] = [];
    }

    // Add timestamp and ID if not provided
    const newEvent: ActivityEvent = {
      ...event,
      id: event.id || Math.random().toString(36).substring(2, 9),
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    };

    // Add to the in-memory store
    lectureEvents[lectureId].unshift(newEvent);

    // Limit array size to prevent memory issues
    if (lectureEvents[lectureId].length > 1000) {
      lectureEvents[lectureId] = lectureEvents[lectureId].slice(0, 1000);
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error("Error storing lecture event:", error);
    return NextResponse.json(
      { error: "Failed to store event" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Need to await params to resolve the dynamic route parameter
    const lectureId = params.lectureId;
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    
    // Get events for this lecture
    const events = lectureEvents[lectureId] || [];
    
    // Filter events by timestamp if 'since' parameter is provided
    let filteredEvents = events;
    if (since) {
      const sinceDate = new Date(since);
      filteredEvents = events.filter(
        event => event.timestamp > sinceDate
      );
    }
    
    // Take only the latest 100 events
    const latestEvents = filteredEvents.slice(0, 100);

    return NextResponse.json({ events: latestEvents });
  } catch (error) {
    console.error("Error fetching lecture events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
} 