"use client";

import * as m from "motion/react-client";
import Image from "next/image";
import React from "react";

import heroNovelMobile from "@/public/images/hero-novel-mobile.webp";
import heroRcMobile from "@/public/images/hero-rc-mobile.webp";
import heroImage from "@/public/images/hero-section.webp";

const HeroSection = () => {
  return (
    <section className="relative box-border flex w-full flex-col items-center justify-start gap-6 overflow-x-hidden px-4 pt-20 pb-5 **:break-keep md:gap-8 md:px-10 md:pt-24 lg:gap-10 lg:px-20 lg:pt-28">
      <m.div
        className="relative flex w-full max-w-6xl flex-col items-start justify-start gap-4 text-left text-[#1c1b1b] md:items-center md:gap-6 md:text-center lg:gap-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <m.h1
          className="text-3xl leading-tight font-bold md:text-5xl lg:text-[64px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          아이의 <span className="text-[#671420]">영어 독해 실력</span>, 매일
          성장하는 습관
        </m.h1>
        <m.p
          className="text-base font-medium text-gray-700 md:text-xl lg:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          리딩 챔프는 아이의 학습 이해도를 매일 점검하고, 부모는 실시간으로
          성과를 확인할 수 있습니다.
        </m.p>
      </m.div>
      {/* Desktop/Tablet Hero Image */}
      <m.div
        className="relative hidden h-[450px] w-full max-w-6xl md:block lg:h-[605px]"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      >
        <Image
          src={heroImage}
          alt="리딩 챔프 - 영어 독해 학습 플랫폼"
          fill
          quality={100}
          priority
          className="object-contain"
          sizes="(max-width: 1200px) 90vw, 1200px"
        />
      </m.div>

      {/* Mobile Hero Images */}
      <m.div
        className="flex w-full flex-col gap-4 md:hidden"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      >
        <m.div
          className="relative aspect-[343/298] w-full overflow-hidden rounded-[36px]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        >
          <Image
            src={heroNovelMobile}
            alt="Novel - 영어 원서를 재대로 읽는 가장 똑똑한 방법"
            fill
            quality={100}
            priority
            className="object-cover"
            sizes="100vw"
          />
        </m.div>
        <m.div
          className="relative aspect-[343/298] w-full overflow-hidden rounded-[36px]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
          <Image
            src={heroRcMobile}
            alt="RC - 논에 딱게 성장하는 논리적 독해력과 사고력"
            fill
            quality={100}
            priority
            className="object-cover"
            sizes="100vw"
          />
        </m.div>
      </m.div>
    </section>
  );
};

export default HeroSection;

