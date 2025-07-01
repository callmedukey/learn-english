import { redirect } from "next/navigation";
import React from "react";

import { prisma } from "@/prisma/prisma-client";

import SocialRegisterForm from "./component/social-register-form";

interface PageProps {
  searchParams: Promise<{
    email: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  const { email } = await searchParams;

  if (!email) {
    redirect("/login");
  }

  const decodedEmail = decodeURIComponent(email);

  const [countries, user] = await Promise.all([
    prisma.country.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.user.findUnique({
      where: {
        email: decodedEmail,
      },
      select: {
        id: true,
        nickname: true,
        birthday: true,
      },
    }),
  ]);

  if (!user || (user.nickname && user.birthday)) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center py-16">
      <SocialRegisterForm email={decodedEmail} countries={countries} />
    </main>
  );
};

export default page;
