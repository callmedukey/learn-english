import { auth } from "@/auth";
import LoginForm from "@/components/auth/login-form";

export default async function Home() {
  const session = await auth();
  console.log("from home", session);
  return (
    <main className="flex items-center justify-center min-h-screen">
      <LoginForm />
    </main>
  );
}
