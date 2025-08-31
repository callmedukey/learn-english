"use client";

import * as m from "motion/react-client";
import Image from "next/image";
import React from "react";

interface Badge {
  text: string;
  variant: "primary" | "secondary";
}

interface LevelCardProps {
  stars: number;
  level: string;
  badges: Badge[];
  index?: number;
}

const AnimatedLevelCard = ({ stars, level, badges, index = 0 }: LevelCardProps) => {
  return (
    <m.div 
      className="flex flex-col gap-2 md:gap-2.5 lg:gap-3 rounded-xl md:rounded-2xl lg:rounded-3xl border border-[#fcf0e1] bg-[#fffdfb] px-3 md:px-3.5 lg:px-4 py-4 md:py-5 lg:py-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.04)]"
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: stars }).map((_, starIndex) => (
          <m.div
            key={starIndex}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 + starIndex * 0.05, ease: "easeOut" }}
          >
            <Image
              src="/images/star.svg"
              alt="star"
              width={24}
              height={24}
            />
          </m.div>
        ))}
        <m.span 
          className="text-base md:text-lg lg:text-[19px] font-semibold text-[#1c1b1b]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
        >
          {level}
        </m.span>
      </div>
      <div className="flex justify-center gap-2">
        {badges.map((badge, badgeIndex) => (
          <m.span
            key={badgeIndex}
            className={`rounded-[100px] px-3 md:px-4 lg:px-5 py-0.5 text-sm md:text-sm lg:text-base font-semibold whitespace-nowrap ${
              badge.variant === "primary"
                ? "bg-[#671420] text-[#fffdfb]"
                : "text-[#671420]"
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.4 + badgeIndex * 0.05 }}
          >
            {badge.text}
          </m.span>
        ))}
      </div>
    </m.div>
  );
};

export default AnimatedLevelCard;