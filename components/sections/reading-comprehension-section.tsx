"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { motion as m } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";

import AnimatedFeatureCard from "@/components/common/animated-feature-card";
import AnimatedRCLevelCard from "@/components/common/animated-rc-level-card";
import calendarIcon from "@/public/images/calendar.webp";
import knowledgeIcon from "@/public/images/knowledge.webp";
import levelIcon from "@/public/images/level.webp";
import repeatIcon from "@/public/images/repeat.webp";

const ReadingComprehensionSection = () => {
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
      icon: levelIcon,
      title: "난이도별 맞춤 학습",
      description:
        "수능 독해 문제를 난이도별로 구성해\n개인 수준에 맞춰 학습합니다.",
    },
    {
      icon: calendarIcon,
      title: "매달 새로운 문제",
      description:
        "매달 새롭게 제공되는 1,000문제,\n레벨별 30세트로 부담 없이 즐겁게 학습",
    },
    {
      icon: knowledgeIcon,
      title: "폭넓은 지문 경험",
      description:
        "다양한 영역 지문을 접하며 배경지식을\n확장하고 지문을 논리적으로 해석합니다.",
    },
    {
      icon: repeatIcon,
      title: "시험 핵심 과정 반복",
      description:
        "체계적 훈련으로 내신∙수능 핵심 독해력과\n문제 해결력 효과적으로 강화합니다.",
    },
  ];

  const levels = [
    {
      stars: 1,
      level: "BEGINNER",
      badges: [
        { text: "1~2학년", variant: "primary" as const },
        { text: "세트당 5문제", variant: "primary" as const },
      ],
      totalQuestions: "150문제 제공",
    },
    {
      stars: 2,
      level: "INTERMEDIATE",
      badges: [
        { text: "3~4학년", variant: "primary" as const },
        { text: "세트당 7문제", variant: "primary" as const },
      ],
      totalQuestions: "210문제 제공",
    },
    {
      stars: 3,
      level: "ADVANCED",
      badges: [
        { text: "5~6학년", variant: "primary" as const },
        { text: "세트당 10문제", variant: "primary" as const },
      ],
      totalQuestions: "300문제 제공",
    },
    {
      stars: 4,
      level: "EXPERT",
      badges: [
        { text: "7~8학년", variant: "primary" as const },
        { text: "세트당 10문제", variant: "primary" as const },
      ],
      totalQuestions: "300문제 제공",
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
          READING COMPREHENSION
        </m.h2>
        <m.p
          className="px-4 text-center text-xl font-semibold text-[#1c1b1b] uppercase md:px-0 md:text-2xl lg:text-[28px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <span className="text-[#671420]">내신·수능 대비</span> 단계별 학습으로{" "}
          <span className="text-[#671420]">독해력</span>과
          <span className="text-[#671420]"> 논리적 사고</span>를 동시에!
        </m.p>
      </m.div>

      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 lg:flex-row lg:gap-10 lg:py-10">
        {/* RC Levels */}
        <m.div
          className="order-2 flex w-full flex-col gap-4 md:gap-5 lg:order-1 lg:max-w-80 lg:min-w-80 lg:gap-6"
          initial={{ opacity: 0, x: -50 }}
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
            4가지 레벨
          </m.h3>
          {levels.map((level, index) => (
            <AnimatedRCLevelCard key={index} {...level} index={index} />
          ))}
        </m.div>

        {/* RC Features Carousel - Mobile Only */}
        <m.div
          className="order-1 flex flex-1 flex-col gap-4 md:hidden"
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

        {/* RC Features Grid - Tablet/Desktop */}
        <m.div
          className="order-1 hidden flex-1 flex-col gap-4 md:flex md:gap-6 lg:order-2 lg:min-w-[680px] lg:gap-10"
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
      </div>
    </div>
  );
};

export default ReadingComprehensionSection;
