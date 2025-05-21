"use server";

import { signIn } from "@/auth";
import { signInSchema, SignInType } from "@/lib/schemas/auth.schema";
import { ActionResponse } from "@/types/actions";
import { AuthError } from "next-auth";

export async function signInAction(
  _: ActionResponse<SignInType>,
  formData: FormData,
): Promise<ActionResponse<SignInType>> {
  const inputs = Object.fromEntries(formData.entries()) as SignInType;
  const parsed = signInSchema.safeParse(inputs);
  console.log(parsed.error?.flatten().fieldErrors);
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid credentials",
      errors: parsed.error.flatten().fieldErrors,
      inputs,
    };
  }

  const { email, password } = parsed.data;

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
