"use client";

import { useState } from "react";
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
      className="form-submit-button"
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
        className="social-button"
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
  const [formState, action, isPending] = useActionState<FormState, FormData>(
    async (state, formData) => {
      try {
        const result = await signIn("credentials", {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          redirect: false,
        });

        if (result?.error) {
          // The error message is already URL decoded from the redirect
          return { error: result.error };
        }

        return { success: true };
      } catch (error) {
        return { error: "An unexpected error occurred" };
      }
    },
    null
  );

  const validateForm = (formData: FormData) => {
    try {
      loginSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof LoginInput;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  return (
    <div className="form-container">
      <header className="text-center my-8">
        <h2 className="text-2xl font-medium text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Login to continue your learning journey
        </p>
      </header>

      {formState?.error && (
        <div className="form-error">
          {formState.error}
        </div>
      )}

      <form 
        action={async (formData: FormData) => {
          if (validateForm(formData)) {
            await action(formData);
          }
        }} 
        className="form-layout"
      >
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
          <a href="/forgot-password" className="form-footer-link">
            Forgot password?
          </a>
        </div>

        <SubmitButton />
      </form>

      <div className="social-divider">
        <div className="social-divider-line">
          <div className="social-divider-line-inner" />
        </div>
        <div className="social-divider-text">
          <span className="social-divider-text-inner">
            Or continue with
          </span>
        </div>
      </div>

      <div className="social-buttons-container">
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

      <footer className="form-footer">
        <p className="form-footer-text">
          Don't have an account?{" "}
          <a href="/sign-up" className="form-footer-link">
            Sign up
          </a>
        </p>
        
        <p className="form-footer-copyright">
          © 2025 Reading Champ. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 