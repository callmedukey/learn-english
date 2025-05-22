import Image from "next/image";
import React from "react";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";
import logo from "@/public/logo/small-logo.png";

const Header = async () => {
  const session = await auth();

  if (session?.user.role === Role.ADMIN) {
    return null;
  }

  return (
    <header className="flex h-24 items-center border-b px-4">
      <Image src={logo} alt="Reading Champ" quality={100} priority />
    </header>
  );
};

export default Header;
