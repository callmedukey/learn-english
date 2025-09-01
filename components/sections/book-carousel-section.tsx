"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import * as m from "motion/react-client";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";

import advanced1 from "@/public/images/landing/books/advanced1.webp";
import advanced2 from "@/public/images/landing/books/advanced2.webp";
import advanced3 from "@/public/images/landing/books/advanced3.webp";
import advanced4 from "@/public/images/landing/books/advanced4.webp";
import beginner1 from "@/public/images/landing/books/beginner1.webp";
import beginner2 from "@/public/images/landing/books/beginner2.webp";
import beginner3 from "@/public/images/landing/books/beginner3.webp";
import beginner4 from "@/public/images/landing/books/beginner4.webp";
import expert1 from "@/public/images/landing/books/expert1.webp";
import expert2 from "@/public/images/landing/books/expert2.webp";
import expert3 from "@/public/images/landing/books/expert3.webp";
import expert4 from "@/public/images/landing/books/expert4.webp";
import intermediate1 from "@/public/images/landing/books/intermediate1.webp";
import intermediate2 from "@/public/images/landing/books/intermediate2.webp";
import intermediate3 from "@/public/images/landing/books/intermediate3.webp";
import intermediate4 from "@/public/images/landing/books/intermediate4.webp";
import master1 from "@/public/images/landing/books/master1.webp";
import master2 from "@/public/images/landing/books/master2.webp";
import master3 from "@/public/images/landing/books/master3.webp";
import master4 from "@/public/images/landing/books/master4.webp";

const BookCarouselSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 25,
    },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const levels = [
    { name: "BEGINNER", lexile: "Lexile 500L+" },
    { name: "INTERMEDIATE", lexile: "Lexile 600L+" },
    { name: "ADVANCED", lexile: "Lexile 700L+" },
    { name: "EXPERT", lexile: "Lexile 800L+" },
    { name: "MASTER", lexile: "Lexile 900L+" },
  ];

  const booksByLevel = [
    [beginner1, beginner2, beginner3, beginner4], // Beginner
    [intermediate1, intermediate2, intermediate3, intermediate4], // Intermediate
    [advanced1, advanced2, advanced3, advanced4], // Advanced
    [expert1, expert2, expert3, expert4], // Expert
    [master1, master2, master3, master4], // Master
  ];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-10 lg:px-20 py-6 md:py-8 lg:py-10 overflow-x-hidden">
      <m.div 
        className="flex w-full flex-col items-center justify-center gap-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <m.div 
          className="flex w-full flex-col items-start justify-start gap-3 md:gap-4 lg:gap-5 text-center uppercase"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <m.h2 
            className="w-full text-center text-3xl md:text-4xl lg:text-[48px] font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <span className="text-[#1c1b1b]">매달 새로 만나는 </span>
            <span className="text-[#671420]">도서 리스트</span>
          </m.h2>
          <m.p 
            className="w-full text-center text-base md:text-xl lg:text-2xl font-medium text-[#1c1b1b] px-2 md:px-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            Lexile 지수로 나눈 레벨별 4권씩, 총 20권! 매월 1일 새로운 도서와
            문제로 독서와 학습을 동시에 즐기기
          </m.p>
        </m.div>

        <m.div 
          className="box-border flex w-full items-center justify-center gap-4 md:gap-6 lg:gap-8 rounded-xl md:rounded-2xl lg:rounded-[36px] bg-[#fffdfb] p-4 md:p-6 lg:p-10 shadow-[0px_8px_24px_-3px_rgba(16,24,40,0.05),0px_8px_24px_-3px_rgba(16,24,40,0.1)]"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
        <div className="flex w-full flex-col items-center justify-center gap-8">
          {/* Embla Carousel Container */}
          <div className="w-full overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {levels.map((level, levelIndex) => (
                <div
                  key={levelIndex}
                  className="flex min-w-0 flex-[0_0_100%] flex-col items-center gap-8"
                >
                  {/* Level badges */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center rounded-[500px] bg-[#671420] px-3 md:px-4 lg:px-5 py-0.5 md:py-1 shadow-[0px_2px_6px_0px_rgba(16,24,40,0.06)]">
                      <span className="text-base md:text-xl lg:text-2xl font-normal text-[#fffdfb] uppercase">
                        {level.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded-[500px] px-3 md:px-4 lg:px-5 py-0.5 md:py-1 shadow-[0px_2px_6px_0px_rgba(16,24,40,0.06)]">
                      <span className="text-sm md:text-lg lg:text-2xl font-normal text-[#671420] uppercase">
                        {level.lexile}
                      </span>
                    </div>
                  </div>

                  {/* Books grid */}
                  <div className="mx-auto grid w-full max-w-7xl grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-5">
                    {booksByLevel[levelIndex].map((book, bookIndex) => (
                      <div
                        key={bookIndex}
                        className="relative w-full"
                        style={{ aspectRatio: "197 / 289" }}
                      >
                        <Image
                          src={book}
                          alt={`${level.name} Book ${bookIndex + 1}`}
                          fill
                          className="rounded object-cover shadow-[0px_6px_15px_-2px_rgba(16,24,40,0.08)]"
                          quality={100}
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          priority={levelIndex === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={scrollPrev}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-100"
              aria-label="Previous level"
            >
              <Image
                src="/images/chevron.svg"
                alt="Previous"
                width={12}
                height={6}
                className="-rotate-90"
              />
            </button>

            {levels.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === selectedIndex
                    ? "w-6 bg-[#671420]"
                    : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to ${levels[index].name}`}
              />
            ))}

            <button
              onClick={scrollNext}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-100"
              aria-label="Next level"
            >
              <Image
                src="/images/chevron.svg"
                alt="Next"
                width={12}
                height={6}
                className="rotate-90"
              />
            </button>
          </div>
        </div>
      </m.div>
      </m.div>
    </div>
  );
};

export default BookCarouselSection;

