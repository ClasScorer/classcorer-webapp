import { loadCalendarEvents as loadEvents } from '@/lib/data';
import { CalendarEvent } from './utils';

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  const events = await loadEvents();
  return events.map(event => ({
    ...event,
    id: parseInt(event.id, 10),
  }));
} 