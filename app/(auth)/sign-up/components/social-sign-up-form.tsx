"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { updateSocialUser } from "@/app/(auth)/actions/auth";
import { z } from "zod";
import InputWithLabelAndError from "@/components/input-with-label-and-error";
import SelectWithLabel from "@/components/select-with-label";
import SimpleButton from "@/components/simple-button";
import { Gender } from "@/auth";

// Create validation schema for social signup
const socialSignUpSchema = z.object({
  nickname: z.string({
    required_error: "Nickname is required",
  }).min(3, "Nickname must be at least 3 characters"),
  
  gender: z.nativeEnum(Gender, {
    required_error: "Gender is required",
  }),
  
  country: z.string({
    required_error: "Country is required",
  }).min(1, "Country is required"),
  
  birthday: z.string({
    required_error: "Birthday is required",
  }).transform((str) => new Date(str)),
  
  referrer: z.string().optional(),
});

type SocialSignUpInput = z.infer<typeof socialSignUpSchema>;

// Create a type for the form state
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
      {pending ? "Completing sign up..." : "Complete Sign Up"}
    </SimpleButton>
  );
}

export default function SocialSignUpForm() {
  const [errors, setErrors] = useState<Partial<Record<keyof SocialSignUpInput, string>>>({});
  const [formState, action, isPending] = useActionState<FormState, FormData>(
    async (state, formData) => {
      try {
        const result = await updateSocialUser(formData);
        
        if (result.error) {
          // The error message comes from the server action
          return { error: result.error };
        }

        // If successful, redirect to dashboard
        window.location.href = "/";
        return { success: true };
      } catch (error) {
        return { error: "An unexpected error occurred" };
      }
    },
    null
  );

  const validateForm = (formData: FormData) => {
    try {
      socialSignUpSchema.parse({
        nickname: formData.get("nickname"),
        gender: formData.get("gender"),
        country: formData.get("country"),
        birthday: formData.get("birthday"),
        referrer: formData.get("referrer"),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SocialSignUpInput, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof SocialSignUpInput;
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
        <header className="text-center mb-8">
          <h2 className="text-2xl font-medium text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            We need a few more details to complete your registration
          </p>
        </header>

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

          <InputWithLabelAndError
            label="Referrer"
            name="referrer"
            type="text"
            placeholder="Your referrer nickname (optional)"
            error={errors.referrer}
          />

          <SubmitButton />
        </form>

        <footer className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Reading Champ. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
} 