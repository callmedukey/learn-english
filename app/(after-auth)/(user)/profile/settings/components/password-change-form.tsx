"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { passwordSchema } from "@/lib/schemas/auth.schema";
import { changePassword, ChangePasswordType } from "../actions/user.actions";

const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

interface PasswordChangeFormProps {
  userId: string;
}

export default function PasswordChangeForm({
  userId,
}: PasswordChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ChangePasswordType>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordType) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await changePassword(userId, data);

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.message,
        });
        reset(); // Clear the form
      } else {
        setSubmitResult({
          success: false,
          error: result.error,
        });

        // Set field-specific errors if they exist
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof ChangePasswordType, {
                message: messages[0],
              });
            }
          });
        }
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        error: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <p className="text-sm text-gray-600">
          Update your password to keep your account secure
        </p>
      </div>

      {submitResult && (
        <Alert
          className={
            submitResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <AlertDescription
            className={submitResult.success ? "text-green-800" : "text-red-800"}
          >
            {submitResult.success ? submitResult.message : submitResult.error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            {...register("currentPassword")}
            className="mt-1"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            className="mt-1"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="mt-1"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Changing Password..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
