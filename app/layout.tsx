import { StagewiseToolbar } from "@stagewise/toolbar-next";
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

const stagewiseConfig = {
  plugins: [],
};

export const metadata: Metadata = {
  title: {
    template: "%s | Reading Champ",
    default: "Reading Champ | English Learning Platform",
  },
  description: "Reading Champ",
  icons: [
    {
      url: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      url: "/favicon-16x16.png",
      sizes: "16x16",
      type: "image/png",
    },
    {
      url: "/favicon-32x32.png",
      sizes: "32x32",
      type: "image/png",
    },
    {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(notoSans.variable, "antialiased")}>
        <Header />
        {children}
        <Toaster />
        {process.env.NODE_ENV === "development" && (
          <StagewiseToolbar config={stagewiseConfig} />
        )}
      </body>
    </html>
  );
}
