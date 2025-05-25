"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AuthError, User } from "next-auth";

import { signIn } from "@/auth";
import { ResetPasswordEmail } from "@/components/emails/reset-password";
import redisClient from "@/lib/redis/redis-client";
import {
  forgotPasswordSchema,
  ForgotPasswordType,
  resetPasswordSchema,
  ResetPasswordType,
  signInSchema,
  SignInType,
  signUpSchema,
  SignUpType,
  socialSignUpSchema,
  SocialSignUpType,
  verifyCodeSchema,
  VerifyCodeType,
} from "@/lib/schemas/auth.schema";
import { prisma } from "@/prisma/prisma-client";
import { ActionResponse } from "@/types/actions";

import { resendApi } from "./functions/send-email";

export async function signInAction(
  _: ActionResponse<SignInType>,
  formData: FormData,
): Promise<ActionResponse<SignInType>> {
  const inputs = Object.fromEntries(
    formData.entries(),
  ) as unknown as SignInType;

  const parsed = signInSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      errors: parsed.error.flatten().fieldErrors,
      inputs,
    };
  }

  const { email, password, rememberMe } = parsed.data;

  if (rememberMe) {
    const cookieStore = await cookies();

    cookieStore.set("rememberMe", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } else {
    const cookieStore = await cookies();
    cookieStore.delete("rememberMe");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true, message: "Login successful" };
  } catch (error) {
    if (error instanceof AuthError) {
      if ("code" in error && typeof error.code === "string") {
        switch (error.code) {
          case "InvalidCredentials":
            return { success: false, message: "Invalid credentials", inputs };
          case "UserNotFound":
            return { success: false, message: "User not found", inputs };
          default:
            return { success: false, message: "Something went wrong", inputs };
        }
      }
    }

    throw error;
  }
}

export async function signUpAction(
  _: ActionResponse<SignUpType>,
  formData: FormData,
): Promise<ActionResponse<SignUpType>> {
  const inputs = Object.fromEntries(
    formData.entries(),
  ) as unknown as SignUpType;

  const parsed = signUpSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, nickname, gender, birthday, country, referrer } =
    parsed.data;

  let foundReferrer: Pick<User, "id"> | null = null;

  if (referrer) {
    foundReferrer = await prisma.user.findFirst({
      where: {
        nickname: {
          equals: referrer,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });
  }

  if (referrer && !foundReferrer) {
    return {
      success: false,
      message: "Referrer not found",
      inputs,
      errors: {
        referrer: ["Referrer not found"],
      },
    };
  }

  const emailUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (emailUser) {
    return {
      success: false,
      message: "User already exists",
      inputs,
      errors: {
        email: ["User with this email already exists"],
      },
    };
  }

  const nicknameUser = await prisma.user.findUnique({
    where: {
      nickname,
    },
  });

  if (nicknameUser) {
    return {
      success: false,
      message: "Nickname already exists",
      inputs,
      errors: {
        nickname: ["This nickname is already taken"],
      },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        nickname,
        gender,
        birthday,
        password: hashedPassword,
        countryId: country,
        referrerId: foundReferrer?.id,
      },
    });

    if (foundReferrer) {
      await prisma.user.update({
        where: { id: foundReferrer.id },
        data: { referrerCount: { increment: 1 } },
      });
    }

    return {
      success: true,
      message: "Thank you for signing up!",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Something went wrong",
      inputs,
    };
  }
}

export async function socialSignUpAction(
  _: ActionResponse<SocialSignUpType>,
  formData: FormData,
): Promise<ActionResponse<SocialSignUpType>> {
  const inputs = Object.fromEntries(
    formData.entries(),
  ) as unknown as SocialSignUpType;

  const parsed = socialSignUpSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { nickname, gender, birthday, country, referrer, email } = parsed.data;

  let foundReferrer: Pick<User, "id"> | null = null;

  if (referrer) {
    foundReferrer = await prisma.user.findFirst({
      where: {
        nickname: { equals: referrer, mode: "insensitive" },
      },
      select: {
        id: true,
      },
    });
  }

  if (referrer && !foundReferrer) {
    return {
      success: false,
      message: "Referrer not found",
      inputs,
      errors: {
        referrer: ["Referrer not found"],
      },
    };
  }

  try {
    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        nickname,
        gender,
        birthday,
        countryId: country,
        referrerId: foundReferrer?.id,
        emailVerified: new Date(), // Mark email as verified for social sign-ups
      },
    });

    if (foundReferrer) {
      await prisma.user.update({
        where: { id: foundReferrer.id },
        data: {
          referrerId: user.id,
          referrerCount: { increment: 1 },
        },
      });
    }

    if (!user) {
      return {
        success: false,
        message: "Something went wrong",
        inputs,
      };
    }

    return {
      success: true,
      message: "Thank you for signing up!",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Something went wrong",
      inputs,
    };
  }
}

export async function socialSignInAction(
  provider: "google" | "kakao" | "naver",
) {
  await signIn(provider, {
    redirectTo: "/dashboard",
  });
}

export async function sendVerificationCodeAction(
  inputs: ForgotPasswordType,
): Promise<ActionResponse<ForgotPasswordType, { rateLimit: number }>> {
  if (!inputs.email) {
    return {
      success: false,
      message: "Email is required",
      inputs,
    };
  }

  const redisToken = await redisClient.get(`${inputs.email}:token`);

  if (redisToken) {
    const rateLimit = await redisClient.ttl(`${inputs.email}:token`);

    return {
      success: false,
      message: `A password reset link has already been sent to your email address. Please wait ${rateLimit} seconds before requesting another email.`,
      data: {
        rateLimit,
      },
      inputs,
    };
  }

  const parsed = forgotPasswordSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
    },
  });

  if (!user) {
    return {
      success: false,
      message: "User not found",
      inputs,
      errors: {
        email: ["User with this email does not exist"],
      },
    };
  }

  if (!user.password) {
    return {
      success: false,
      message: "Please try social login instead.",
      inputs,
    };
  }

  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token: existingToken.token },
      },
    });
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  try {
    await resendApi.emails.send({
      from: `Reading Champ <noreply@${process.env.EMAIL_DOMAIN}>`,
      to: email,
      subject: "Reset Your Password - Reading Champ",
      react: ResetPasswordEmail({ token }),
    });

    await redisClient.set(`${email}:token`, token, {
      EX: 300,
    });

    return {
      success: true,
      message: "A password reset link has been sent to your email address.",
    };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return {
      success: false,
      message: "Failed to send verification email. Please try again later.",
      inputs,
    };
  }
}

export async function verifyCodeAction(
  inputs: VerifyCodeType,
): Promise<ActionResponse<VerifyCodeType>> {
  const parsed = verifyCodeSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      success: false,
      message: "User not found",
      inputs,
      errors: {
        email: ["User with this email does not exist"],
      },
    };
  }

  const deleted = await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: code.toString() } },
  });

  if (!deleted) {
    return {
      success: false,
      message: "Invalid code",
      inputs,
    };
  }

  return {
    success: true,
    message: "Code verified successfully",
    inputs,
  };
}

export async function resetPasswordAction(
  inputs: ResetPasswordType,
): Promise<ActionResponse<ResetPasswordType>> {
  const parsed = resetPasswordSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  await redisClient.del(`${email}:token`);

  return {
    success: true,
    message: "Password reset successfully",
    inputs,
  };
}
