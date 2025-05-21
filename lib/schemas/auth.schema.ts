import { z } from "zod";

import { Gender } from "@/prisma/generated/prisma";

import { passwordRegex, nicknameRegex } from "../regex/auth.regex";

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(16, { message: "Password must be less than 16 characters" })
  .regex(
    passwordRegex,
    "Password must contain at least one letter and one number",
  );

export const signInSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: passwordSchema,
  rememberMe: z.preprocess((val) => val === "on", z.boolean()).optional(),
});

export type SignInType = z.infer<typeof signInSchema>;

const baseSignUpObjectSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  nickname: z
    .string({ required_error: "Nickname is required" })
    .min(3, {
      message: "Nickname must be at least 3 characters long",
    })
    .max(8, {
      message: "Nickname must be less than 8 characters",
    })
    .regex(nicknameRegex, {
      message: "Nickname must contain only letters, numbers, and underscores",
    }),
  gender: z.nativeEnum(Gender).optional(),
  birthday: z.coerce
    .date({
      message: "Please select your birthday",
    })
    .min(new Date("1900-01-01"), {
      message: "Birthday must be after 1900-01-01",
    })
    .max(
      (() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const maxBirthYear = currentYear - 8;
        return new Date(maxBirthYear, 11, 31, 23, 59, 59, 999);
      })(),
      {
        message: "You must be older than 7 years old.",
      },
    ),
  country: z.string({ required_error: "Country is required" }),
  referrer: z.string().optional(),
  terms: z
    .preprocess((val) => val === "on", z.boolean())
    .refine((val) => val, {
      message: "You must agree to the terms and conditions",
    }),
});

export const signUpSchema = baseSignUpObjectSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

export type SignUpType = z.infer<typeof signUpSchema>;

export const socialSignUpSchema = baseSignUpObjectSchema.pick({
  email: true,
  nickname: true,
  gender: true,
  birthday: true,
  country: true,
  terms: true,
  referrer: true,
});

export type SocialSignUpType = z.infer<typeof socialSignUpSchema>;
