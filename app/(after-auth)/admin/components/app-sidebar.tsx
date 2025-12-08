import {
  RiCoupon2Line,
  RiMoneyDollarCircleLine,
  RiNotificationLine,
} from "@remixicon/react";
import {
  Book,
  Brain,
  Building2,
  Crown,
  Home,
  MapPin,
  Medal,
  Settings,
  Users,
} from "lucide-react";
import { RiContractLine } from "react-icons/ri";

import { auth } from "@/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  canAccessUserManagement,
  canAccessPaymentManagement,
  canAccessSystemSettings,
  canAccessChallenges,
  canAccessNotifications,
  canAccessCampusManagement,
} from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import SidebarLogout from "./sidebar-logout";

const allItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
    permission: () => true, // All admin users can access
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    permission: canAccessUserManagement,
  },
  {
    title: "Countries",
    url: "/admin/countries",
    icon: MapPin,
    permission: canAccessUserManagement,
  },
  {
    title: "Campuses",
    url: "/admin/campuses",
    icon: Building2,
    permission: canAccessCampusManagement,
  },
  {
    title: "Reading Comprehension",
    url: "/admin/reading",
    icon: Brain,
    permission: () => true, // All admin users can access
  },
  {
    title: "Novels",
    url: "/admin/novels",
    icon: Book,
    permission: () => true, // All admin users can access
  },
  {
    title: "VIP",
    url: "/admin/bpa",
    icon: Crown,
    permission: () => true, // All admin users can access
  },
  {
    title: "Challenges",
    url: "/admin/challenges",
    icon: Medal,
    permission: canAccessChallenges,
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: RiCoupon2Line,
    permission: canAccessPaymentManagement,
  },
  {
    title: "Plans",
    url: "/admin/plans",
    icon: RiContractLine,
    permission: canAccessPaymentManagement,
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: RiMoneyDollarCircleLine,
    permission: canAccessPaymentManagement,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: RiNotificationLine,
    permission: canAccessNotifications,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    permission: canAccessSystemSettings,
  },
];

export async function AppSidebar() {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;
  
  // Filter items based on user permissions
  const items = allItems.filter(item => item.permission(userRole));
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold tracking-tighter text-primary">
            READING CHAMP
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild>
          <SidebarLogout />
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
