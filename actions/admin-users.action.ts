"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { nicknameRegex } from "@/lib/regex/auth.regex";
import { requireAdminAccess } from "@/lib/utils/admin-route-protection";
import { prisma } from "@/prisma/prisma-client";
import { ActionResponse } from "@/types/actions";

const updateUserDetailsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  nickname: z
    .string()
    .min(3, { message: "Nickname must be at least 3 characters" })
    .max(8, { message: "Nickname must be less than 8 characters" })
    .regex(nicknameRegex, {
      message: "Nickname must contain only lowercase letters and numbers",
    })
    .optional()
    .or(z.literal("")),
  birthday: z.string().optional(),
  countryId: z.string().optional(),
  campusId: z.string().optional(),
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
    const { userId, nickname, birthday, countryId, campusId, parentName, parentPhone, studentName, studentPhone } = validatedData;

    // Check nickname uniqueness if provided and different from current
    if (nickname && nickname.trim() !== "") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });

      // Only check uniqueness if nickname is being changed
      if (currentUser && nickname !== currentUser.nickname) {
        const existingUser = await prisma.user.findFirst({
          where: {
            nickname: {
              equals: nickname,
              mode: "insensitive",
            },
            id: { not: userId }, // Exclude current user
          },
        });

        if (existingUser) {
          return {
            success: false,
            message: "Nickname already exists",
            errors: {
              nickname: ["This nickname is already taken"],
            },
          };
        }
      }
    }

    const updateData: any = {};

    if (nickname !== undefined && nickname.trim() !== "") {
      updateData.nickname = nickname;
    }

    if (birthday) {
      updateData.birthday = new Date(birthday);
    }

    if (countryId) {
      updateData.countryId = countryId;
    }

    if (campusId !== undefined) {
      updateData.campusId = campusId || null;
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

    // If campus is being manually assigned, auto-approve any pending request
    if (campusId !== undefined && campusId) {
      const pendingRequest = await prisma.campusRequest.findFirst({
        where: {
          userId,
          campusId,
          status: "PENDING",
        },
      });

      if (pendingRequest) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: updateData,
          }),
          prisma.campusRequest.update({
            where: { id: pendingRequest.id },
            data: {
              status: "APPROVED",
              reviewedAt: new Date(),
            },
          }),
        ]);
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      }
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/campuses");

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