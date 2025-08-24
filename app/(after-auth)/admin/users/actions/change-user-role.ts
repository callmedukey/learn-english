"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function changeUserRole(userId: string, newRole: Role) {
  const session = await auth();

  // Only ADMIN users can change roles
  if (!session || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Only administrators can change user roles");
  }

  // Prevent admins from changing their own role
  if (session.user.id === userId) {
    throw new Error("You cannot change your own role");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error changing user role:", error);
    throw new Error("Failed to change user role");
  }
}