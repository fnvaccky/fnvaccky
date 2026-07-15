import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { role, fullName } = Route.useRouteContext();
  const qc = useQueryClient();
  const [name, setName] = useState(fullName ?? "");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const saveName = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", data.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated");
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const initials = (name || email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Your account details" />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-accent text-accent-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{name || "—"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            <Badge
              variant={role === "admin" ? "default" : "secondary"}
              className="mt-1 capitalize"
            >
              {role === "admin" ? "Administrator" : "HR Staff"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display name</CardTitle>
          <CardDescription>
            Shown in the sidebar, notifications, and audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button
            onClick={() => saveName.mutate()}
            disabled={!name || saveName.isPending}
          >
            Save name
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>
          <Button
            onClick={() => changePassword.mutate()}
            disabled={newPassword.length < 8 || changePassword.isPending}
          >
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
