import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { NotificationsBell } from "@/components/notifications-bell";

export type AppRole = "admin" | "hr";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const [{ data: roleRow }, { data: profile }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_active, full_name")
        .eq("id", data.user.id)
        .maybeSingle(),
    ]);

    // A deactivated account should be kicked out immediately, not just on next
    // Supabase Auth token refresh.
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    if (!roleRow) {
      // Authenticated in Supabase Auth but never assigned an HR/Admin role —
      // this account isn't provisioned for Harmony Suite.
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    return {
      user: data.user,
      role: roleRow.role as AppRole,
      fullName: profile?.full_name ?? null,
    };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { role } = Route.useRouteContext();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar role={role} />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">
                Harmony Suite HRMS
              </span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationsBell />
              <UserMenu />
            </div>
          </header>
          <main className="hs-fade-in p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
