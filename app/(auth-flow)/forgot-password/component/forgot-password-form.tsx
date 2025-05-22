"use client";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  resetPasswordAction,
  sendVerificationCodeAction,
  verifyCodeAction,
} from "@/actions/auth.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import InputWithLabel from "@/components/custom-ui/input-with-label";
import { Button } from "@/components/ui/button";

const ForgotPasswordForm = () => {
  const [stage, setStage] = useState<"email" | "code">("email");
  const [isCodeVerified, setIsCodeVerified] = useState<boolean>(false);

  const [code, setCode] = useState<string>("");
  const [rateLimit, setRateLimit] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [error, setError] = useState<{
    email?: string[] | null;
    code?: string[] | null;
    password?: string[] | null;
    confirmPassword?: string[] | null;
  }>({});
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSendVerificationCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const response = await sendVerificationCodeAction({ email });
      if (response.success) {
        setStage("code");
        setError({});
        toast.success(response.message);
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "rateLimit" in response.data
      ) {
        setRateLimit(response.data.rateLimit);
        toast.error(response.message);
      } else if (response.errors) {
        setError(response.errors);
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const response = await verifyCodeAction({ email, code: Number(code) });
      if (response.success) {
        setIsCodeVerified(true);
        toast.success(response.message);
      } else if (response.errors) {
        setError(response.errors);
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const response = await resetPasswordAction({
        email,
        password,
        confirmPassword,
      });
      if (response.success) {
        toast.success(response.message);
        router.replace("/login");
      } else if (response.errors) {
        setError(response.errors);
      } else {
        toast.error(response.message);
      }
    });
  };

  if (stage === "email" && !isCodeVerified) {
    return (
      <form
        className="w-full max-w-md space-y-4"
        onSubmit={handleSendVerificationCode}
      >
        <h1 className="text-center text-2xl">Forgot Password</h1>
        <p className="text-center text-gray-500">
          Please enter your email to reset your password.
        </p>
        {rateLimit > 0 && (
          <p className="text-center text-sm text-destructive">
            You can resend the code in {rateLimit} seconds
          </p>
        )}

        <InputWithLabel
          label="Email"
          inputClassName="peer"
          placeholder="Enter your email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error.email?.[0]}
        />
        <ButtonWithLoading
          className="w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Send Reset Code
        </ButtonWithLoading>
        <Button
          variant="outline"
          className="w-full text-base"
          onClick={() => setStage("code")}
          type="button"
        >
          Already have a code?
        </Button>
        <Button
          variant="link"
          className="w-full text-base text-gray-600"
          onClick={() => router.replace("/login")}
          type="button"
        >
          Back to login
        </Button>
      </form>
    );
  }

  if (stage === "code" && !isCodeVerified) {
    return (
      <form className="w-full max-w-md space-y-4" onSubmit={handleVerifyCode}>
        <h1 className="text-center text-2xl">Forgot Password</h1>
        <p className="text-center text-gray-500">
          Please enter the code sent to your email to reset your password.
        </p>
        <InputWithLabel
          label="Code"
          inputClassName="peer"
          placeholder="Enter your code"
          type="text"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error.code?.[0]}
        />
        <ButtonWithLoading
          className="w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Verify Code
        </ButtonWithLoading>
        <Button
          variant="outline"
          className="w-full text-base"
          onClick={() => setStage("email")}
          type="button"
        >
          Back
        </Button>
      </form>
    );
  }

  if (isCodeVerified) {
    return (
      <form
        className="w-full max-w-md space-y-4"
        onSubmit={handleResetPassword}
      >
        <h1 className="text-center text-2xl">Reset Password</h1>
        <p className="text-center text-gray-500">
          Please enter your new password to reset your password.
        </p>

        <InputWithLabel
          label="Password"
          inputClassName="peer"
          placeholder="Enter your password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error.password?.[0]}
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
        >
          Reset Password
        </ButtonWithLoading>
        <Button
          variant="outline"
          className="w-full text-base"
          onClick={() => setStage("email")}
          type="button"
        >
          Back to beginning
        </Button>
      </form>
    );
  }
};

export default ForgotPasswordForm;
