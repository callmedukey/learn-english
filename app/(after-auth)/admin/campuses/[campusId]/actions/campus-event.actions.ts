"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";
import { CampusEventColor } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface EventActionResult {
  success: boolean;
  error?: string;
  eventId?: string;
}

export interface CreateEventInput {
  campusId: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: CampusEventColor;
}

export interface UpdateEventInput extends CreateEventInput {
  id: string;
}

/**
 * Create a new campus event
 */
export async function createCampusEvent(
  input: CreateEventInput
): Promise<EventActionResult> {
  try {
    await requireAdminAccess();

    // Verify campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: input.campusId },
    });

    if (!campus) {
      return { success: false, error: "Campus not found" };
    }

    const event = await prisma.campusEvent.create({
      data: {
        campusId: input.campusId,
        title: input.title,
        description: input.description,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        allDay: input.allDay,
        color: input.color,
      },
    });

    revalidatePath(`/admin/campuses/${input.campusId}`);
    return { success: true, eventId: event.id };
  } catch (error) {
    console.error("Error creating campus event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Update an existing campus event
 */
export async function updateCampusEvent(
  input: UpdateEventInput
): Promise<EventActionResult> {
  try {
    await requireAdminAccess();

    // Verify event exists and belongs to the campus
    const existingEvent = await prisma.campusEvent.findUnique({
      where: { id: input.id },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    if (existingEvent.campusId !== input.campusId) {
      return { success: false, error: "Event does not belong to this campus" };
    }

    await prisma.campusEvent.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        allDay: input.allDay,
        color: input.color,
      },
    });

    revalidatePath(`/admin/campuses/${input.campusId}`);
    return { success: true, eventId: input.id };
  } catch (error) {
    console.error("Error updating campus event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Delete a campus event
 */
export async function deleteCampusEvent(
  eventId: string,
  campusId: string
): Promise<EventActionResult> {
  try {
    await requireAdminAccess();

    // Verify event exists and belongs to the campus
    const existingEvent = await prisma.campusEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    if (existingEvent.campusId !== campusId) {
      return { success: false, error: "Event does not belong to this campus" };
    }

    await prisma.campusEvent.delete({
      where: { id: eventId },
    });

    revalidatePath(`/admin/campuses/${campusId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting campus event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
