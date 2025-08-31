import { Metadata } from "next";
import React from "react";

import BenefitsSection from "@/components/sections/benefits-section";
import BookCarouselSection from "@/components/sections/book-carousel-section";
import HeroSection from "@/components/sections/hero-section";
import LeaderboardSection from "@/components/sections/leaderboard-section";
import NovelSection from "@/components/sections/novel-section";
import QuizSection from "@/components/sections/quiz-section";
import ReadingComprehensionSection from "@/components/sections/reading-comprehension-section";
import JsonLdScript from "@/components/seo/json-ld-script";

export const metadata: Metadata = {
  title: "우리 아이 영어독해 완성 리딩챔프 | Lexile 500-900L 맞춤학습",
  description:
    "리딩챔프와 함께 매일 성장하는 영어 독해 실력! Lexile 지수 기반 맞춤 도서 5단계, 수능형 RC 문제 4단계, 매월 새로운 20권의 도서와 1000문제로 체계적인 영어 학습을 시작하세요.",
  keywords:
    "리딩챔프, 영어독해, 초등영어, Lexile지수, 영어도서추천, 수능영어준비, 영어독해문제, 영어학습플랫폼, 온라인영어교육, 영어원서읽기, 영어퀴즈, 리더보드, 레벨별영어학습",
  openGraph: {
    title: "리딩챔프 - 아이의 영어 독해 실력, 매일 성장하는 습관",
    description:
      "Lexile 지수 기반 맞춤 도서 5단계, 수능형 RC 문제 4단계, 매월 새로운 콘텐츠로 체계적인 영어 독해 학습",
    images: [
      {
        url: "/og-image-optimized.png",
        width: 1200,
        height: 630,
        alt: "리딩챔프 - 영어 독해 학습 플랫폼",
      },
    ],
  },
  twitter: {
    title: "리딩챔프 - 아이의 영어 독해 실력, 매일 성장하는 습관",
    description:
      "Lexile 지수 기반 맞춤 도서 5단계, 수능형 RC 문제 4단계로 체계적인 영어 학습",
    images: ["/og-image-optimized.png"],
  },
};

export const dynamic = "force-static";

const page = async () => {
  return (
    <>
      <JsonLdScript />
      <div className="mx-auto min-h-screen w-full max-w-7xl">
        <HeroSection />

        {/* Features Section */}
        <section className="px-4 py-6 md:px-10 md:py-8 lg:px-20 lg:py-10">
          <div className="flex flex-col gap-10 md:gap-16 lg:gap-20">
            <NovelSection />
            <ReadingComprehensionSection />
          </div>
        </section>

        {/* Book Carousel Section */}
        <BookCarouselSection />

        {/* Quiz Section */}
        <section>
          <QuizSection />
        </section>

        {/* Leaderboard Section */}
        <LeaderboardSection />

        {/* Benefits Section */}
        <BenefitsSection />
      </div>
    </>
  );
};

export default page;

