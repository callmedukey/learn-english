"use server";

import { signIn } from "@/auth";
import {
  signInSchema,
  SignInType,
  signUpSchema,
  SignUpType,
  socialSignUpSchema,
  SocialSignUpType,
} from "@/lib/schemas/auth.schema";
import { ActionResponse } from "@/types/actions";
import { AuthError, User } from "next-auth";
import { cookies } from "next/headers";
import { prisma } from "@/prisma/prisma-client";
import bcrypt from "bcryptjs";

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
      maxAge: 60 * 60 * 24 * 30,
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

  const {
    email,
    password,
    nickname,
    gender,
    birthday,
    country,
    terms,
    referrer,
  } = parsed.data;

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

  const [emailUser, nicknameUser] = await Promise.all([
    prisma.user.findUnique({
      where: {
        email,
      },
    }),
    prisma.user.findUnique({
      where: {
        nickname,
      },
    }),
  ]);

  if (emailUser) {
    return {
      success: false,
      message: "User already exists",
      inputs,
    };
  } else if (nicknameUser) {
    return {
      success: false,
      message: "Nickname already exists",
      inputs,
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
        country,
        referrerId: foundReferrer?.id,
      },
    });

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
        country,
        referrerId: foundReferrer?.id,
      },
    });

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
