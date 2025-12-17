import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { getIncompleteProfileRedirect } from "@/lib/utils/profile-validation";
import { Role } from "@/prisma/generated/prisma";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if social login user needs to create password
  if (!session.user.hasPassword) {
    redirect("/create-password");
  }

  // Check if user profile is complete
  if (!session.user.profileComplete) {
    redirect(getIncompleteProfileRedirect(session.user.email));
  }

  if (session.user.role === Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-6rem)] w-full max-w-7xl px-4">
      {children}
    </div>
  );
};

export default layout;
