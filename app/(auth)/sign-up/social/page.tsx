import SocialSignUpForm from "@/app/(auth)/sign-up/components/social-sign-up-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="page-container">
      <header className="page-header">
        <Image 
          src="/logo/logo-small.png" 
          alt="Logo" 
          width={60} 
          height={80}
          className="page-header-logo"
          priority
        />
      </header>

      <div className="page-content">
        <SocialSignUpForm />
      </div>
    </div>
  );
} 