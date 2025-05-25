import React from "react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const SignOutButton = () => {
  return (
    <div className="mt-4 flex">
      <Button
        variant="outline"
        className="w-full hover:bg-primary/80 hover:text-white"
        onClick={async () => {
          "use server";

          await signOut({ redirectTo: "/login" });
        }}
      >
        Sign Out
      </Button>
    </div>
  );
};

export default SignOutButton;
