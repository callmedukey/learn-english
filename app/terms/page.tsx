import { Metadata } from "next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Terms of Use | 이용약관",
  description:
    "Terms of Use for Reading Champ | 리딩챔프 이용약관",
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <Tabs defaultValue="korean" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="korean">한국어</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>

              {/* Korean Content */}
              <TabsContent value="korean" className="mt-6">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                  이용약관
                </h1>

                <p className="mb-8 text-gray-600">
                  본 이용약관(이하 &quot;약관&quot;)은 리딩챔프(이하
                  &quot;서비스&quot;)를 운영하는 (주)비피에이교육(이하
                  &quot;회사&quot;)과 이용자 간의 권리, 의무 및 책임사항을
                  규정합니다.
                </p>

                {/* 서비스 이용 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    서비스 이용
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        리딩챔프는 영어 독해 학습을 위한 온라인 교육
                        서비스입니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        서비스 이용을 위해서는 회원가입이 필요하며, 만 14세
                        미만의 이용자는 법정대리인의 동의가 필요합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        일부 콘텐츠는 유료 구독을 통해서만 이용 가능합니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 이용자의 의무 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    이용자의 의무
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        이용자는 가입 시 정확한 정보를 제공해야 합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        계정 정보(이메일, 비밀번호)의 관리 책임은 이용자에게
                        있습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        서비스 내 콘텐츠의 무단 복제, 배포, 상업적 이용은
                        금지됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        타인의 계정을 도용하거나 서비스를 악용하는 행위는
                        금지됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 구독 및 결제 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    구독 및 결제
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        유료 구독은 월간, 분기, 연간 단위로 제공됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        구독은 결제 확인 시점부터 시작되며, 해지하지 않는 한
                        자동으로 갱신됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        결제는 토스페이먼츠, Apple App Store, Google Play Store를
                        통해 처리됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        가격은 사전 공지 후 변경될 수 있으며, 기존 구독자에게는
                        다음 갱신 시점부터 적용됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 구독 해지 및 환불 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    구독 해지 및 환불
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        구독 해지는 현재 결제 기간 종료 최소 24시간 전까지
                        가능합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        해지 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용할
                        수 있습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        환불은 전자상거래 등에서의 소비자보호에 관한 법률에 따라
                        처리됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        앱 스토어 결제의 경우 해당 스토어의 환불 정책이
                        적용됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 지적재산권 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    지적재산권
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        서비스 내 모든 콘텐츠(텍스트, 이미지, 음성 등)의
                        저작권은 회사 또는 콘텐츠 제공자에게 있습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        이용자는 개인 학습 목적으로만 콘텐츠를 이용할 수
                        있습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        콘텐츠의 무단 복제, 배포, 전송, 출판은 법적 제재의
                        대상이 됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 면책 조항 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    면책 조항
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        회사는 천재지변, 시스템 장애 등 불가항력적인 사유로 인한
                        서비스 중단에 대해 책임지지 않습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        이용자의 과실로 인한 계정 도용, 정보 유출에 대해 회사는
                        책임지지 않습니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        서비스 개선을 위한 시스템 점검 시 사전 공지 후 서비스가
                        일시 중단될 수 있습니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 분쟁 해결 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    분쟁 해결
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        서비스 이용과 관련한 분쟁은 회사 소재지를 관할하는
                        법원을 전속 관할 법원으로 합니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 문의처 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    문의처
                  </h2>
                  <div className="rounded-lg bg-gray-50 p-6">
                    <p className="mb-2 text-gray-600">
                      이용약관 관련 문의사항이 있으시면 아래로 연락해 주세요:
                    </p>
                    <p className="flex items-center text-gray-700">
                      <svg
                        className="mr-2 h-5 w-5 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href="mailto:reading-champ@reading-champ.com"
                        className="text-amber-600 hover:underline"
                      >
                        reading-champ@reading-champ.com
                      </a>
                    </p>
                  </div>
                </section>

                {/* 시행일 */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <p className="text-sm text-gray-500">
                    본 이용약관은 2024년 1월 1일부터 시행됩니다.
                  </p>
                </div>
              </TabsContent>

              {/* English Content */}
              <TabsContent value="english" className="mt-6">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                  Terms of Use
                </h1>

                <p className="mb-8 text-gray-600">
                  These Terms of Use (&quot;Terms&quot;) govern the rights,
                  obligations, and responsibilities between BPA Education
                  (&quot;Company&quot;) and users of Reading Champ
                  (&quot;Service&quot;).
                </p>

                {/* Service Usage */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Service Usage
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Reading Champ is an online educational service for
                        English reading comprehension learning.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Registration is required to use the service. Users under
                        14 years of age require parental consent.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Some content is only accessible through paid
                        subscription.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* User Responsibilities */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    User Responsibilities
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Users must provide accurate information during
                        registration.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Users are responsible for managing their account
                        credentials (email, password).
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Unauthorized copying, distribution, or commercial use of
                        service content is prohibited.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Account theft or service abuse is strictly prohibited.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Subscription and Payment */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Subscription and Payment
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Paid subscriptions are available on monthly, quarterly,
                        and annual basis.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Subscriptions begin upon payment confirmation and
                        automatically renew unless cancelled.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Payments are processed through Toss Payments, Apple App
                        Store, or Google Play Store.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Prices may change with prior notice; changes apply to
                        existing subscribers at next renewal.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Cancellation and Refunds */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Cancellation and Refunds
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Subscription cancellation must be made at least 24 hours
                        before the end of current billing period.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        After cancellation, you may continue using the service
                        until the current billing period ends.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Refunds are processed according to the Electronic
                        Commerce Consumer Protection Act.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        For app store purchases, the respective store&apos;s
                        refund policy applies.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Intellectual Property */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Intellectual Property
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        All content (text, images, audio, etc.) is owned by the
                        Company or content providers.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Users may only use content for personal learning
                        purposes.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Unauthorized copying, distribution, transmission, or
                        publication is subject to legal action.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Limitation of Liability */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Limitation of Liability
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        The Company is not liable for service interruptions due
                        to force majeure or system failures.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        The Company is not responsible for account theft or
                        information leakage caused by user negligence.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Service may be temporarily suspended for system
                        maintenance with prior notice.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Governing Law */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Governing Law
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        These Terms are governed by and construed in accordance
                        with the laws of the Republic of Korea.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Any disputes shall be subject to the exclusive
                        jurisdiction of the courts where the Company is located.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Contact */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Contact
                  </h2>
                  <div className="rounded-lg bg-gray-50 p-6">
                    <p className="mb-2 text-gray-600">
                      For any inquiries regarding these Terms, please contact us
                      at:
                    </p>
                    <p className="flex items-center text-gray-700">
                      <svg
                        className="mr-2 h-5 w-5 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href="mailto:reading-champ@reading-champ.com"
                        className="text-amber-600 hover:underline"
                      >
                        reading-champ@reading-champ.com
                      </a>
                    </p>
                  </div>
                </section>

                {/* Effective Date */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <p className="text-sm text-gray-500">
                    These Terms of Use are effective as of January 1, 2024.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
