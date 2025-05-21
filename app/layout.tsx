import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";

import "./globals.css";
import Header from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reading Champ",
  description: "Reading Champ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(notoSans.variable, "antialiased")}>
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
