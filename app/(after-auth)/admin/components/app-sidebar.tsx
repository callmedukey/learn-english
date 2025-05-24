import { RiCoupon2Line, RiMoneyDollarCircleLine } from "@remixicon/react";
import { Book, Brain, Home, MapPin, Users } from "lucide-react";

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

import SidebarLogout from "./sidebar-logout";

const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Countries",
    url: "/admin/countries",
    icon: MapPin,
  },
  {
    title: "Reading Comprehension",
    url: "/admin/reading",
    icon: Brain,
  },
  {
    title: "Novels",
    url: "/admin/novels",
    icon: Book,
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: RiCoupon2Line,
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: RiMoneyDollarCircleLine,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold tracking-tighter text-primary">
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
