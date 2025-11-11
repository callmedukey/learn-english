import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

import footerLogo from "@/public/images/footer-logo.png";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#1c1b1b]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-10 md:py-12 lg:px-20 lg:py-14">
        {/* Mobile Layout */}
        <div className="flex flex-col items-center gap-8 md:hidden">
          {/* Logo */}
          <Image
            src={footerLogo}
            alt="Reading Champ Logo"
            quality={100}
            className="h-auto w-[156px]"
          />

          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-110"
              aria-label="Follow us on X (Twitter)"
            >
              <SiX size={18} />
            </a>
            <a
              href="https://www.instagram.com/readingchamp_official"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4405F] text-white transition-transform hover:scale-110"
              aria-label="Follow us on Instagram"
            >
              <SiInstagram size={18} />
            </a>
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:scale-110"
              aria-label="Follow us on Facebook"
            >
              <SiFacebook size={18} />
            </a>
          </div>

          {/* Business Information - Mobile */}
          <div className="flex flex-col gap-2 text-left text-sm text-[#1c1b1b]">
            <p className="font-bold">(주)비피에이교육 (BPA Education)</p>
            <p>
              <span className="font-bold">대표자</span> KIM DAVID
            </p>
            <p>
              <span className="font-bold">사업자등록번호</span> 393-81-00352 |
            </p>
            <p>
              <span className="font-bold">통신판매업</span> 2025-성남분당B-0472
            </p>
            <p>
              <span className="font-bold">주소</span> (13555) 경기도 성남시
              분당구 성남대로 385, 8층
            </p>
            <p>
              <span className="font-bold">연락처</span> 031-712-0331 |
            </p>
            <p>
              <span className="font-bold">이메일</span> reading-champ@reading-champ.com
            </p>
          </div>

          <Link
            href="/refund-policy"
            className="text-sm text-[#1c1b1b] underline hover:text-[#671420]"
          >
            [환불정책]
          </Link>
        </div>

        {/* Tablet Layout */}
        <div className="hidden flex-col items-center gap-8 md:flex lg:hidden">
          {/* Logo */}
          <Image
            src={footerLogo}
            alt="Reading Champ Logo"
            width={170}
            height={227}
            quality={100}
            className="h-auto w-[195px]"
          />

          {/* Social Media Icons */}
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-110"
              aria-label="Follow us on X (Twitter)"
            >
              <SiX size={18} />
            </a>
            <a
              href="https://www.instagram.com/readingchamp_official"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4405F] text-white transition-transform hover:scale-110"
              aria-label="Follow us on Instagram"
            >
              <SiInstagram size={18} />
            </a>
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:scale-110"
              aria-label="Follow us on Facebook"
            >
              <SiFacebook size={18} />
            </a>
          </div>

          {/* Business Information - Tablet */}
          <div className="flex flex-col gap-2 text-left text-base text-[#1c1b1b]">
            <p className="text-lg font-bold">
              (주)비피에이교육 (BPA EDUCATION)
            </p>
            <p>
              <span className="font-bold">대표자</span> KIM DAVID
            </p>
            <p>
              <span className="font-bold">사업자등록번호</span> 393-81-00352 |{" "}
              <span className="font-bold">통신판매업</span> 2025-성남분당B-0472
            </p>
            <p>
              <span className="font-bold">주소</span> (13555) 경기도 성남시
              분당구 성남대로 385, 8층
            </p>
            <p>
              <span className="font-bold">연락처</span> 031-712-0331 |{" "}
              <span className="font-bold">이메일</span> reading-champ@reading-champ.com
            </p>
          </div>

          <Link
            href="/refund-policy"
            className="text-base text-[#1c1b1b] underline hover:text-[#671420]"
          >
            [환불정책]
          </Link>
        </div>

        {/* Desktop Layout */}
        <div className="hidden flex-col gap-10 lg:flex">
          <div className="flex items-start justify-between gap-20">
            {/* Logo and Social Media */}
            <div className="flex flex-col items-center gap-4">
              <Image
                src={footerLogo}
                alt="Reading Champ Logo"
                width={170}
                height={227}
                quality={100}
                className="h-auto w-[170px]"
              />
              {/* Social Media Icons */}
              <div className="flex items-center gap-5">
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-110"
                  aria-label="Follow us on X (Twitter)"
                >
                  <SiX size={18} />
                </a>
                <a
                  href="https://www.instagram.com/readingchamp_official"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4405F] text-white transition-transform hover:scale-110"
                  aria-label="Follow us on Instagram"
                >
                  <SiInstagram size={18} />
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:scale-110"
                  aria-label="Follow us on Facebook"
                >
                  <SiFacebook size={18} />
                </a>
              </div>
            </div>

            {/* Business Information - Desktop */}
            <div className="flex flex-1 flex-col gap-4 text-[#1c1b1b]">
              <h3 className="text-2xl font-bold uppercase">
                (주)비피에이교육 (BPA Education)
              </h3>
              <div className="space-y-2 text-lg">
                <p>
                  <span className="font-bold">대표자</span>
                  <span className="ml-2">KIM DAVID</span>
                </p>
                <p>
                  <span className="font-bold">사업자등록번호</span>
                  <span className="ml-2">393-81-00352</span>
                  <span className="mx-2">|</span>
                  <span className="font-bold">통신판매업</span>
                  <span className="ml-2">2025-성남분당B-0472</span>
                </p>
                <p>
                  <span className="font-bold">주소</span>
                  <span className="ml-2">
                    (13555) 경기도 성남시 분당구 성남대로 385, 8층
                  </span>
                </p>
                <p>
                  <span className="font-bold">연락처</span>
                  <span className="ml-2">031-712-0331</span>
                  <span className="mx-2">|</span>
                  <span className="font-bold">이메일</span>
                  <span className="ml-2">reading-champ@reading-champ.com</span>
                </p>
              </div>
              <Link
                href="/refund-policy"
                className="mt-2 inline-block text-lg text-[#1c1b1b] underline hover:text-[#671420]"
              >
                [환불정책]
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright - All Layouts */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center md:mt-10 lg:mt-14">
          <p className="text-sm text-[#1c1b1b] md:text-base lg:text-lg">
            © 2025 Reading Champ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
