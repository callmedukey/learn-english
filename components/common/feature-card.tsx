import Image, { StaticImageData } from "next/image";
import React from "react";

interface FeatureCardProps {
  icon: StaticImageData;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="flex min-w-[310px] flex-1 flex-col items-center gap-8 rounded-[36px] border border-[#fcf0e1] bg-[#fffdfb] px-6 py-14 shadow-[0px_2px_6px_0px_rgba(16,24,40,0.06)]">
      <div className="flex size-40 items-center justify-center rounded-full bg-[#fffdfb] px-8 py-5">
        <Image
          src={icon}
          alt={title}
          width={80}
          height={80}
          quality={100}
        />
      </div>
      <div className="flex flex-col gap-4 text-center">
        <h3 className="text-2xl font-medium text-[#1c1b1b] uppercase">
          {title}
        </h3>
        <p className="text-base font-medium text-[#1c1b1b] whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;