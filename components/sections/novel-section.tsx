"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { motion as m } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";

import AnimatedFeatureCard from "@/components/common/animated-feature-card";
import AnimatedLevelCard from "@/components/common/animated-level-card";
import abcIcon from "@/public/images/abc.webp";
import booksIcon from "@/public/images/books.webp";
import chartIcon from "@/public/images/chart.webp";
import guideIcon from "@/public/images/guide.webp";

const NovelSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
      dragFree: true,
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);
  const features = [
    {
      icon: booksIcon,
      title: "맞춤 도서 선택",
      description:
        "Lexile 지수에 따른 도서 목록에서\n적합한 책을 쉽게 선택할 수 있습니다.",
    },
    {
      icon: abcIcon,
      title: "챕터별 문제 풀이",
      description:
        "책을 읽는 동시에, 읽은 내용을 바로\n점검하며 학습 효율을 높입니다.",
    },
    {
      icon: chartIcon,
      title: "점수 비교 & 실력 확인",
      description:
        "또래 학생들과 점수를 비교해, 독해\n수준을 객관적으로 확인할 수 있습니다.",
    },
    {
      icon: guideIcon,
      title: "단계별 성장 가이드",
      description:
        "개개인의 맞는 도서를 통헤 독해 실력을\n체계적으로 키울 수 있습니다.",
    },
  ];

  const levels = [
    {
      stars: 1,
      level: "BEGINNER",
      badges: [
        { text: "500L+", variant: "primary" as const },
        { text: "1~2학년", variant: "primary" as const },
      ],
    },
    {
      stars: 2,
      level: "INTERMEDIATE",
      badges: [
        { text: "600L+", variant: "primary" as const },
        { text: "2~3학년", variant: "primary" as const },
      ],
    },
    {
      stars: 3,
      level: "ADVANCED",
      badges: [
        { text: "700L+", variant: "primary" as const },
        { text: "3~4학년", variant: "primary" as const },
      ],
    },
    {
      stars: 4,
      level: "EXPERT",
      badges: [
        { text: "800L+", variant: "primary" as const },
        { text: "4~5학년", variant: "primary" as const },
      ],
    },
    {
      stars: 5,
      level: "MASTER",
      badges: [
        { text: "900L+", variant: "primary" as const },
        { text: "5학년+", variant: "primary" as const },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden">
      <m.div
        className="relative flex flex-col gap-3 border-b border-[#1c1b1b] py-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <m.h2
          className="text-center text-3xl font-bold text-[#1c1b1b] uppercase md:text-4xl lg:text-[48px]"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          NOVEL
        </m.h2>
        <m.p
          className="text-center text-xl font-semibold text-[#1c1b1b] uppercase md:text-2xl lg:text-[28px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          읽고, 풀고, 성장하는{" "}
          <span className="text-[#671420]">영어 독해 학습</span> 공간
        </m.p>
      </m.div>

      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 lg:flex-row lg:gap-10 lg:py-10">
        {/* Features Carousel - Mobile Only */}
        <m.div
          className="flex flex-1 flex-col gap-4 md:hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {features.map((feature, index) => (
                <div key={index} className="min-w-0 flex-[0_0_100%] px-4">
                  <AnimatedFeatureCard {...feature} index={index} />
                </div>
              ))}
            </div>
            {/* Pagination Indicators - Inside Carousel */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? "w-6 bg-[#671420]"
                      : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </m.div>

        {/* Features Grid - Tablet/Desktop */}
        <m.div
          className="hidden flex-1 flex-col gap-4 md:flex md:gap-6 lg:min-w-[680px] lg:gap-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-10">
            <AnimatedFeatureCard {...features[0]} index={0} />
            <AnimatedFeatureCard {...features[1]} index={1} />
            <AnimatedFeatureCard {...features[2]} index={2} />
            <AnimatedFeatureCard {...features[3]} index={3} />
          </div>
        </m.div>

        {/* Levels Sidebar */}
        <m.div
          className="flex w-full flex-col gap-4 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.04)] md:gap-5 lg:max-w-80 lg:min-w-80 lg:gap-6"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <m.h3
            className="text-center text-xl font-semibold text-[#1c1b1b] uppercase md:text-2xl lg:text-[28px]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            5가지 레벨
          </m.h3>
          {levels.map((level, index) => (
            <AnimatedLevelCard key={index} {...level} index={index} />
          ))}
        </m.div>
      </div>
    </div>
  );
};

export default NovelSection;

