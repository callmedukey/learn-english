import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

export async function requireAdminAccess() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/admin");
  }

  return session;
}

/**
 * Requires either ADMIN or SUB_ADMIN role
 * Use this for routes/actions that sub-admins should also access
 */
export async function requireAdminOrSubAdminAccess() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)
  ) {
    redirect("/admin");
  }

  return session;
}

/**
 * Check if user is a full admin (not sub-admin)
 */
export function isFullAdmin(role: string | undefined): boolean {
  return role === Role.ADMIN;
}