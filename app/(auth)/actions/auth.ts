'use server'

import { signIn } from "@/auth"
import { signUpSchema } from "@/auth"
import { prisma } from "@/prisma/prisma-client"
import { hash } from "bcryptjs"
import { z } from "zod"

export async function createUser(formData: FormData) {
  try {
    // Validate form data
    const validatedFields = signUpSchema.parse({
      nickname: formData.get("nickname"),
      email: formData.get("email"),
      gender: formData.get("gender"),
      country: formData.get("country"),
      birthday: formData.get("birthday"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      referrer: formData.get("referrer"),
    })

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedFields.email },
          { nickname: validatedFields.nickname }
        ]
      }
    })

    if (existingUser) {
      return {
        error: existingUser.email === validatedFields.email 
          ? "Email already in use"
          : "Nickname already taken"
      }
    }

    // Hash the password
    const hashedPassword = await hash(validatedFields.password, 12)

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: validatedFields.email,
        nickname: validatedFields.nickname,
        password: hashedPassword,
        gender: validatedFields.gender,
        country: validatedFields.country,
        birthday: validatedFields.birthday,
        referrer: validatedFields.referrer,
      }
    })

    return { success: true }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message
      }
    }
    
    return {
      error: "Something went wrong. Please try again."
    }
  }
}

export async function socialSignIn(provider: string) {
  try {
    await signIn(provider, { 
      redirectTo: provider === "credentials" ? "/" : "/sign-up/social" 
    });
    return { success: true };
  } catch (error) {
    return { error: "Failed to sign in" };
  }
}

export async function handleGoogleSignIn() {
  await signIn("google", { 
    redirectTo: "/sign-up/social" 
  });
}

export async function handleKakaoSignIn() {
  await signIn("kakao", { 
    redirectTo: "/sign-up/social" 
  });
}

export async function handleNaverSignIn() {
  await signIn("naver", { 
    redirectTo: "/sign-up/social" 
  });
} 