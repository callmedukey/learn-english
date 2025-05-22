import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Role } from "@/prisma/generated/prisma";

import { AppSidebar } from "./components/app-sidebar";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default layout;
