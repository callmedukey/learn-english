"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma/prisma-client";

const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

const updatePlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Plan name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean(),
});

export async function createPlanAction(data: z.infer<typeof createPlanSchema>) {
  try {
    const validatedData = createPlanSchema.parse(data);

    const plan = await prisma.plan.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        duration: validatedData.duration,
        description: validatedData.description,
        sortOrder: validatedData.sortOrder,
        isActive: true,
      },
    });

    revalidatePath("/admin/plans");

    return {
      success: true,
      plan,
    };
  } catch (error) {
    console.error("Error creating plan:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: "Failed to create plan",
    };
  }
}

export async function updatePlanAction(data: z.infer<typeof updatePlanSchema>) {
  try {
    const validatedData = updatePlanSchema.parse(data);

    const plan = await prisma.plan.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        duration: validatedData.duration,
        description: validatedData.description,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/admin/plans");

    return {
      success: true,
      plan,
    };
  } catch (error) {
    console.error("Error updating plan:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: "Failed to update plan",
    };
  }
}

export async function deletePlanAction(id: string) {
  try {
    // Check if plan has any payments or subscriptions
    const planWithRelations = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            payments: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!planWithRelations) {
      return {
        success: false,
        error: "Plan not found",
      };
    }

    if (
      planWithRelations._count.payments > 0 ||
      planWithRelations._count.subscriptions > 0
    ) {
      return {
        success: false,
        error:
          "Cannot delete plan with existing payments or subscriptions. Deactivate it instead.",
      };
    }

    await prisma.plan.delete({
      where: { id },
    });

    revalidatePath("/admin/plans");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting plan:", error);
    return {
      success: false,
      error: "Failed to delete plan",
    };
  }
}

export async function togglePlanStatusAction(id: string) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      return {
        success: false,
        error: "Plan not found",
      };
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        isActive: !plan.isActive,
      },
    });

    revalidatePath("/admin/plans");

    return {
      success: true,
      plan: updatedPlan,
    };
  } catch (error) {
    console.error("Error toggling plan status:", error);
    return {
      success: false,
      error: "Failed to toggle plan status",
    };
  }
}
