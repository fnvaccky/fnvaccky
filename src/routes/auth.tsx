import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

// SECURITY: Harmony Suite is a closed, internal HRMS. There is intentionally no
// self-registration path. Only an Administrator can create an HR staff account,
// from Admin -> HR Staff Accounts (see admin.tsx). Do not add a sign-up form here.
function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 hs-gradient-brand p-12 text-primary-foreground flex-col justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold"
          style={{ fontFamily: "Space Grotesk" }}
        >
          <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur" />
          Harmony Suite
        </Link>
        <div className="hs-fade-in">
          <h2
            className="text-4xl font-bold"
            style={{ fontFamily: "Space Grotesk" }}
          >
            HR, harmonized.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Recruit, onboard, and manage your workforce from a single
            beautifully organized workspace.
          </p>
        </div>
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} Harmony Suite HRMS
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-md hs-card-shadow hs-slide-up">
          <CardHeader>
            <CardTitle
              className="text-2xl"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Sign in to Harmony
            </CardTitle>
            <CardDescription>
              Access your HR workspace. Accounts are created by an
              Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Sign in
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Don't have an account? Ask your HR Administrator to create one for
              you.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
