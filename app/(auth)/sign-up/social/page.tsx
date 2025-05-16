import SocialSignUpForm from "@/app/(auth)/sign-up/components/social-sign-up-form";
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

        <SocialSignUpForm />
      </div>
    </div>
  );
} 