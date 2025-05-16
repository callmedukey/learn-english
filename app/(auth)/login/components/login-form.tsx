"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { signIn } from "@/auth";
import { loginSchema, type LoginInput } from "@/auth";
import { handleKakaoSignIn, handleNaverSignIn, handleGoogleSignIn } from "@/app/(auth)/actions/auth";
import InputWithLabelAndError from "@/components/input-with-label-and-error";
import PasswordWithLabelAndError from "@/components/password-with-label-and-error.tsx";
import SimpleButton from "@/components/simple-button";
import SimpleCheckbox from "@/components/simple-checkbox";
import { z } from "zod";
import Image from "next/image";

type FormState = {
  error?: string;
  success?: boolean;
} | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <SimpleButton 
      type="submit" 
      className="w-full bg-[#6B1D1D] hover:bg-[#5A1818]"
      disabled={pending}
    >
      {pending ? "Logging in..." : "Log In"}
    </SimpleButton>
  );
}

function SocialButton({ 
  action, 
  icon, 
  children 
}: { 
  action: () => Promise<void>, 
  icon: string, 
  children: React.ReactNode 
}) {
  return (
    <form action={action}>
      <SimpleButton
        type="submit"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-[#FEF5EA]"
      >
        <Image 
          src={`/icons/${icon}`} 
          alt="" 
          width={16} 
          height={16}
          priority
        />
        {children}
      </SimpleButton>
    </form>
  );
}

export default function LoginForm() {
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isPending, startTransition] = useTransition();
  const [formState, action] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      try {
        await signIn("credentials", {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          redirect: false,
        });
        return { success: true };
      } catch (error) {
        return { error: "Invalid credentials" };
      }
    },
    null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      loginSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      setErrors({});
      startTransition(() => action(formData));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof LoginInput;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <header className="text-center my-8">
        <h2 className="text-2xl font-medium text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Login to continue your learning journey
        </p>
      </header>

      {formState?.error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
          {formState.error}
        </div>
      )}

      <form action={action} onSubmit={handleSubmit} className="space-y-4">
        <InputWithLabelAndError
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          error={errors.email}
        />

        <PasswordWithLabelAndError
          label="Password"
          name="password"
          placeholder="Enter your password"
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <SimpleCheckbox name="remember" label="Remember me" />
          <a href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <SubmitButton />
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#FEF5EA] px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <SocialButton action={handleKakaoSignIn} icon="Kakao-icon.png">
          Continue with Kakao
        </SocialButton>

        <SocialButton action={handleNaverSignIn} icon="Naver-icon.png">
          Continue with Naver
        </SocialButton>

        <SocialButton action={handleGoogleSignIn} icon="Google-icon.png">
          Continue with Google
        </SocialButton>
      </div>

      <footer className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="/sign-up" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
        
        <p className="text-sm text-gray-500 mt-8">
          © 2025 Reading Champ. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 