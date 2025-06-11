import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";

import NovelSettingsForm from "./components/NovelSettingsForm";
import PasswordResetForm from "./components/PasswordResetForm";
import RCSettingsForm from "./components/RCSettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Admin Settings</h1>

      <div className="space-y-8">
        {/* Password Reset Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Change Password
          </h2>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <PasswordResetForm userId={session.user.id} />
          </Suspense>
        </section>

        {/* RC Settings Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Reading Comprehension Settings
          </h2>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <RCSettingsForm />
          </Suspense>
        </section>

        {/* Novel Settings Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Novel Settings
          </h2>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <NovelSettingsForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
