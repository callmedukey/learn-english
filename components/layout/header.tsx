"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import logo from "@/public/logo.svg";

import AfterAuthNavBar from "./after-auth-nav";

const Header = () => {
  const pathname = usePathname();
  
  // Don't render header on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="relative mx-auto flex h-24 w-full max-w-7xl items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="absolute left-4 flex items-center space-x-4">
        <Image
          src={logo}
          alt="Reading Champ"
          className="size-16"
          quality={100}
          priority
        />
        <p className="text-xl font-bold tracking-tight text-primary">
          READING CHAMP
        </p>
      </Link>

      {/* Navigation */}
      <AfterAuthNavBar />
    </header>
  );
};

export default Header;
