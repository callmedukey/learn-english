"use client";

import * as m from "motion/react-client";
import Image from "next/image";
import React from "react";

import leaderboard from "@/public/images/leaderboard.webp";

const LeaderboardSection = () => {
  return (
    <div className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 md:px-10 lg:px-4 py-10 md:py-12 lg:py-14">
      <m.div 
        className="flex w-full flex-col items-center justify-center gap-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <m.div 
          className="flex w-full flex-col items-start justify-start gap-3 md:gap-4 lg:gap-5 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <m.h2 
            className="w-full text-3xl md:text-4xl lg:text-[48px] font-bold uppercase"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <span className="text-[#1c1b1b]">학습 성과를 한눈에 확인하는 </span>
            <span className="text-[#671420]">리더보드</span>
          </m.h2>
          <m.p 
            className="w-full text-base md:text-xl lg:text-2xl font-medium text-[#1c1b1b] uppercase px-2 md:px-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            또래와 점수를 비교하며 독해 실력을 객관적으로 살피고, 내 수준에 맞는
            학습 난이도를 손쉽게 파악
          </m.p>
        </m.div>
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="w-full"
        >
          <Image
            src={leaderboard}
            alt="Leaderboard Interface"
            className="w-full object-cover ring-4"
            quality={100}
          />
        </m.div>
      </m.div>
    </div>
  );
};

export default LeaderboardSection;
