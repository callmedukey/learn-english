"use server";

import { revalidatePath } from "next/cache";

import {
  requireAdminAccess,
  requireAdminOrSubAdminAccess,
} from "@/lib/utils/admin-route-protection";
import { prisma } from "@/prisma/prisma-client";

export const createCampusAction = async (formData: FormData) => {
  await requireAdminAccess();
  const campusName = formData.get("campusName") as string;

  if (!campusName || campusName.trim() === "") {
    return { error: "Campus name is required" };
  }

  try {
    // Check if campus with this name already exists
    const existing = await prisma.campus.findUnique({
      where: { name: campusName.trim() },
    });

    if (existing) {
      return { error: "A campus with this name already exists" };
    }

    const newCampus = await prisma.campus.create({
      data: {
        name: campusName.trim(),
      },
    });

    revalidatePath("/admin/campuses");
    return { success: true, campus: newCampus };
  } catch (error) {
    console.error("Failed to create campus:", error);
    return {
      error: "Failed to create campus. Please try again.",
    };
  }
};

export const updateCampusAction = async (formData: FormData) => {
  await requireAdminAccess();
  const campusId = formData.get("campusId") as string;
  const campusName = formData.get("campusName") as string;

  if (!campusId || !campusName || campusName.trim() === "") {
    return { error: "Campus ID and name are required" };
  }

  try {
    // Check if campus exists
    const existing = await prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!existing) {
      return { error: "Campus not found" };
    }

    // Check if another campus with this name exists
    const duplicate = await prisma.campus.findFirst({
      where: {
        name: campusName.trim(),
        NOT: { id: campusId },
      },
    });

    if (duplicate) {
      return { error: "A campus with this name already exists" };
    }

    const updatedCampus = await prisma.campus.update({
      where: { id: campusId },
      data: { name: campusName.trim() },
    });

    revalidatePath("/admin/campuses");
    return { success: true, campus: updatedCampus };
  } catch (error) {
    console.error("Failed to update campus:", error);
    return {
      error: "Failed to update campus. Please try again.",
    };
  }
};

export const deleteCampusAction = async (campusId: string) => {
  await requireAdminAccess();
  if (!campusId) {
    return { error: "Campus ID is required" };
  }

  try {
    // Check if campus exists and count users
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!campus) {
      return { error: "Campus not found" };
    }

    // Prevent deletion if users are assigned
    if (campus._count.users > 0) {
      return {
        error: `Cannot delete campus. ${campus._count.users} user(s) are assigned to this campus.`,
      };
    }

    await prisma.campus.delete({
      where: { id: campusId },
    });

    revalidatePath("/admin/campuses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete campus:", error);
    return {
      error: "Failed to delete campus. Please try again.",
    };
  }
};

export const removeUserFromCampusAction = async (userId: string) => {
  await requireAdminOrSubAdminAccess();
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, campusId: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (!user.campusId) {
      return { error: "User is not assigned to any campus" };
    }

    // Remove user from campus
    await prisma.user.update({
      where: { id: userId },
      data: { campusId: null },
    });

    revalidatePath("/admin/campuses");
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove user from campus:", error);
    return {
      error: "Failed to remove user from campus. Please try again.",
    };
  }
};

export const assignUserToCampusAction = async (
  userId: string,
  campusId: string
) => {
  await requireAdminOrSubAdminAccess();

  if (!userId || !campusId) {
    return { error: "User ID and Campus ID are required" };
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, campusId: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      return { error: "Campus not found" };
    }

    // Update user's campus assignment
    await prisma.user.update({
      where: { id: userId },
      data: { campusId },
    });

    // Remove any pending campus requests for this user (they're now directly assigned)
    await prisma.campusRequest.deleteMany({
      where: {
        userId,
        status: "PENDING",
      },
    });

    revalidatePath("/admin/campuses");
    revalidatePath(`/admin/campuses/${campusId}`);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign user to campus:", error);
    return {
      error: "Failed to assign user to campus. Please try again.",
    };
  }
};
