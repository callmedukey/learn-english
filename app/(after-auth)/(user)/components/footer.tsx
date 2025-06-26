import Link from "next/link";
import React from "react";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-gray-300 py-8 text-gray-600">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-center">
          {/* Business Information */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-4 text-center text-sm md:grid-cols-2 md:text-left">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Business Name:</span>
                  <span className="ml-2 text-gray-500">
                    (주)비피에이교육 (BPA Education)
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Business Registration:</span>
                  <span className="ml-2 text-gray-500">393-81-00352</span>
                </div>
                <div>
                  <span className="font-semibold">CEO:</span>
                  <span className="ml-2 text-gray-500">KIM DAVID EUNKEE</span>
                </div>
                <div>
                  <span className="font-semibold">Phone:</span>
                  <span className="ml-2 text-gray-500">+82-0507-1432-0332</span>
                </div>
                <div className="">
                  <Link href="/refund-policy" className="text-gray-500">
                    Refund Policy
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Email:</span>
                  <span className="ml-2 text-gray-500">
                    readingchamp25@gmail.com
                  </span>
                </div>
                <div>
                  <span className="font-semibold">
                    Mail-order Sales Registration:
                  </span>
                  <span className="ml-2 text-gray-500">
                    {/* 2025 - Seongnam Bundang B-0472 */}
                    2025-성남분당B-0472
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Address:</span>
                  <span className="ml-2 text-gray-500">
                    8th floor, 385, Seongnam-daero, Bundang-gu, Seongnam-si,
                    Gyeonggi-do, Republic of Korea
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="flex flex-col items-center">
            <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/readingchamp_official"
                className="rounded-full bg-gray-200 p-2 transition-colors duration-200 hover:bg-primary hover:text-white"
                aria-label="Follow us on Instagram"
              >
                <SiInstagram size={20} />
              </a>
              <a
                href="#"
                className="rounded-full bg-gray-200 p-2 transition-colors duration-200 hover:bg-primary hover:text-white"
                aria-label="Follow us on X (Twitter)"
              >
                <SiX size={20} />
              </a>
              <a
                href="#"
                className="rounded-full bg-gray-200 p-2 transition-colors duration-200 hover:bg-primary hover:text-white"
                aria-label="Follow us on Facebook"
              >
                <SiFacebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-gray-300 pt-4 text-center text-sm text-gray-500">
          <p>&copy; 2025 Reading Champ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
