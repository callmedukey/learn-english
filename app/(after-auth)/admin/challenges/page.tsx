import { Trophy, Image, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminAccess } from "@/lib/utils/admin-route-protection";

const adminSections = [
  {
    title: "Monthly Challenges",
    description: "Create and manage monthly medal challenges",
    href: "/admin/challenges/challenges",
    icon: Trophy,
    color: "text-blue-600",
  },
  {
    title: "Medal Images",
    description: "Upload and manage medal images for each level",
    href: "/admin/challenges/images",
    icon: Image,
    color: "text-green-600",
  },
  {
    title: "Level Changes",
    description: "Review and manage user level change requests",
    href: "/admin/challenges/level-changes",
    icon: RefreshCw,
    color: "text-orange-600",
  },
];

export default async function ChallengesAdminPage() {
  await requireAdminAccess();
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Challenge Management</h1>
        <p className="text-muted-foreground">
          Manage monthly challenges and medal images
        </p>
      </div>

      {/* Admin Sections */}
      <div className="grid gap-6 md:grid-cols-3">
        {adminSections.map((section) => (
          <Card key={section.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className={`h-5 w-5 ${section.color}`} />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={section.href}>
                <Button className="w-full">
                  Manage {section.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}