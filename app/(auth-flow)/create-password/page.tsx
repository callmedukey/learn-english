import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

import CreatePasswordForm from "./component/create-password-form";

export const metadata: Metadata = {
  title: "Create Password",
  description: "Create a password for your account",
};

const page = async () => {
  const session = await auth();

  // Not logged in -> redirect to home
  if (!session) {
    redirect("/");
  }

  // Double-check user status from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      password: true,
      accounts: {
        select: { provider: true },
      },
    },
  });

  // User not found -> redirect to login
  if (!user) {
    redirect("/login");
  }

  // User already has password -> redirect to dashboard
  if (user.password) {
    redirect("/dashboard");
  }

  // User has no social accounts (shouldn't happen, but safeguard)
  if (user.accounts.length === 0) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 py-16">
      <CreatePasswordForm email={user.email} userId={user.id} />
    </main>
  );
};

export default page;
