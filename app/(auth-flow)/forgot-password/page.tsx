import { Metadata } from "next";
import React from "react";

import ForgotPasswordForm from "./component/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Forgot Password",
};

const page = () => {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 py-16">
      <ForgotPasswordForm />
    </main>
  );
};

export default page;
