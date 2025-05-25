import React from "react";

import ProfileNav from "./components/profile-nav";
import SignOutButton from "./components/sign-out-button";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <ProfileNav />
      <div className="mt-6 min-h-[calc(100vh-10rem)]">{children}</div>
      <SignOutButton />
    </div>
  );
};

export default layout;
