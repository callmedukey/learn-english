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