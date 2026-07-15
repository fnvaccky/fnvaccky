import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at")
        .eq("recipient_user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_user_id", userId)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="border-b border-border/50 px-2 py-2 last:border-0"
              >
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
