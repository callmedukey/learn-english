import { Metadata } from "next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Privacy Policy | 개인정보처리방침",
  description:
    "Privacy Policy and Account Deletion Information | 개인정보처리방침 및 계정 삭제 안내",
};

export default function PrivacyPolicyPage() {
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
                  개인정보처리방침
                </h1>

                <p className="mb-8 text-gray-600">
                  리딩챔프(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히
                  여기며, 관련 법률을 준수합니다. 본 개인정보처리방침은 회사가
                  제공하는 서비스 이용과 관련하여 수집·이용·보관하는 개인정보에
                  대해 안내합니다.
                </p>

                {/* 수집하는 개인정보 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    수집하는 개인정보
                  </h2>
                  <p className="mb-3 text-gray-600">
                    회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다:
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>필수 정보:</strong> 이름, 이메일 주소, 비밀번호
                        (암호화 저장)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>결제 정보:</strong> 결제 수단 정보, 결제 내역
                        (결제 서비스 제공업체를 통해 처리)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>서비스 이용 정보:</strong> 학습 기록, 퀴즈 결과,
                        진도 정보
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>기기 정보:</strong> 푸시 알림을 위한 기기 토큰
                        (선택)
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 개인정보 이용 목적 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    개인정보 이용 목적
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>회원 가입 및 서비스 이용 관리</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>맞춤형 학습 콘텐츠 제공</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>결제 처리 및 구독 관리</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>서비스 관련 공지 및 알림 전송</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>서비스 개선 및 통계 분석</span>
                    </li>
                  </ul>
                </section>

                {/* 개인정보 보호 조치 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    개인정보 보호 조치
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        모든 데이터 전송은 HTTPS를 통해 암호화됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>비밀번호는 안전한 암호화 방식으로 저장됩니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        결제 정보는 PCI-DSS 인증을 받은 결제 서비스
                        제공업체(토스페이먼츠)를 통해 처리됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        개인정보 접근은 업무상 필요한 최소 인원으로 제한됩니다.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 개인정보 보유 기간 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    개인정보 보유 기간
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        회원 탈퇴 시 개인정보는 지체 없이 파기됩니다.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안
                        보관됩니다:
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500">
                        - 전자상거래 등에서의 소비자보호에 관한 법률: 결제 기록 5년
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500">
                        - 통신비밀보호법: 접속 기록 3개월
                      </span>
                    </li>
                  </ul>
                </section>

                {/* 계정 및 데이터 삭제 요청 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    계정 및 데이터 삭제 요청
                  </h2>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                    <p className="mb-4 text-gray-700">
                      이용자는 언제든지 계정 및 개인정보 삭제를 요청할 수
                      있습니다. 삭제 요청 시 다음 정보가 영구적으로 삭제됩니다:
                    </p>
                    <ul className="mb-4 space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>계정 정보 (이름, 이메일)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>학습 기록 및 진도 정보</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>기기 토큰 및 알림 설정</span>
                      </li>
                    </ul>
                    <p className="mb-4 font-medium text-gray-700">
                      삭제 요청 방법:
                    </p>
                    <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-600">
                      <li>
                        아래 이메일 주소로 삭제 요청 이메일을 보내주세요.
                      </li>
                      <li>가입 시 사용한 이메일 주소를 함께 기재해 주세요.</li>
                      <li>
                        요청 접수 후 <strong>7일 이내</strong>에 삭제가
                        완료됩니다.
                      </li>
                    </ol>
                    <a
                      href="mailto:reading-champ@reading-champ.com?subject=[계정삭제요청]&body=가입 이메일 주소:%0A%0A삭제 사유 (선택):"
                      className="inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-600"
                    >
                      <svg
                        className="mr-2 h-5 w-5"
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
                      계정 삭제 요청하기
                    </a>
                  </div>
                </section>

                {/* 문의처 */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    문의처
                  </h2>
                  <div className="rounded-lg bg-gray-50 p-6">
                    <p className="mb-2 text-gray-600">
                      개인정보 관련 문의사항이 있으시면 아래로 연락해 주세요:
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
                    본 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.
                  </p>
                </div>
              </TabsContent>

              {/* English Content */}
              <TabsContent value="english" className="mt-6">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                  Privacy Policy
                </h1>

                <p className="mb-8 text-gray-600">
                  Reading Champ (&quot;Company&quot;) values your privacy and
                  complies with applicable laws. This Privacy Policy explains
                  how we collect, use, and protect your personal information
                  when you use our services.
                </p>

                {/* Information We Collect */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Information We Collect
                  </h2>
                  <p className="mb-3 text-gray-600">
                    We collect the following information to provide our
                    services:
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>Required Information:</strong> Name, email
                        address, password (encrypted)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>Payment Information:</strong> Payment method
                        details, transaction history (processed through payment
                        service provider)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>Service Usage Data:</strong> Learning records,
                        quiz results, progress information
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        <strong>Device Information:</strong> Device tokens for
                        push notifications (optional)
                      </span>
                    </li>
                  </ul>
                </section>

                {/* How We Use Your Information */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    How We Use Your Information
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>Account registration and service management</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>Personalized learning content delivery</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>Payment processing and subscription management</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>Service announcements and notifications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>Service improvement and analytics</span>
                    </li>
                  </ul>
                </section>

                {/* Data Security */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Data Security
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        All data transmission is encrypted via HTTPS.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Passwords are stored using secure encryption methods.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Payment information is processed through PCI-DSS
                        certified payment service provider (Toss Payments).
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Access to personal data is restricted to authorized
                        personnel only.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Data Retention */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Data Retention
                  </h2>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        Personal data is deleted promptly upon account deletion
                        request.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-amber-500">•</span>
                      <span>
                        However, certain data may be retained as required by
                        law:
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500">
                        - Payment records: 5 years (Electronic Commerce Act)
                      </span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="text-gray-500">
                        - Access logs: 3 months (Telecommunications Privacy Act)
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Account & Data Deletion */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Account & Data Deletion
                  </h2>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                    <p className="mb-4 text-gray-700">
                      You may request deletion of your account and personal data
                      at any time. Upon deletion, the following data will be
                      permanently removed:
                    </p>
                    <ul className="mb-4 space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>Account information (name, email)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>Learning records and progress data</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>Device tokens and notification settings</span>
                      </li>
                    </ul>
                    <p className="mb-4 font-medium text-gray-700">
                      How to Request Deletion:
                    </p>
                    <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-600">
                      <li>
                        Send a deletion request email to the address below.
                      </li>
                      <li>Include the email address used for registration.</li>
                      <li>
                        Your data will be deleted within{" "}
                        <strong>7 days</strong> of receiving the request.
                      </li>
                    </ol>
                    <a
                      href="mailto:reading-champ@reading-champ.com?subject=[Account Deletion Request]&body=Registered Email Address:%0A%0AReason for Deletion (optional):"
                      className="inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-600"
                    >
                      <svg
                        className="mr-2 h-5 w-5"
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
                      Request Account Deletion
                    </a>
                  </div>
                </section>

                {/* Contact */}
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <span className="mr-2 text-amber-600">▶</span>
                    Contact
                  </h2>
                  <div className="rounded-lg bg-gray-50 p-6">
                    <p className="mb-2 text-gray-600">
                      For any privacy-related inquiries, please contact us at:
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
                    This Privacy Policy is effective as of January 1, 2024.
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
