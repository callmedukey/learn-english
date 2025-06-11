"use client";

import React, { useActionState, useRef, useEffect } from "react";

import { updatePassword } from "../actions/password-actions";

interface PasswordResetFormProps {
  userId: string;
}

export default function PasswordResetForm({ userId }: PasswordResetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await updatePassword(userId, formData);
    },
    null,
  );

  // Clear form on successful update
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      id="password-form"
      action={formAction}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          required
          minLength={8}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          disabled={isPending}
        />
      </div>

      {state && (
        <div
          className={`rounded-md p-3 text-sm ${
            state.success
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.success ? "Password updated successfully!" : state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-amber-500 px-4 py-2 text-white transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
