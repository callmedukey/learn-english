"use client";

import { RiGoogleFill } from "@remixicon/react";
import { SiNaver } from "react-icons/si";
import { RiKakaoTalkFill } from "react-icons/ri";

import { Button } from "@/components/ui/button";

export default function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline">
        <RiGoogleFill
          className="me-1 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        Login with Google
      </Button>
      <Button variant="outline">
        <RiKakaoTalkFill
          className="me-1 scale-110 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        Login with Kakao
      </Button>
      <Button variant="outline">
        <SiNaver
          className="me-1 scale-80 fill-gray-500 dark:text-white/60"
          aria-hidden="true"
        />
        Login with Naver
      </Button>
    </div>
  );
}
