import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";
import logo from "@/public/logo/small-logo.png";

import MobileMenu from "./mobile-menu";
import { getUserNotifications } from "../notifications/actions/notification.actions";
import { NotificationBell } from "../notifications/notification-bell";

const Header = async () => {
  const session = await auth();
  if (!session) {
    return null;
  }

  if (session?.user.role === Role.ADMIN) {
    return null;
  }

  // Get user notifications if logged in
  const notifications = session?.user?.id
    ? await getUserNotifications(session.user.id)
    : [];

  return (
    <header className="relative flex h-24 items-center justify-center border-b px-4">
      {/* Logo */}
      <div className="absolute left-4 flex items-center space-x-4">
        <Image src={logo} alt="Reading Champ" quality={100} priority />
        <p className="text-xl font-bold tracking-tight text-primary">
          READING CHAMP
        </p>
      </div>

      {/* Desktop Navigation Items - Hidden on mobile */}
      <nav className="hidden items-center space-x-8 lg:flex">
        <Link
          href="/dashboard"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Dashboard
        </Link>
        <Link
          href="/novel"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Novel
        </Link>
        <Link
          href="/rc"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Reading Comprehension
        </Link>
      </nav>

      {/* Right Side Icons */}
      <div className="absolute right-4 flex items-center space-x-2">
        {/* Mobile Menu - Shown only on mobile */}
        <div className="lg:hidden">
          <MobileMenu
            userId={session?.user?.id}
            notifications={notifications}
          />
        </div>

        {/* Desktop Icons - Hidden on mobile */}
        <div className="ml-auto hidden items-center space-x-2 lg:flex">
          {session?.user?.id && (
            <NotificationBell
              userId={session.user.id}
              initialNotifications={notifications}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-primary hover:text-white"
            asChild
          >
            <Link href="/profile">
              <User className="size-5 hover:text-white" />
              <span className="sr-only">User menu</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
