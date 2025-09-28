"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";
import { prisma } from "@/prisma/prisma-client";
import { ActionResponse } from "@/types/actions";

const updateUserDetailsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  birthday: z.string().optional(),
  countryId: z.string().optional(),
});

type UpdateUserDetailsType = z.infer<typeof updateUserDetailsSchema>;

export async function updateUserDetailsAction(
  prevState: ActionResponse<UpdateUserDetailsType>,
  data: UpdateUserDetailsType,
): Promise<ActionResponse<UpdateUserDetailsType>> {
  try {
    await requireAdminAccess();

    const validatedData = updateUserDetailsSchema.parse(data);
    const { userId, birthday, countryId } = validatedData;

    if (!birthday && !countryId) {
      return {
        success: false,
        message: "At least one field (birthday or country) must be provided",
      };
    }

    const updateData: any = {};

    if (birthday) {
      updateData.birthday = new Date(birthday);
    }

    if (countryId) {
      updateData.countryId = countryId;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User details updated successfully",
    };
  } catch (error) {
    console.error("Error updating user details:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors as any,
      };
    }

    return {
      success: false,
      message: "Failed to update user details",
    };
  }
}