"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createPasswordAction } from "@/actions/auth.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import InputWithLabel from "@/components/custom-ui/input-with-label";

interface CreatePasswordFormProps {
  email: string;
  userId: string;
}

export default function CreatePasswordForm({
  email,
  userId,
}: CreatePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{
    password?: string[] | null;
    confirmPassword?: string[] | null;
  }>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({});

    startTransition(async () => {
      const result = await createPasswordAction({
        userId,
        password,
        confirmPassword,
      });

      if (result.success) {
        toast.success("Password created successfully! Please log in with your new password.");
        // Sign out and redirect to login page to get fresh session
        await signOut({ redirect: false });
        router.push("/login?passwordCreated=true");
      } else if (result.errors) {
        setError(result.errors);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Create Password</h1>
        <p className="text-gray-500">
          Create a password to enable email login for your account.
        </p>
      </div>

      {/* Display email (read-only) */}
      <div className="space-y-2">
        <label className="text-base leading-6 text-gray-500">Email</label>
        <p className="rounded-md border border-input bg-muted px-3 py-2 text-base text-gray-700">
          {email}
        </p>
      </div>

      <InputWithLabel
        label="Password"
        inputClassName="peer"
        placeholder="Enter your password (8-16 characters)"
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error.password?.[0]}
        description="Must be 8-16 characters with at least 1 letter and 1 number"
      />

      <InputWithLabel
        label="Confirm Password"
        inputClassName="peer"
        placeholder="Confirm your password"
        type="password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={error.confirmPassword?.[0]}
      />

      <ButtonWithLoading
        className="w-full"
        isLoading={isPending}
        disabled={isPending}
        type="submit"
      >
        Create Password
      </ButtonWithLoading>
    </form>
  );
}
