import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";

import "./globals.css";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | 리딩챔프",
    default: "리딩챔프 - 아이의 영어 독해 실력, 매일 성장하는 습관",
  },
  description: "초등학생 영어 독해 학습 플랫폼. Lexile 지수 기반 맞춤 도서, 수능형 RC 문제, 챕터별 퀴즈, 실시간 리더보드로 매일 성장하는 영어 실력을 만들어갑니다.",
  keywords: "영어독해, 초등영어, 리딩챔프, Lexile지수, 영어도서, 수능영어, 독해학습, 영어교육, 영어리딩, 영어원서, 초등학생영어, 영어퀴즈, 영어실력향상, 온라인영어학습",
  authors: [{ name: "리딩챔프" }],
  creator: "리딩챔프",
  publisher: "리딩챔프",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://readingchamp.co.kr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "리딩챔프 - 아이의 영어 독해 실력, 매일 성장하는 습관",
    description: "초등학생 영어 독해 학습 플랫폼. Lexile 지수 기반 맞춤 도서, 수능형 RC 문제, 챕터별 퀴즈, 실시간 리더보드로 매일 성장하는 영어 실력",
    url: "https://readingchamp.co.kr",
    siteName: "리딩챔프",
    images: [
      {
        url: "/og-image-optimized.png",
        width: 1200,
        height: 630,
        alt: "리딩챔프 - 영어 독해 학습 플랫폼",
      },
      {
        url: "/OG-image.png",
        width: 1548,
        height: 710,
        alt: "리딩챔프 - Come and Join the Champions of Reading!",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "리딩챔프 - 아이의 영어 독해 실력, 매일 성장하는 습관",
    description: "초등학생 영어 독해 학습 플랫폼. Lexile 지수 기반 맞춤 도서와 수능형 RC 문제로 체계적인 영어 학습",
    images: ["/og-image-optimized.png"],
    creator: "@readingchamp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
  other: {
    "naver-site-verification": "554c0f6e27a2de88f5e3ccbd7c564d5c502f5e63",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn(notoSans.variable, "antialiased")}>
        <QueryProvider>
          <AuthProvider>
            <Header />
            {children}
            <Footer />
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
