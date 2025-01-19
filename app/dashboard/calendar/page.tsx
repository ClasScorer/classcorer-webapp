import { Metadata } from "next";
import { Calendar } from "./calendar";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ChevronDown } from "lucide-react";
import { loadCalendarEvents } from "./data";

export const metadata: Metadata = {
  title: "Academic Calendar",
  description: "Course schedules, deadlines, and academic events",
};

export default async function CalendarPage() {
  const calendarEvents = await loadCalendarEvents();

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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>
      
      <div className="w-full">
        <Calendar events={calendarEvents} />
      </div>
    </div>
  );
} 
