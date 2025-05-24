"use client";

import { Bell, Menu, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileMenu = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full hover:bg-primary hover:text-white"
        >
          <Menu className="size-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">Navigation</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col">
          {/* Navigation Links */}
          <nav className="px-6 py-4">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/novel"
                className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
              >
                Novel
              </Link>
              <Link
                href="/rc"
                className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
              >
                Reading Comprehension
              </Link>
            </div>
          </nav>

          {/* Divider */}
          <div className="border-t" />

          {/* Action Buttons */}
          <div className="px-6 py-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="h-10 w-full justify-start gap-3 px-3"
              >
                <Bell className="size-4" />
                Notifications
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-full justify-start gap-3 px-3"
              >
                <User className="size-4" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
