import { auth } from "@/auth";
import SocialSignUpForm from "@/app/(auth)/sign-up/components/social-sign-up-form";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  // If not authenticated or no user data, redirect to login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // If profile is already complete, redirect to dashboard
  if (session.user.id && !session.user.isProfileIncomplete) {
    redirect("/dashboard");
  }

  // If no email, redirect to login (shouldn't happen, but just in case)
  if (!session.user.email) {
    redirect("/login");
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
        <SocialSignUpForm />
      </div>
    </div>
  );
} 