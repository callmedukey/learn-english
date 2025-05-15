import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import React from "react";

const LoginForm = () => {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";

        const email = formData.get("email");
        const password = formData.get("password");

        try {
          await signIn("kakao", { redirectTo: "/naver" });
        } catch (error) {
          if (error instanceof AuthError) {
            console.error(error.type);
          }
        }
      }}
    >
      <input type="email" placeholder="Email" name="email" />
      <input type="password" placeholder="Password" name="password" />
      <button type="submit">Login</button>
      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
        onClick={async () => {
          "use server";
          await signIn("naver", { redirectTo: "/" });
        }}
      >
        Naver Login
      </button>
      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
        onClick={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        Sign Out
      </button>
    </form>
  );
};

export default LoginForm;
