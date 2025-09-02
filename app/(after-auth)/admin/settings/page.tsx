import React, { Suspense } from "react";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";

import NovelLevelDefaultsForm from "./components/NovelLevelDefaultsForm";
import NovelSettingsForm from "./components/NovelSettingsForm";
import PasswordResetForm from "./components/PasswordResetForm";
import RCLevelDefaultsForm from "./components/RCLevelDefaultsForm";
import RCSettingsForm from "./components/RCSettingsForm";

export default async function SettingsPage() {
  const session = await requireAdminAccess();

  return (
    <div className="container mx-auto max-w-6xl p-6">
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
            Reading Comprehension Global Settings
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            These are fallback defaults used when level-specific defaults are not set.
          </p>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <RCSettingsForm />
          </Suspense>
        </section>

        {/* RC Level Defaults Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            RC Level Default Settings
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Set default timer and score values for each RC level. These values will automatically populate when creating new RC questions.
          </p>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <RCLevelDefaultsForm />
          </Suspense>
        </section>

        {/* Novel Settings Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Novel Global Settings
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            These are fallback defaults used when level-specific defaults are not set.
          </p>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <NovelSettingsForm />
          </Suspense>
        </section>

        {/* Novel Level Defaults Section */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Novel Level Default Settings
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Set default timer and score values for each Novel level. These values will automatically populate when creating new Novel questions.
          </p>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <NovelLevelDefaultsForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
