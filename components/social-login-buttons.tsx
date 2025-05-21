"use client";

import { RiGoogleFill } from "@remixicon/react";
import { TransitionStartFunction, useTransition } from "react";
import { RiKakaoTalkFill } from "react-icons/ri";
import { SiNaver } from "react-icons/si";

import { socialSignInAction } from "@/actions/auth.action";
import { Button } from "@/components/ui/button";

interface SocialLoginButtonsProps {
  type: "login" | "signup";
  isLoading?: boolean;
  startTransition?: TransitionStartFunction;
}

export default function SocialLoginButtons({
  type,
  isLoading,
  startTransition,
}: SocialLoginButtonsProps) {
  const [transitionIsPending, startTransitionFn] = useTransition();

  const handleSocialLogin = async (provider: "google" | "kakao" | "naver") => {
    if (startTransition) {
      startTransition(async () => {
        await socialSignInAction(provider);
      });
    } else {
      startTransitionFn(async () => {
        await socialSignInAction(provider);
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        type="button"
        className="text-base"
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading || transitionIsPending}
      >
        <RiGoogleFill
          className="me-1 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        {type === "login" ? "Login with Google" : "Sign up with Google"}
      </Button>
      <Button
        variant="outline"
        type="button"
        className="text-base"
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading || transitionIsPending}
      >
        <RiKakaoTalkFill
          className="me-1 scale-110 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        {type === "login" ? "Login with Kakao" : "Sign up with Kakao"}
      </Button>
      <Button
        variant="outline"
        type="button"
        className="text-base"
        onClick={() => handleSocialLogin("naver")}
        disabled={isLoading || transitionIsPending}
      >
        <SiNaver
          className="me-1 scale-80 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        {type === "login" ? "Login with Naver" : "Sign up with Naver"}
      </Button>
    </div>
  );
}
