"use client";
import React, { useActionState, useState } from "react";

import { forgotPasswordAction } from "@/actions/auth.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import InputWithLabel from "@/components/custom-ui/input-with-label";
import { Button } from "@/components/ui/button";
import { ForgotPasswordType } from "@/lib/schemas/auth.schema";
import { ActionResponse } from "@/types/actions";

const initialState: ActionResponse<ForgotPasswordType> = {
  success: false,
  message: "",
};

const ForgotPasswordForm = () => {
  const [stage, setStage] = useState<"email" | "code">("email");

  const [state, action, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (stage === "email") {
    return (
      <form className="w-full max-w-md space-y-4" action={action}>
        <h2 className="text-center text-2xl">Forgot Password</h2>
        <p className="text-center text-gray-500">
          Please enter your email to reset your password.
        </p>
        <InputWithLabel
          label="Email"
          inputClassName="peer"
          placeholder="Enter your email"
          type="email"
          name="email"
          error={state.errors?.email?.[0]}
        />
        <ButtonWithLoading
          className="w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Send Reset Code
        </ButtonWithLoading>
        <Button
          variant="outline"
          className="w-full text-base"
          onClick={() => setStage("code")}
          type="button"
        >
          Already have a code?
        </Button>
      </form>
    );
  }
};

export default ForgotPasswordForm;
