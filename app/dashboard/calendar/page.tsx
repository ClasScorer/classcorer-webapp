"use client"

import { Calendar } from "./calendar";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";
import { loadCalendarEvents, loadCourses } from "@/lib/data";
import { AddEventDialog } from "./add-event-dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { CalendarEvent, EventType } from "./utils";
import type { Course } from "@/lib/data";
import { api } from "@/lib/api";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Use the new API client
        const eventsData = await api.events.getAll();
        const coursesData = await api.courses.getAll();
        
        // Convert Event to CalendarEvent
        const calendarEvents: CalendarEvent[] = eventsData.map((event, index) => {
          // Ensure we have a valid numeric ID
          let id: number;
          if (event.id) {
            const parsedId = parseInt(event.id);
            id = isNaN(parsedId) ? Date.now() + index : parsedId;
          } else {
            id = Date.now() + index;
          }

          return {
            id,
            title: event.title,
            date: new Date(event.date).toISOString().split('T')[0],
            time: event.time || "",
            type: event.type as EventType,
            description: event.description || "",
            course: event.course?.code,
          };
        })
        setEvents(calendarEvents)
        setCourses(coursesData)
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error('Failed to load calendar data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddEvent = async (eventData: {
    title: string
    date: Date
    time: string
    type: string
    description?: string
    courseId?: string
  }) => {
    try {
      // Use the new API client
      await api.events.create({
        ...eventData,
        date: eventData.date.toISOString(),
      });
      
      loadData();
      toast.success("Event added successfully");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Calendar</h2>
          <p className="text-muted-foreground">Manage your academic schedule and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <AddEventDialog courses={courses} onAddEvent={handleAddEvent} />
        </div>
      </div>
      
      <div className="w-full">
        <Calendar events={events} />
      </div>
    </div>
  );
} 
