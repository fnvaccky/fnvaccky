import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

export function UserMenu() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", u.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id),
      ]);
      setName(profile?.full_name ?? u.email ?? "");
      setRole(roles?.[0]?.role ?? "hr");
    })();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (name || email || "?").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-none">{name || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
