import { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import React from "react";

import logo from "@/public/logo/large-logo.png";

import LoginForm from "./component/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

const page = async () => {
  const cookieStore = await cookies();
  const rememberMe = cookieStore.get("rememberMe");

  return (
    <main className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-12 px-4 py-16 lg:grid-cols-5">
      <div className="col-span-3 hidden items-center lg:flex">
        <Image
          src={logo}
          alt="Reading Champ"
          quality={100}
          priority
          className="w-48 translate-y-2 xl:w-62"
        />
        <div className="col-span-2 space-y-2 text-primary xl:space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">READING CHAMP</h1>
          <p className="flex flex-col gap-0 text-3xl font-bold">
            <span>Come and Join</span>
            <span>the Champions of Reading!</span>
          </p>
        </div>
      </div>
      <div className="col-span-2 w-full place-content-center">
        <LoginForm previousEmail={rememberMe?.value} />
      </div>
    </main>
  );
};

export default page;
