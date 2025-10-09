import { Metadata } from "next";
import React from "react";

import { prisma } from "@/prisma/prisma-client";

import RegisterForm from "./component/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up to join Reading Champ",
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

const page = async () => {
  const [countries, campuses] = await Promise.all([
    prisma.country.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center py-16">
      <RegisterForm countries={countries} campuses={campuses} />
    </main>
  );
};

export default page;
