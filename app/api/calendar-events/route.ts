import { NextResponse } from "next/server";
import { loadCalendarEvents } from "@/lib/data";

export async function GET() {
  try {
    const events = await loadCalendarEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("[CALENDAR_EVENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 