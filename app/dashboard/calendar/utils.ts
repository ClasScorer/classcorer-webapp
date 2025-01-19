export type EventType = 'deadline' | 'lecture' | 'exam' | 'office-hours' | 'meeting';

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  course?: string;
  type: EventType;
  recurring?: 'daily' | 'weekly' | 'monthly';
  description?: string;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function getEventColor(type: EventType): string {
  switch (type) {
    case 'deadline':
      return 'bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-red-400';
    case 'lecture':
      return 'bg-blue-500/20 text-blue-500 dark:bg-blue-500/30 dark:text-blue-400';
    case 'exam':
      return 'bg-purple-500/20 text-purple-500 dark:bg-purple-500/30 dark:text-purple-400';
    case 'office-hours':
      return 'bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400';
    case 'meeting':
      return 'bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-500 dark:bg-gray-500/30 dark:text-gray-400';
  }
}

export function sortEventsByDateTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

export function getUpcomingEvents(events: CalendarEvent[], days: number = 7): CalendarEvent[] {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= futureDate;
  });
}

export function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  return events.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);
} 