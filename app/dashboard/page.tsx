import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // If profile is incomplete, redirect to social signup
  if (session.user.isProfileIncomplete) {
    redirect("/sign-up/social")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl mb-4">Welcome, {session.user.name}!</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Role:</strong> {session.user.role}</p>
        </div>
      </div>
    </div>
  )
} 