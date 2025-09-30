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
  parentName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z가-힣\s]*$/, {
      message: "Name can only contain letters and spaces",
    })
    .optional()
    .or(z.literal("")),
  parentPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, {
      message: "Phone number must be in format: 010-0000-0000",
    })
    .optional()
    .or(z.literal("")),
  studentName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z가-힣\s]*$/, {
      message: "Name can only contain letters and spaces",
    })
    .optional()
    .or(z.literal("")),
  studentPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, {
      message: "Phone number must be in format: 010-0000-0000",
    })
    .optional()
    .or(z.literal("")),
});

type UpdateUserDetailsType = z.infer<typeof updateUserDetailsSchema>;

export async function updateUserDetailsAction(
  prevState: ActionResponse<UpdateUserDetailsType>,
  data: UpdateUserDetailsType,
): Promise<ActionResponse<UpdateUserDetailsType>> {
  try {
    await requireAdminAccess();

    const validatedData = updateUserDetailsSchema.parse(data);
    const { userId, birthday, countryId, parentName, parentPhone, studentName, studentPhone } = validatedData;

    const updateData: any = {};

    if (birthday) {
      updateData.birthday = new Date(birthday);
    }

    if (countryId) {
      updateData.countryId = countryId;
    }

    if (parentName !== undefined) {
      updateData.parentName = parentName || null;
    }

    if (parentPhone !== undefined) {
      updateData.parentPhone = parentPhone || null;
    }

    if (studentName !== undefined) {
      updateData.studentName = studentName || null;
    }

    if (studentPhone !== undefined) {
      updateData.studentPhone = studentPhone || null;
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