"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  EventCalendar,
  type CalendarEvent,
} from "@/components/event-calendar";
import { CampusEventColor } from "@/prisma/generated/prisma";

import {
  createCampusEvent,
  deleteCampusEvent,
  updateCampusEvent,
} from "../actions/campus-event.actions";
import type { CampusEventData } from "../queries/campus-events.query";

interface CampusEventCalendarProps {
  campusId: string;
  events: CampusEventData[];
}

export default function CampusEventCalendar({
  campusId,
  events,
}: CampusEventCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Transform database events to CalendarEvent format
  const calendarEvents: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    allDay: event.allDay,
    color: event.color as CalendarEvent["color"],
  }));

  const handleEventAdd = (event: CalendarEvent) => {
    startTransition(async () => {
      const result = await createCampusEvent({
        campusId,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.start,
        endDate: event.end,
        allDay: event.allDay ?? false,
        color: (event.color ?? "sky") as CampusEventColor,
      });

      if (result.success) {
        toast.success(`Event "${event.title}" created`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create event");
      }
    });
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    startTransition(async () => {
      const result = await updateCampusEvent({
        id: event.id,
        campusId,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.start,
        endDate: event.end,
        allDay: event.allDay ?? false,
        color: (event.color ?? "sky") as CampusEventColor,
      });

      if (result.success) {
        toast.success(`Event "${event.title}" updated`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update event");
      }
    });
  };

  const handleEventDelete = (eventId: string) => {
    startTransition(async () => {
      const result = await deleteCampusEvent(eventId, campusId);

      if (result.success) {
        toast.success("Event deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete event");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
      <EventCalendar
        events={calendarEvents}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        initialView="month"
      />
    </div>
  );
}
