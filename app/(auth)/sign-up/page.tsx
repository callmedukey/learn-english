import SignUpForm from "@/app/(auth)/sign-up/components/sign-up-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FEF5EA]">
      <header className="w-full max-w-[1440px] h-20 sm:h-28 mx-auto px-4 py-4 border-b flex items-center">
        <Image 
          src="/logo/logo-small.png" 
          alt="Logo" 
          width={60} 
          height={80}
          className="h-12 sm:h-[80px] w-auto"
          priority
        />
      </header>

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-8 sm:pt-16 text-center">
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start your English learning journey today
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
