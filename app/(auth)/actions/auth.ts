'use server'

import { signIn } from "@/auth"
import { signUpSchema } from "@/auth"
import { prisma } from "@/prisma/prisma-client"
import { hash } from "bcryptjs"
import { z } from "zod"
import { auth } from "@/auth"
import { socialSignUpSchema } from "@/auth"

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
    await signIn(provider);
    return { success: true };
  } catch (error) {
    return { error: "Failed to sign in" };
  }
}

export async function handleGoogleSignIn() {
  await signIn("google");
}

export async function handleKakaoSignIn() {
  await signIn("kakao");
}

export async function handleNaverSignIn() {
  await signIn("naver");
}

export async function updateSocialUser(formData: FormData) {
  try {
    // Get the current session
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    // Validate form data
    const validatedFields = socialSignUpSchema.parse({
      nickname: formData.get("nickname"),
      gender: formData.get("gender"),
      country: formData.get("country"),
      birthday: formData.get("birthday"),
      referrer: formData.get("referrer"),
    });

    // Check if nickname is already taken
    const existingUser = await prisma.user.findFirst({
      where: { nickname: validatedFields.nickname }
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return { error: "NicknameTaken" };
    }

    // Update the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname: validatedFields.nickname,
        gender: validatedFields.gender,
        country: validatedFields.country,
        birthday: validatedFields.birthday,
        referrer: validatedFields.referrer,
      }
    });

    return { success: true };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "InvalidData" };
    }
    
    return { error: "Something went wrong. Please try again." };
  }
} 