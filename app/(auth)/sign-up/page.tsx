import SignUpForm from "@/app/(auth)/sign-up/components/sign-up-form";
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
        <div className="pt-8 sm:pt-16 text-center">
          <h1 className="page-title">Create Account</h1>
          <p className="page-subtitle">
            Start your English learning journey today
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
