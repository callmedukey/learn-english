import React from "react";

import RegisterForm from "./component/register-form";

const page = () => {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center py-16">
      <RegisterForm />
    </main>
  );
};

export default page;
