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
      message: "Nickname must contain only lowercase letters and numbers",
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
        // Allow registration for users born up to today (no age restriction)
        return today;
      })(),
      {
        message: "Birthday cannot be in the future",
      },
    ),
  country: z.string({ required_error: "Country is required" }),
  campus: z.string().optional(),
  referrer: z.string().optional(),
  // South Korea specific fields
  parentName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z가-힣\s]*$/, {
      message: "Name can only contain letters and spaces",
    })
    .optional()
    .or(z.literal("")),
  parentPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, {
      message: "Phone number must be in format: 010-0000-0000",
    })
    .optional()
    .or(z.literal("")),
  studentName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z가-힣\s]*$/, {
      message: "Name can only contain letters and spaces",
    })
    .optional()
    .or(z.literal("")),
  studentPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, {
      message: "Phone number must be in format: 010-0000-0000",
    })
    .optional()
    .or(z.literal("")),
  terms: z
    .preprocess((val) => val === "on", z.boolean())
    .refine((val) => val, {
      message: "You must agree to the terms and conditions",
    }),
  // Korean consent fields (optional)
  termsAgreed: z.preprocess((val) => val === "on", z.boolean()).optional(),
  privacyAgreed: z.preprocess((val) => val === "on", z.boolean()).optional(),
  ageVerified: z.string().optional(),
  guardianPrivacyAgreed: z
    .preprocess((val) => val === "on", z.boolean())
    .optional(),
  marketingAgreed: z.preprocess((val) => val === "on", z.boolean()).optional(),
});

export const signUpSchema = baseSignUpObjectSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // If country is South Korea, Korean consent fields are required
      if (data.country === "South Korea" || data.country === "KR") {
        return data.termsAgreed === true;
      }
      return true;
    },
    {
      message: "이용약관에 동의해주세요",
      path: ["termsAgreed"],
    },
  )
  .refine(
    (data) => {
      // If country is South Korea, privacy agreement is required
      if (data.country === "South Korea" || data.country === "KR") {
        return data.privacyAgreed === true;
      }
      return true;
    },
    {
      message: "개인정보 수집 및 이용에 동의해주세요",
      path: ["privacyAgreed"],
    },
  )
  .refine(
    (data) => {
      // If country is South Korea, age verification is required
      if (data.country === "South Korea" || data.country === "KR") {
        return (
          data.ageVerified === "14_or_older" ||
          data.ageVerified === "under_14_with_consent"
        );
      }
      return true;
    },
    {
      message: "연령 확인을 선택해주세요",
      path: ["ageVerified"],
    },
  )
  .refine(
    (data) => {
      // If under 14, guardian privacy agreement is required
      if (
        (data.country === "South Korea" || data.country === "KR") &&
        data.ageVerified === "under_14_with_consent"
      ) {
        return data.guardianPrivacyAgreed === true;
      }
      return true;
    },
    {
      message: "법정대리인의 개인정보 수집 및 이용에 동의해주세요",
      path: ["guardianPrivacyAgreed"],
    },
  );

export type SignUpType = z.infer<typeof signUpSchema>;

export const socialSignUpSchema = baseSignUpObjectSchema
  .pick({
    email: true,
    nickname: true,
    gender: true,
    birthday: true,
    country: true,
    campus: true,
    terms: true,
    referrer: true,
    parentName: true,
    parentPhone: true,
    studentName: true,
    studentPhone: true,
    termsAgreed: true,
    privacyAgreed: true,
    ageVerified: true,
    guardianPrivacyAgreed: true,
    marketingAgreed: true,
  })
  .refine(
    (data) => {
      // If country is South Korea, Korean consent fields are required
      if (data.country === "South Korea" || data.country === "KR") {
        return data.termsAgreed === true;
      }
      return true;
    },
    {
      message: "이용약관에 동의해주세요",
      path: ["termsAgreed"],
    },
  )
  .refine(
    (data) => {
      // If country is South Korea, privacy agreement is required
      if (data.country === "South Korea" || data.country === "KR") {
        return data.privacyAgreed === true;
      }
      return true;
    },
    {
      message: "개인정보 수집 및 이용에 동의해주세요",
      path: ["privacyAgreed"],
    },
  )
  .refine(
    (data) => {
      // If country is South Korea, age verification is required
      if (data.country === "South Korea" || data.country === "KR") {
        return (
          data.ageVerified === "14_or_older" ||
          data.ageVerified === "under_14_with_consent"
        );
      }
      return true;
    },
    {
      message: "연령 확인을 선택해주세요",
      path: ["ageVerified"],
    },
  )
  .refine(
    (data) => {
      // If under 14, guardian privacy agreement is required
      if (
        (data.country === "South Korea" || data.country === "KR") &&
        data.ageVerified === "under_14_with_consent"
      ) {
        return data.guardianPrivacyAgreed === true;
      }
      return true;
    },
    {
      message: "법정대리인의 개인정보 수집 및 이용에 동의해주세요",
      path: ["guardianPrivacyAgreed"],
    },
  );

export type SocialSignUpType = z.infer<typeof socialSignUpSchema>;

export const forgotPasswordSchema = signInSchema.pick({
  email: true,
});

export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

export const verifyCodeSchema = forgotPasswordSchema.extend({
  code: z.coerce
    .number({ required_error: "Code is required" })
    .min(100000, { message: "Code must be 6 digits" })
    .max(999999, { message: "Code must be 6 digits" }),
});

export type VerifyCodeType = z.infer<typeof verifyCodeSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;

export const createPasswordSchema = z
  .object({
    userId: z.string({ required_error: "User ID is required" }),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreatePasswordType = z.infer<typeof createPasswordSchema>;
