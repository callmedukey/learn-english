"use server";

import { revalidatePath } from "next/cache";

import { requireAdminOrSubAdminAccess } from "@/lib/utils/admin-route-protection";
import { prisma } from "@/prisma/prisma-client";

export const approveCampusRequestAction = async (requestId: string) => {
  if (!requestId) {
    return { error: "Request ID is required" };
  }

  try {
    const session = await requireAdminOrSubAdminAccess();

    // Get the request
    const request = await prisma.campusRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        campus: true,
      },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status !== "PENDING") {
      return { error: "Only pending requests can be approved" };
    }

    // Update request status and assign user to campus in a transaction
    await prisma.$transaction([
      prisma.campusRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: {
          campusId: request.campusId,
        },
      }),
    ]);

    revalidatePath("/admin/campuses");
    return {
      success: true,
      message: `Request approved. ${request.user.nickname || request.user.email} has been assigned to ${request.campus.name}`
    };
  } catch (error) {
    console.error("Failed to approve campus request:", error);
    return {
      error: "Failed to approve campus request. Please try again.",
    };
  }
};

export const rejectCampusRequestAction = async (requestId: string) => {
  if (!requestId) {
    return { error: "Request ID is required" };
  }

  try {
    const session = await requireAdminOrSubAdminAccess();

    // Get the request
    const request = await prisma.campusRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        campus: true,
      },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status !== "PENDING") {
      return { error: "Only pending requests can be rejected" };
    }

    // Update request status
    await prisma.campusRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    revalidatePath("/admin/campuses");
    return {
      success: true,
      message: `Request rejected for ${request.user.nickname || request.user.email}`
    };
  } catch (error) {
    console.error("Failed to reject campus request:", error);
    return {
      error: "Failed to reject campus request. Please try again.",
    };
  }
};
