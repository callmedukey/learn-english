import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "USER") {
    redirect("/dashboard");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return <div></div>;
};

export default page;
