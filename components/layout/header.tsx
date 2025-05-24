import { Bell, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";
import logo from "@/public/logo/small-logo.png";

import MobileMenu from "./mobile-menu";

const Header = async () => {
  const session = await auth();

  if (session?.user.role === Role.ADMIN) {
    return null;
  }

  return (
    <header className="flex h-24 items-center justify-between border-b px-4">
      {/* Logo */}
      <Link href="/dashboard">
        <Image src={logo} alt="Reading Champ" quality={100} priority />
      </Link>

      {/* Desktop Navigation Items - Hidden on mobile */}
      <nav className="hidden items-center space-x-8 md:flex">
        <Link
          href="/dashboard"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Dashboard
        </Link>
        <Link
          href="/novels"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Novel
        </Link>
        <Link
          href="/reading-comprehension"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Reading Comprehension
        </Link>
      </nav>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-2">
        {/* Mobile Menu - Shown only on mobile */}
        <div className="md:hidden">
          <MobileMenu />
        </div>

        {/* Desktop Icons - Hidden on mobile */}
        <div className="hidden items-center space-x-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-primary hover:text-white"
          >
            <Bell className="size-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-primary hover:text-white"
          >
            <User className="size-5 hover:text-white" />
            <span className="sr-only">User menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
