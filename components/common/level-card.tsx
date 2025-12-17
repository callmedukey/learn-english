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
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[#fcf0e1] bg-[#fffdfb] px-4 py-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-center gap-2">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Image
            key={`full-${index}`}
            src="/images/star.svg"
            alt="star"
            width={24}
            height={24}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative h-6 w-6">
            <Image
              src="/images/star.svg"
              alt="empty star"
              width={24}
              height={24}
              className="absolute left-0 top-0 opacity-30"
            />
            <div className="absolute left-0 top-0 overflow-hidden" style={{ width: '12px' }}>
              <Image
                src="/images/star.svg"
                alt="half star"
                width={24}
                height={24}
              />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Image
            key={`empty-${index}`}
            src="/images/star.svg"
            alt="empty star"
            width={24}
            height={24}
            className="opacity-30"
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