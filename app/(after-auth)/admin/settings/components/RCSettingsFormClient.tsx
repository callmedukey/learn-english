"use client";

import React, { useActionState } from "react";

import { updateRCSettings } from "../actions/settings-actions";

interface RCSettingsFormClientProps {
  initialSettings: {
    id: string;
    defaultTimer: number;
    defaultScore: number;
  } | null;
}

export default function RCSettingsFormClient({
  initialSettings,
}: RCSettingsFormClientProps) {
  const [state, formAction, isPending] = useActionState(updateRCSettings, null);

  return (
    <form action={formAction} className="space-y-4">
      {initialSettings && (
        <input type="hidden" name="settingsId" value={initialSettings.id} />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="rcTimer"
            className="mb-1 block text-base font-medium text-gray-700"
          >
            Default Timer (seconds)
          </label>
          <input
            type="number"
            id="rcTimer"
            name="defaultTimer"
            min="0"
            defaultValue={initialSettings?.defaultTimer || 0}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            disabled={isPending}
          />
        </div>

        <div>
          <label
            htmlFor="rcScore"
            className="mb-1 block text-base font-medium text-gray-700"
          >
            Default Score
          </label>
          <input
            type="number"
            id="rcScore"
            name="defaultScore"
            min="0"
            defaultValue={initialSettings?.defaultScore || 0}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            disabled={isPending}
          />
        </div>
      </div>

      {state && (
        <div
          className={`rounded-md p-3 text-base ${
            state.success
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.success ? "RC settings updated successfully!" : state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !initialSettings}
        className="w-full rounded-md bg-amber-500 px-4 py-2 text-white transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Update RC Settings"}
      </button>
    </form>
  );
}
