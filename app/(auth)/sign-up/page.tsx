import { auth } from "@/auth";
import SignUpForm from "@/app/(auth)/sign-up/components/sign-up-form";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  // If already authenticated
  if (session?.user) {
    // If profile needs completion, redirect to social signup
    if (session.user.isProfileIncomplete) {
      redirect("/sign-up/social");
    }
    // Otherwise redirect to dashboard
    redirect("/dashboard");
  }

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
