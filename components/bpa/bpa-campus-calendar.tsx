"use client";

import { useMemo } from "react";

import { EventCalendar } from "@/components/event-calendar/event-calendar";
import type { CalendarEvent, EventColor } from "@/components/event-calendar/types";

interface CampusEventData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
}

interface BPACampusCalendarProps {
  events: CampusEventData[];
}

export function BPACampusCalendar({ events }: BPACampusCalendarProps) {
  // Transform database events to CalendarEvent format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      allDay: event.allDay,
      color: event.color as EventColor,
    }));
  }, [events]);

  return (
    <EventCalendar
      events={calendarEvents}
      readOnly
    />
  );
}
