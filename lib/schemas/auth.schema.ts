import { z } from "zod";
import { passwordRegex } from "../regex/auth.regex";
import { Gender } from "@/prisma/generated/prisma";

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
});

export type SignInType = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    nickname: z.string({ required_error: "Nickname is required" }),
    gender: z.nativeEnum(Gender),
    birthday: z.date({ required_error: "Birthday is required" }),
    country: z.string({ required_error: "Country is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
