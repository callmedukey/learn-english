"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { createUser } from "@/app/(auth)/actions/auth";
import { signUpSchema, type SignUpInput } from "@/auth";
import InputWithLabelAndError from "@/components/input-with-label-and-error";
import PasswordWithLabelAndError from "@/components/password-with-label-and-error.tsx";
import SelectWithLabel from "@/components/select-with-label";
import SimpleButton from "@/components/simple-button";
import SimpleCheckbox from "@/components/simple-checkbox";
import { z } from "zod";
import Image from "next/image";
import { signIn } from "next-auth/react";
import TermsDialog from "@/components/terms-dialog";

// First, let's properly type the form state and action result
type FormState = {
  error?: string;
  success?: boolean;
} | null;

// Create a submit button component to handle loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <SimpleButton 
      type="submit" 
      className="w-full bg-[#6B1D1D] hover:bg-[#5A1818]"
      disabled={pending}
    >
      {pending ? "Creating account..." : "Sign Up"}
    </SimpleButton>
  );
}

function SocialButton({ 
  provider, 
  icon 
}: { 
  provider: string, 
  icon: string 
}) {
  return (
    <SimpleButton
      variant="outline"
      className="w-full flex items-center justify-center gap-2 bg-[#FEF5EA]"
      onClick={() => signIn(provider, { callbackUrl: '/sign-up/social' })}
    >
      <Image 
        src={`/icons/${icon}`} 
        alt={provider} 
        width={16} 
        height={16}
        priority
      />
      Sign up with {provider}
    </SimpleButton>
  );
}

export default function SignUpForm() {
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpInput, string>>>({});
  const [formState, action, isPending] = useActionState<FormState, FormData>(
    async (state, formData) => {
      try {
        const result = await createUser(formData);
        
        if (result.error) {
          // The error message comes from the server action
          return { error: result.error };
        }

        // If successful, sign in the user
        await signIn("credentials", {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          redirect: true,
          callbackUrl: "/"
        });

        return { success: true };
      } catch (error) {
        return { error: "An unexpected error occurred" };
      }
    },
    null
  );

  // Client-side validation before form submission
  const validateForm = (formData: FormData) => {
    try {
      signUpSchema.parse({
        nickname: formData.get("nickname"),
        email: formData.get("email"),
        gender: formData.get("gender"),
        country: formData.get("country"),
        birthday: formData.get("birthday"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        referrer: formData.get("referrer"),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof SignUpInput;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF5EA] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {formState?.error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {formState.error}
          </div>
        )}

        <form 
          action={async (formData: FormData) => {
            if (validateForm(formData)) {
              await action(formData);
            }
          }} 
          className="space-y-4"
        >
          <InputWithLabelAndError
            label="Nickname"
            name="nickname"
            type="text"
            placeholder="Enter your nickname"
            error={errors.nickname}
          />

          <InputWithLabelAndError
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            error={errors.email}
          />

          <SelectWithLabel
            label="Gender"
            name="gender"
            placeholder="Select gender"
            options={[
              { label: "Male", value: "MALE" },
              { label: "Female", value: "FEMALE" },
              { label: "Other", value: "OTHER" },
            ]}
            error={errors.gender}
          />

          <SelectWithLabel
            label="Country"
            name="country"
            placeholder="Select country"
            options={[
              { label: "United States", value: "US" },
              { label: "United Kingdom", value: "UK" },
              { label: "South Korea", value: "KR" },
            ]}
            error={errors.country}
          />

          <InputWithLabelAndError
            label="Birthday"
            name="birthday"
            type="date"
            error={errors.birthday}
            iconPosition="left"
          />

          <PasswordWithLabelAndError
            label="Password"
            name="password"
            placeholder="Create a password"
            error={errors.password}
          />

          <PasswordWithLabelAndError
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            error={errors.confirmPassword}
          />

          <InputWithLabelAndError
            label="Referrer"
            name="referrer"
            type="text"
            placeholder="Your referrer nickname (optional)"
            error={errors.referrer}
          />

          <div className="flex items-center space-x-2 text-sm sm:text-base">
            <SimpleCheckbox
              name="terms"
              label={
                <span>
                  I agree to the{" "}
                  <TermsDialog type="terms">Terms of Service</TermsDialog>{" "}
                  and{" "}
                  <TermsDialog type="privacy">Privacy Policy</TermsDialog>
                </span>
              }
            />
          </div>

          <SubmitButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FEF5EA] px-2 text-sm text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <SocialButton provider="kakao" icon="Kakao-icon.png" />
            <SocialButton provider="naver" icon="Naver-icon.png" />
            <SocialButton provider="google" icon="Google-icon.png" />
          </div>

          <footer className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Log in
              </a>
            </p>
            
            <p className="text-sm text-gray-500 mt-8">
              © 2025 Reading Champ. All rights reserved.
            </p>
          </footer>
        </form>
      </div>
    </div>
  );
} 