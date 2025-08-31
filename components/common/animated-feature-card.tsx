"use client";

import * as m from "motion/react-client";
import Image, { StaticImageData } from "next/image";
import React from "react";

interface FeatureCardProps {
  icon: StaticImageData;
  title: string;
  description: string;
  index?: number;
}

const AnimatedFeatureCard = ({ icon, title, description, index = 0 }: FeatureCardProps) => {
  return (
    <m.div 
      className="flex flex-1 flex-col items-center gap-8 md:gap-6 lg:gap-8 rounded-2xl md:rounded-3xl lg:rounded-[36px] border border-[#fcf0e1] bg-[#fffdfb] px-5 md:px-5 lg:px-6 py-16 md:py-10 lg:py-14 shadow-[0px_4px_12px_0px_rgba(16,24,40,0.12)]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      <m.div 
        className="flex size-32 md:size-32 lg:size-40 items-center justify-center rounded-full bg-[#fffdfb] px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.2, ease: "easeOut" }}
      >
        <Image
          src={icon}
          alt={title}
          className="w-16 h-16 md:w-16 md:h-16 lg:w-20 lg:h-20"
          width={80}
          height={80}
          quality={100}
        />
      </m.div>
      <div className="flex flex-col gap-5 text-center">
        <m.h3 
          className="text-lg md:text-xl lg:text-2xl font-medium text-[#1c1b1b] uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
        >
          {title}
        </m.h3>
        <m.p 
          className="text-sm md:text-sm lg:text-base font-medium text-[#1c1b1b] whitespace-pre-line leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
        >
          {description}
        </m.p>
      </div>
    </m.div>
  );
};

export default AnimatedFeatureCard;