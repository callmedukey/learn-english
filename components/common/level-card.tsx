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
}

const LevelCard = ({ stars, level, badges }: LevelCardProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[#fcf0e1] bg-[#fffdfb] px-4 py-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: stars }).map((_, index) => (
          <Image
            key={index}
            src="/images/star.svg"
            alt="star"
            width={24}
            height={24}
          />
        ))}
        <span className="text-[19px] font-semibold text-[#1c1b1b]">
          {level}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        {badges.map((badge, index) => (
          <span
            key={index}
            className={`rounded-[100px] px-5 py-0.5 text-base font-semibold whitespace-nowrap ${
              badge.variant === "primary"
                ? "bg-[#671420] text-[#fffdfb]"
                : "text-[#671420]"
            }`}
          >
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LevelCard;