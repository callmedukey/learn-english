import React from "react";

import ProfileNav from "./components/profile-nav";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <ProfileNav />
      <div className="mt-6">{children}</div>
    </div>
  );
};

export default layout;
