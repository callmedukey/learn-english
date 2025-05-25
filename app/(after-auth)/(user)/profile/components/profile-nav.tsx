"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ProfileNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/profile",
      label: "Subscription Plans",
      isActive: pathname === "/profile",
    },
    {
      href: "/profile/payments",
      label: "Payment History",
      isActive: pathname === "/profile/payments",
    },
    {
      href: "/profile/settings",
      label: "Account Settings",
      isActive: pathname === "/profile/settings",
    },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              item.isActive
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default ProfileNav;
