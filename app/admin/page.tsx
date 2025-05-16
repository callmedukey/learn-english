import { prisma } from "@/prisma/prisma-client";
import UserTable from "@/components/basic-table";
import Image from "next/image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard - Reading Champ",
  description: "User management dashboard for Reading Champ administrators",
};

export default function Page() {
  const getUsers = async () => {
    "use server";
    return await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  };

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
        <div className="pt-8 sm:pt-16">
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-8">
            User Management
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Suspense fallback={<div>Loading users...</div>}>
              {/* @ts-expect-error Async Server Component */}
              <UserList getUsers={getUsers} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

async function UserList({ getUsers }: { getUsers: () => Promise<any[]> }) {
  const users = await getUsers();
  return <UserTable users={users} />;
}
