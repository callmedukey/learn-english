import React from "react";
import Image from "next/image";
import logo from "@/public/logo/large-logo.png";
import LoginForm from "./component/login-form";

const page = () => {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-12 px-4 py-16 lg:grid-cols-5 lg:px-0">
      <div className="col-span-3 hidden items-center lg:flex">
        <Image
          src={logo}
          alt="Reading Champ"
          quality={100}
          priority
          className="w-48 translate-y-2 xl:w-62"
        />
        <div className="text-primary col-span-2 space-y-2 xl:space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">READING CHAMP</h1>
          <p className="flex flex-col gap-0 text-3xl font-bold">
            <span>Come and Join</span>
            <span>the Champions of Reading!</span>
          </p>
        </div>
      </div>
      <div className="col-span-2 w-full">
        <LoginForm />
      </div>
    </main>
  );
};

export default page;
