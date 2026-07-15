import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Clock,
  CalendarDays,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AppRole } from "@/routes/_authenticated/route";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Recruitment", url: "/recruitment", icon: Briefcase },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "Leave", url: "/leave", icon: CalendarDays },
  { title: "Payroll", url: "/payroll", icon: Wallet },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const adminItems = [{ title: "Admin", url: "/admin", icon: Settings }];

export function AppSidebar({ role }: { role: AppRole }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) =>
    pathname === u || pathname.startsWith(u + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 shrink-0 rounded-md hs-gradient-brand" />
          {!collapsed && (
            <span
              className="text-base font-semibold text-sidebar-foreground"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Harmony
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Only Administrators get the Admin section — HR staff never see it. */}
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
          {!collapsed && "v1.0 · Harmony Suite"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
