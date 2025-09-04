"use client";

import * as m from "motion/react-client";
import Image from "next/image";
import React from "react";

import quiz1 from "@/public/images/quiz1.webp";
import quiz2 from "@/public/images/quiz2.webp";
import quiz3 from "@/public/images/quiz3.webp";

const QuizSection = () => {
  return (
    <div className="box-border flex w-full flex-col items-center justify-center gap-6 overflow-x-hidden px-4 py-10 md:gap-8 md:px-10 md:py-16 lg:gap-10 lg:px-40 lg:py-20">
      <m.div
        className="flex w-full flex-col items-start justify-start gap-5"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <m.h2
          className="w-full text-center text-3xl font-bold text-[#1c1b1b] uppercase md:text-4xl lg:text-[48px]"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          독해력을 극대화하는 <span className="text-[#671420]">문제 풀이</span>
        </m.h2>
      </m.div>

      {/* Novel Quiz Section */}
      <m.div
        className="flex w-full flex-col items-center justify-start gap-3"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <m.div
          className="flex w-full max-w-[800px] items-center justify-center rounded-full bg-[#671420] px-6 py-1.5 md:rounded-[100px] md:px-12 md:py-2 lg:px-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <h3 className="text-center text-xl font-semibold text-white uppercase md:text-2xl lg:text-[32px]">
            학습 효과를 높이는 NOVEL 챕터 퀴즈
          </h3>
        </m.div>
        <m.p
          className="px-4 text-center text-base font-medium text-[#1c1b1b] uppercase md:px-0 md:text-xl lg:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        >
          읽기 능력을 평가하고 성취도를 높여주는 단계별 퀴즈 제공
        </m.p>
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          <Image
            src={quiz1}
            alt="Novel Quiz Interface"
            className="rounded-3xl object-cover"
            quality={100}
          />
        </m.div>
      </m.div>

      {/* RC Quiz Section */}
      <m.div
        className="flex w-full flex-col items-center justify-start gap-3"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <m.div
          className="flex w-full max-w-[800px] items-center justify-center rounded-full bg-[#671420] px-6 py-1.5 md:rounded-[100px] md:px-12 md:py-2 lg:px-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        >
          <h3 className="text-center text-xl font-semibold text-white uppercase md:text-2xl lg:text-[32px]">
            읽고 분석하며 성장하는 RC 퀴즈
          </h3>
        </m.div>
        <m.p
          className="px-4 text-center text-base font-medium text-[#1c1b1b] uppercase md:px-0 md:text-xl lg:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        >
          다양한 분야 지문과 수능형 문제로 핵심 이해와 분석력을 강화하는 퀴즈
          제공
        </m.p>

        <div className="mt-3 flex w-full max-w-[800px] flex-col items-center justify-start gap-3 md:mt-4 md:gap-4 lg:mt-5 lg:gap-5">
          <m.div
            className="relative aspect-[800/580] w-full"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            <Image
              src={quiz2}
              alt="RC Quiz Interface 1"
              fill
              className="rounded-3xl object-cover"
              quality={100}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
            />
            <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[#d7d7d7] shadow-[0px_20px_40px_-8px_rgba(16,24,40,0.05),0px_20px_40px_-8px_rgba(16,24,40,0.1)]" />
          </m.div>

          <m.div
            className="relative aspect-[800/588] w-full"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          >
            <Image
              src={quiz3}
              alt="RC Quiz Interface 2"
              fill
              className="rounded-3xl object-cover"
              quality={100}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
            />
            <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[#d7d7d7] shadow-[0px_20px_40px_-8px_rgba(16,24,40,0.05),0px_20px_40px_-8px_rgba(16,24,40,0.1)]" />
          </m.div>
        </div>
      </m.div>
    </div>
  );
};

export default QuizSection;
