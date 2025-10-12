"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canEditNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * Create a new BPA unit for a novel
 */
export async function createBPAUnit(formData: FormData) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session || !canEditNovel(userRole)) {
    return { error: "Unauthorized" };
  }

  const novelId = formData.get("novelId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  if (!novelId || !name) {
    return { error: "Missing required fields" };
  }

  try {
    // Check if novel exists and user can edit it
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { locked: true, bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    if (!canEditNovel(userRole, novel.locked)) {
      return { error: "Cannot edit locked novel" };
    }

    // Get the next order number
    const maxOrderUnit = await prisma.bPAUnit.findFirst({
      where: { novelId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });

    const orderNumber = (maxOrderUnit?.orderNumber ?? 0) + 1;

    // Create the unit
    const unit = await prisma.bPAUnit.create({
      data: {
        novelId,
        name,
        description: description || null,
        orderNumber,
      },
    });

    revalidatePath(`/admin/bpa/${novel.bpaLevelId}/${novelId}/edit`);

    return { success: true, unit };
  } catch (error) {
    console.error("Error creating BPA unit:", error);
    return { error: "Failed to create unit" };
  }
}

/**
 * Update an existing BPA unit
 */
export async function updateBPAUnit(formData: FormData) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session || !canEditNovel(userRole)) {
    return { error: "Unauthorized" };
  }

  const unitId = formData.get("unitId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  if (!unitId || !name) {
    return { error: "Missing required fields" };
  }

  try {
    // Check if unit exists and get novel info
    const unit = await prisma.bPAUnit.findUnique({
      where: { id: unitId },
      include: {
        novel: {
          select: { locked: true, bpaLevelId: true, id: true },
        },
      },
    });

    if (!unit) {
      return { error: "Unit not found" };
    }

    if (!canEditNovel(userRole, unit.novel.locked)) {
      return { error: "Cannot edit locked novel" };
    }

    // Update the unit
    const updatedUnit = await prisma.bPAUnit.update({
      where: { id: unitId },
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath(`/admin/bpa/${unit.novel.bpaLevelId}/${unit.novel.id}/edit`);

    return { success: true, unit: updatedUnit };
  } catch (error) {
    console.error("Error updating BPA unit:", error);
    return { error: "Failed to update unit" };
  }
}

/**
 * Delete a BPA unit and optionally reassign its chapters
 */
export async function deleteBPAUnit(
  unitId: string,
  targetUnitId?: string | null
) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session || userRole !== Role.ADMIN) {
    return { error: "Unauthorized - Admin access required" };
  }

  try {
    // Get unit with chapters and novel info
    const unit = await prisma.bPAUnit.findUnique({
      where: { id: unitId },
      include: {
        chapters: true,
        novel: {
          select: { locked: true, bpaLevelId: true, id: true },
        },
      },
    });

    if (!unit) {
      return { error: "Unit not found" };
    }

    if (!canEditNovel(userRole, unit.novel.locked)) {
      return { error: "Cannot delete unit from locked novel" };
    }

    // If unit has chapters and no target unit specified, prevent deletion
    if (unit.chapters.length > 0 && !targetUnitId) {
      return {
        error: "Unit has chapters. Please specify a target unit to move them to.",
      };
    }

    // Move chapters to target unit if specified
    if (unit.chapters.length > 0 && targetUnitId) {
      await prisma.bPAChapter.updateMany({
        where: { unitId },
        data: { unitId: targetUnitId },
      });
    }

    // Delete the unit
    await prisma.bPAUnit.delete({
      where: { id: unitId },
    });

    revalidatePath(`/admin/bpa/${unit.novel.bpaLevelId}/${unit.novel.id}/edit`);

    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    console.error("Error deleting BPA unit:", error);
    return { error: "Failed to delete unit" };
  }
}

/**
 * Reorder BPA units within a novel
 */
export async function reorderBPAUnits(
  novelId: string,
  unitOrders: Array<{ id: string; orderNumber: number }>
) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session || !canEditNovel(userRole)) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if novel exists and user can edit it
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { locked: true, bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    if (!canEditNovel(userRole, novel.locked)) {
      return { error: "Cannot reorder units in locked novel" };
    }

    // Update all unit orders in a transaction
    await prisma.$transaction(
      unitOrders.map(({ id, orderNumber }) =>
        prisma.bPAUnit.update({
          where: { id },
          data: { orderNumber },
        })
      )
    );

    revalidatePath(`/admin/bpa/${novel.bpaLevelId}/${novelId}/edit`);

    return { success: true, message: "Units reordered successfully" };
  } catch (error) {
    console.error("Error reordering BPA units:", error);
    return { error: "Failed to reorder units" };
  }
}

/**
 * Move chapters from one unit to another
 */
export async function moveChaptersToUnit(
  chapterIds: string[],
  targetUnitId: string
) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session || !canEditNovel(userRole)) {
    return { error: "Unauthorized" };
  }

  if (chapterIds.length === 0) {
    return { error: "No chapters selected" };
  }

  try {
    // Get target unit and verify novel access
    const targetUnit = await prisma.bPAUnit.findUnique({
      where: { id: targetUnitId },
      include: {
        novel: {
          select: { locked: true, bpaLevelId: true, id: true },
        },
      },
    });

    if (!targetUnit) {
      return { error: "Target unit not found" };
    }

    if (!canEditNovel(userRole, targetUnit.novel.locked)) {
      return { error: "Cannot move chapters in locked novel" };
    }

    // Update all chapters to the new unit
    await prisma.bPAChapter.updateMany({
      where: {
        id: { in: chapterIds },
      },
      data: {
        unitId: targetUnitId,
      },
    });

    revalidatePath(
      `/admin/bpa/${targetUnit.novel.bpaLevelId}/${targetUnit.novel.id}/edit`
    );

    return {
      success: true,
      message: `Moved ${chapterIds.length} chapter(s) successfully`,
    };
  } catch (error) {
    console.error("Error moving chapters to unit:", error);
    return { error: "Failed to move chapters" };
  }
}
