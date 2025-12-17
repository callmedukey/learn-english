"use client";

import Link from "next/link";
import React, { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { signInAction } from "@/actions/auth.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import CheckboxWithLabel from "@/components/custom-ui/checkbox-with-label";
import InputWithLabel from "@/components/custom-ui/input-with-label";
import SocialLoginButtons from "@/components/social-login-buttons";
import { Separator } from "@/components/ui/separator";
import { SignInType } from "@/lib/schemas/auth.schema";
import { ActionResponse } from "@/types/actions";

const initialState: ActionResponse<SignInType> = {
  success: false,
  message: "",
};

const PROVIDER_NAMES: Record<string, string> = {
  naver: "네이버",
  kakao: "카카오",
  google: "Google",
  credentials: "이메일/비밀번호",
};

const LoginForm = ({
  previousEmail,
  oauthError,
  originalProvider,
}: {
  previousEmail?: string;
  oauthError?: string;
  originalProvider?: string;
}) => {
  const [state, action, isPending] = useActionState(signInAction, initialState);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  useEffect(() => {
    if (oauthError === "OAuthAccountNotLinked" && originalProvider) {
      const providerName = PROVIDER_NAMES[originalProvider] || originalProvider;
      toast.error(
        `이 이메일은 이미 ${providerName}(으)로 가입되어 있습니다. ${providerName}(으)로 로그인해주세요.`
      );
    }
  }, [oauthError, originalProvider]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-center text-2xl">Welcome Back</h2>
      <p className="text-center text-gray-500">
        Login to continue your learning journey
      </p>
      <InputWithLabel
        label="Email"
        inputClassName="peer"
        placeholder="Enter your email"
        type="email"
        name="email"
        defaultValue={previousEmail ?? state.inputs?.email}
        error={state.errors?.email?.[0]}
      />
      <InputWithLabel
        label="Password"
        inputClassName="peer"
        placeholder="Enter your password"
        type="password"
        name="password"
        defaultValue={state.inputs?.password}
        error={state.errors?.password?.[0]}
      />
      <div className="flex items-center justify-between">
        <CheckboxWithLabel
          label="Remember me"
          name="rememberMe"
          defaultChecked={previousEmail ? true : false}
        />
        <Link href="/forgot-password" className="text-sm text-gray-500">
          Forgot password?
        </Link>
      </div>
      <ButtonWithLoading
        type="submit"
        isLoading={isPending}
        disabled={isPending}
      >
        Login
      </ButtonWithLoading>
      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <span className="z-10 bg-background px-4 text-sm text-gray-500">
          Or continue with
        </span>
      </div>
      <SocialLoginButtons type="login" />
      <p className="flex items-center justify-center gap-2 text-center text-sm text-gray-500">
        <span>Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="font-semibold text-gray-600 underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
      <p className="text-center text-sm text-gray-500">
        © 2025 Reading Champ. All rights reserved.
      </p>
    </form>
  );
};

export default LoginForm;
