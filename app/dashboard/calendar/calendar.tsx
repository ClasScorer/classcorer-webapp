"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Info, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarEvent, EventType, formatTime, getEventColor } from "./utils";

export type CalendarProps = {
  events?: CalendarEvent[];
  onSelectDate?: (date: Date) => void;
};

function Calendar({
  events = [],
  onSelectDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>();

  // Group events by date for easier lookup
  const eventsByDate = React.useMemo(() => {
    return events.reduce((acc, event) => {
      const date = event.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const previousMonth = new Date(year, month, 0);
    const daysInPreviousMonth = previousMonth.getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPreviousMonth - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-4">
          <h5 className="text-xl leading-8 font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h5>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="hidden md:flex py-2 pl-1.5 pr-3 items-center gap-1.5 text-xs font-medium"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
            <div className="w-px h-7 bg-border" />
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-px p-1 rounded-md bg-muted">
            <Button variant="ghost" size="sm" className="rounded-lg bg-muted text-sm font-medium">Day</Button>
            <Button variant="ghost" size="sm" className="rounded-lg bg-background text-sm font-medium">Week</Button>
            <Button variant="ghost" size="sm" className="rounded-lg bg-muted text-sm font-medium">Month</Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg border-border">
        <div className="grid grid-cols-7 divide-x divide-border border-b border-border">
          {weekDays.map((day) => (
            <div key={day} className="p-3.5 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-border">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "p-3.5 min-h-[120px] flex flex-col gap-1 transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "bg-muted/50",
                  index >= 35 && "border-b-0"
                )}
              >
                <span className={cn(
                  "text-xs font-semibold flex items-center justify-center w-7 h-7 rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                )}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group relative"
                    >
                      <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium truncate",
                        getEventColor(event.type)
                      )}>
                        {event.title}
                      </div>
                      <div className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 w-48 p-2 rounded-md bg-popover text-left shadow-lg border border-border">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(event.time)}
                          {event.course && ` · ${event.course}`}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar }; 