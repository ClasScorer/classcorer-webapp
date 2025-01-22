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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, coursesData] = await Promise.all([
          loadCalendarEvents(),
          loadCourses()
        ])
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
        console.error('Error loading data:', error)
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
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventData,
          date: eventData.date.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add event")
      }

      const newEvent = await response.json()
      // Convert the new event to CalendarEvent format
      const calendarEvent: CalendarEvent = {
        id: (() => {
          if (newEvent.id) {
            const parsedId = parseInt(newEvent.id);
            return isNaN(parsedId) ? Date.now() : parsedId;
          }
          return Date.now();
        })(),
        title: newEvent.title,
        date: new Date(newEvent.date).toISOString().split('T')[0],
        time: newEvent.time || "",
        type: newEvent.type as EventType,
        description: newEvent.description || "",
        course: newEvent.course?.code,
      }
      setEvents(prev => [...prev, calendarEvent])
      toast.success("Event added successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add event")
      throw error
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
