import { Metadata } from "next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Refund Policy | 환불 정책",
  description:
    "Subscription Cancellation and Refund Policy | 이용권 환불 및 해지 정책",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <Tabs defaultValue="english" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="english">English</TabsTrigger>
                <TabsTrigger value="korean">한국어</TabsTrigger>
              </TabsList>

              {/* English Content */}
              <TabsContent value="english" className="mt-6">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                  Subscription Cancellation and Refund Policy
                </h1>

                {/* Eligibility for Refund */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Eligibility for Refund
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        A full refund is available if the refund request is made
                        within 3 days of the subscription purchase and no
                        content has been accessed.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        If any content has been accessed (e.g., if a quiz has
                        been attempted), refunds are not available.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        &quot;Use&quot; of content is defined as having any
                        record of quiz participation after logging in.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Refund Calculation for Annual Subscriptions */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Refund Calculation for Annual Subscriptions
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        For both monthly and annual subscriptions, once the
                        content has been used, a full refund is not available.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        However, users on 3, 6, or 12-month subscription plans
                        may request early termination and receive a partial
                        refund based on the following calculation:
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <div className="w-full">
                        <div className="rounded-md bg-amber-50 p-3 font-mono text-sm">
                          Refund Amount = [Total Payment] – (Monthly Plan Price
                          × Number of Months Used) – 10% Processing Fee
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Annual plans are offered at a discounted rate for
                        long-term commitment. Therefore, when processing a
                        refund, the standard monthly rate (non-discounted) will
                        be applied to calculate the usage.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        The number of months used is determined from the payment
                        date to the date the refund is requested.
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500 italic">
                        Example: If a 3-month plan is canceled on Day 45, it
                        will be considered as 2 full months used, and the refund
                        will apply only to the remaining 1 month.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        A 10% processing fee may apply only if the refund
                        request is made after 3 days from the payment date.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        No fee is charged for refund requests made within the
                        first 3 days.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Billing and Cancellation */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Billing and Cancellation
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        All subscriptions are set to auto-renew by default.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        You may cancel your subscription at any time, and
                        auto-renewal will stop starting from your next billing
                        cycle.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Even after cancellation, your subscription will remain
                        active for the remainder of the paid period.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* How to Request a Refund */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    How to Request a Refund
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        You may cancel your subscription directly through the
                        payment page on our website.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Refunds are processed within 7 business days after your
                        request is submitted.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Legal Notice */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <div className="space-y-2 text-sm text-gray-500">
                    <p className="flex items-start">
                      <span className="mr-2">※</span>
                      This refund policy complies with applicable consumer
                      protection laws including the Act on the Consumer
                      Protection in Electronic Commerce, the Content Industry
                      Promotion Act, and the Regulation of Standardized
                      Contracts Act.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Korean Content */}
              <TabsContent value="korean" className="mt-6">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                  이용권 환불 및 해지 정책
                </h1>

                {/* 환불 가능 기간 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    환불 가능 기간
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        구독 결제일로부터 3일 이내이고, 콘텐츠를 전혀 이용하지
                        않은 경우 전액 환불이 가능합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        콘텐츠를 1회라도 이용(퀴즈를 진행한 기록이 있는 경우)한
                        경우, 환불이 제한됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        콘텐츠 &apos;사용&apos; 여부는 로그인을 통한 퀴즈를
                        진행한 기록이 있는 경우로 간주됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 연간 구독권 환불 정산 방식 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    연간 구독권 환불 정산 방식
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        월간/연간 구독권 모두, 결제 후 콘텐츠를 사용한 경우 전액
                        환불은 불가합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        단, 3/6/12개월 구독권의 경우 중도 해지를 요청할 수
                        있으며, 다음 기준에 따라 환불금액을 정산합니다
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <div>
                        <span className="mb-2 block">
                          연간 구독권 환불 정산 방식 :
                        </span>
                        <div className="rounded-md bg-amber-50 p-3 font-mono text-sm">
                          환불금액 = [결제금액] – (1개월 이용권 정상가 ×
                          이용개월수) – 수수료 (10%)
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        연간구독권은 장기 할인 혜택이 적용된 상품으로, 환불
                        시에는 1개월 정상가 기준으로 이용 기간을 계산합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        이용 개월 수는 결제일부터 환불 요청일까지의 기간을
                        기준으로 산정됩니다.
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500 italic">
                        EX) 3개월 이용권 구독기간중 45일차에 환불요청시 2개월
                        이용으로 간주하여 남은 1개월에 해당하는 금액만 환불
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        환불 수수료는 결제일로부터 3일을 초과한 환불 요청 시에만
                        일부 차감될 수 있으며, 3일 이내 환불 요청 시에는
                        부과되지 않습니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 결제 및 해지 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    결제 및 해지
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>모든 이용권은 자동 갱신 방식입니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        구독 해지는 언제든 가능하며, 해지 시 다음 결제 주기부터
                        자동 갱신이 중단됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        해지 후에도 이미 결제된 이용권의 남은 기간 동안은 계속
                        이용하실 수 있습니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 환불 요청 및 처리 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    환불 요청 및 처리
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        환불은 사이트 내 결제 페이지에서 직접 해지 신청이
                        가능합니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>요청 접수 후 최대 7영업일 이내에 처리됩니다.</span>
                    </li>
                  </ul>
                </section>

                {/* 법적 고지 */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <div className="space-y-2 text-sm text-gray-500">
                    <p className="flex items-start">
                      <span className="mr-2">∴</span>본 환불 정책은
                      「전자상거래법」 및 「콘텐츠산업 진흥법」, 「약관의 규제에
                      관한 법률」을 준수합니다.
                    </p>
                    <p className="flex items-start">
                      <span className="mr-2">∴</span>
                      이용자 보호와 서비스의 지속적 운영을 위한 최소한의 수수료
                      기준을 적용하고 있습니다.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
