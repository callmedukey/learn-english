import React from "react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const SidebarLogout = () => {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      Logout
    </Button>
  );
};

export default SidebarLogout;
