import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Wallet,
  BarChart3,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  {
    icon: Briefcase,
    title: "Recruitment",
    desc: "Post jobs, review applicants, schedule interviews.",
  },
  {
    icon: Users,
    title: "Employees",
    desc: "Centralized records for every team member.",
  },
  {
    icon: Calendar,
    title: "Attendance & Leave",
    desc: "Track time and approve requests.",
  },
  {
    icon: Wallet,
    title: "Payroll",
    desc: "Compute salaries, allowances, and deductions.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    desc: "Real-time analytics across the organization.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    desc: "Role-based access with full audit trails.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md hs-gradient-brand" />
            <span
              className="text-lg font-semibold"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Harmony Suite
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center hs-fade-in">
          <span className="inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Human Resource Management System
          </span>
          <h1
            className="mx-auto mt-6 max-w-3xl text-5xl font-bold tracking-tight md:text-6xl"
            style={{ fontFamily: "Space Grotesk" }}
          >
            One suite for every{" "}
            <span className="hs-text-gradient">HR workflow</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            From recruitment to payroll, Harmony Suite streamlines your HR
            operations with a modern, secure, and beautifully organized
            platform.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="hs-gradient-brand text-primary-foreground border-0"
            >
              <Link to="/auth">Open Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="hs-slide-up rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:hs-card-shadow"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg hs-gradient-brand text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Harmony Suite HRMS
      </footer>
    </div>
  );
}
