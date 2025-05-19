"use client";

import { signInAction } from "@/actions/auth.action";
import { signIn, signOut } from "@/auth";
import { SignInType } from "@/lib/schemas/auth.schema";
import { ActionResponse } from "@/types/actions";
import React, { useActionState } from "react";

const initialState: ActionResponse<SignInType> = {
  success: false,
  message: "",
};

const LoginForm = () => {
  const [state, action, isPending] = useActionState(signInAction, initialState);

  console.log(state);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="email" placeholder="Email" name="email" className="" />
      <input type="password" placeholder="Password" name="password" />
      <button type="submit">Login</button>
      {/* <button
        type="button"
        className="cursor-pointer rounded-md px-4 py-2 text-white"
        onClick={async () => {
          "use server";
          await signIn("naver", { redirectTo: "/" });
        }}
      >
        Naver Login
      </button>
      <button
        type="button"
        className="cursor-pointer rounded-md px-4 py-2 text-white"
        onClick={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        Sign Out
      </button> */}
    </form>
  );
};

export default LoginForm;
