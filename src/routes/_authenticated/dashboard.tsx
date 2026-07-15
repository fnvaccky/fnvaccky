import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Briefcase,
  CalendarCheck,
  Wallet,
  Bell,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [emp, active, applicants, leaves, payroll, interviews, attendance] =
        await Promise.all([
          supabase
            .from("employees")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("employees")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("applicants")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("leave_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase.from("payroll").select("net_salary"),
          supabase
            .from("interviews")
            .select(
              "id,scheduled_at,applicant_id,type,status,applicants(first_name,last_name)",
            )
            .gte("scheduled_at", new Date().toISOString())
            .order("scheduled_at")
            .limit(5),
          supabase
            .from("attendance")
            .select("date,hours_worked")
            .gte(
              "date",
              new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
            ),
        ]);

      const totalPayroll = (payroll.data ?? []).reduce(
        (s, r) => s + Number(r.net_salary || 0),
        0,
      );

      // Attendance last 7 days
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
          .toISOString()
          .slice(0, 10);
        days[d] = 0;
      }
      (attendance.data ?? []).forEach((r) => {
        if (r.date in days) days[r.date] += 1;
      });
      const attendanceSeries = Object.entries(days).map(([date, count]) => ({
        day: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
        count,
      }));

      return {
        totalEmployees: emp.count ?? 0,
        activeEmployees: active.count ?? 0,
        applicants: applicants.count ?? 0,
        pendingLeaves: leaves.count ?? 0,
        totalPayroll,
        upcomingInterviews: interviews.data ?? [],
        attendanceSeries,
      };
    },
  });
}

function useDeptDistribution() {
  return useQuery({
    queryKey: ["dept-distribution"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("department_id,departments(name)");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((e: any) => {
        const name = e.departments?.name ?? "Unassigned";
        counts[name] = (counts[name] ?? 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });
}

const COLORS = [
  "hsl(220 60% 25%)",
  "hsl(212 74% 30%)",
  "hsl(174 62% 40%)",
  "hsl(40 74% 55%)",
  "hsl(290 55% 55%)",
];

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="hs-slide-up transition hover:hs-card-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
              className="mt-1 text-3xl font-bold"
              style={{ fontFamily: "Space Grotesk" }}
            >
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg hs-gradient-brand text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useStats();
  const { data: dist } = useDeptDistribution();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your organization"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Employees"
              value={data?.totalEmployees}
            />
            <StatCard
              icon={UserCheck}
              label="Active Employees"
              value={data?.activeEmployees}
            />
            <StatCard
              icon={Briefcase}
              label="Applicants"
              value={data?.applicants}
            />
            <StatCard
              icon={CalendarCheck}
              label="Pending Leaves"
              value={data?.pendingLeaves}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance (last 7 days)</CardTitle>
            <CardDescription>
              Daily check-ins across the organization
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.attendanceSeries ?? []}>
                <XAxis dataKey="day" stroke="hsl(215 25% 47%)" fontSize={12} />
                <YAxis
                  stroke="hsl(215 25% 47%)"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip cursor={{ fill: "hsl(220 20% 96%)" }} />
                <Bar
                  dataKey="count"
                  fill="hsl(174 62% 40%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Department</CardTitle>
            <CardDescription>Employee distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dist ?? []}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  {(dist ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" /> Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingInterviews?.length ? (
              <ul className="space-y-3">
                {data.upcomingInterviews.map((i: any) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {i.applicants?.first_name} {i.applicants?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(i.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {i.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No interviews scheduled.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Welcome to Harmony Suite</p>
              <p className="text-xs text-muted-foreground">
                Your HR workspace is ready. Explore the modules from the
                sidebar.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Payroll ledger</p>
              <p className="text-xs text-muted-foreground">
                Total processed: ₱{(data?.totalPayroll ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
