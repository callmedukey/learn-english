"use client";

import * as m from "motion/react-client";
import Image from "next/image";
import React from "react";

import certificate from "@/public/images/certificate.webp";
import icon100points from "@/public/images/icon-100points.svg";
import icon24hours from "@/public/images/icon-24hours.svg";
import iconIdea from "@/public/images/icon-idea.svg";
import iconMedal from "@/public/images/icon-medal.svg";

const BenefitsSection = () => {
  const benefits = [
    {
      id: 1,
      icon: icon24hours,
      title: "매일 변화 확인",
      description: "리더보드로 매일 성장과 변화를 한눈에 확인",
    },
    {
      id: 2,
      icon: icon100points,
      title: "시험 대비",
      description: "수능 및 각종 시험 유형에 맞춘 체계적 학습",
    },
    {
      id: 3,
      icon: iconIdea,
      title: "흥미 유지",
      description: "퀴즈와 보상 챌린지로 학습 의욕 UP",
    },
    {
      id: 4,
      icon: iconMedal,
      title: "성취감 제공",
      description: "메달과 인증서로 학습 성과를 직접 확인",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 md:px-10 lg:px-20 pb-20 md:pb-32 lg:pb-40 pt-6 md:pt-8 lg:pt-10">
      <m.div 
        className="flex w-full flex-col items-start justify-center gap-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <m.div 
          className="flex w-full flex-col items-start justify-start gap-5 rounded-2xl py-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <m.h2 
            className="w-full text-center text-2xl md:text-4xl lg:text-[48px] font-bold text-[#671420] uppercase"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            READING CHAMP에서 누릴 수 있는 주요 혜택!
          </m.h2>
        </m.div>

        <div className="flex w-full flex-col lg:flex-row items-start justify-center gap-6 md:gap-8 lg:gap-10">
          {/* Benefits List - Mobile First */}
          <div className="order-1 lg:order-2 flex w-full lg:min-h-[819px] lg:min-w-[340px] lg:max-w-[475px] lg:flex-1 lg:basis-0 flex-col items-start justify-center gap-6 md:gap-8 lg:gap-10">
            <div className="flex w-full flex-1 flex-col items-start justify-center gap-6 md:gap-8 lg:gap-10 px-0 md:px-3 lg:px-5 py-4 md:py-6 lg:py-8">
              {benefits.map((benefit, index) => (
                <m.div
                  key={benefit.id}
                  className="flex w-full flex-col items-start justify-start gap-4"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                >
                  <m.div 
                    className="flex items-center justify-center rounded-[100px] bg-[#671420] px-5 py-0.5"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                  >
                    <span className="text-base md:text-lg lg:text-[19px] font-semibold text-white">
                      POINT {benefit.id}
                    </span>
                  </m.div>
                  <div className="flex w-full items-center justify-start gap-4">
                    <m.div 
                      className="relative h-10 w-10 shrink-0"
                      initial={{ rotate: -180, opacity: 0 }}
                      whileInView={{ rotate: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                    >
                      <Image
                        src={benefit.icon}
                        alt={benefit.title}
                        fill
                        className="object-contain"
                      />
                    </m.div>
                    <m.h3 
                      className="text-2xl md:text-[28px] lg:text-[32px] font-semibold text-[#671420] uppercase"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    >
                      {benefit.title}
                    </m.h3>
                  </div>
                  <m.p 
                    className="w-full text-lg md:text-xl lg:text-2xl font-normal text-[#1c1b1b] uppercase"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  >
                    {benefit.description}
                  </m.p>
                </m.div>
              ))}
            </div>
          </div>

          {/* Certificate Image - Second on Mobile */}
          <m.div 
            className="order-2 lg:order-1 relative w-full lg:min-h-[483px] lg:min-w-[340px] lg:flex-1 lg:basis-0"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl lg:rounded-3xl bg-[#fdf4e9] p-4 md:p-6 lg:p-8">
              <Image
                src={certificate}
                alt="Certificate of Achievement"
                className="h-auto w-full rounded-xl object-contain"
                quality={100}
                priority
              />
              <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[#e2d6c7] shadow-[0px_8px_24px_-3px_rgba(16,24,40,0.05),0px_8px_24px_-3px_rgba(16,24,40,0.1)]" />
            </div>
          </m.div>
        </div>
      </m.div>
    </div>
  );
};

export default BenefitsSection;