import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { FileSpreadsheet, Printer, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = [
  "hsl(220 60% 25%)",
  "hsl(212 74% 30%)",
  "hsl(174 62% 40%)",
  "hsl(40 74% 55%)",
  "hsl(290 55% 55%)",
];

const REPORT_TYPES = [
  { value: "recruitment", label: "Recruitment" },
  { value: "employee", label: "Employee" },
  { value: "attendance", label: "Attendance" },
  { value: "leave", label: "Leave" },
  { value: "payroll", label: "Payroll" },
  { value: "overall", label: "Overall HR" },
] as const;

function toCsv(columns: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [
    columns.map(esc).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ].join("\n");
}

function downloadCsv(
  filename: string,
  columns: string[],
  rows: (string | number)[][],
) {
  const blob = new Blob([toCsv(columns, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Report Builder — Select Report Type -> Select Filters -> Retrieve Data ->
// Generate -> Preview -> Export (flowchart's Reports branch).
// ============================================================================
function ReportBuilder() {
  const now = new Date();
  const [type, setType] =
    useState<(typeof REPORT_TYPES)[number]["value"]>("employee");
  const [start, setStart] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
  );
  const [end, setEnd] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10),
  );
  const [report, setReport] = useState<{
    columns: string[];
    rows: (string | number)[][];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setReport(null);
    try {
      if (type === "recruitment") {
        const { data } = await supabase
          .from("applicants")
          .select(
            "first_name,last_name,email,status,applied_at,job_postings(title)",
          )
          .gte("applied_at", start)
          .lte("applied_at", end + "T23:59:59");
        setReport({
          columns: ["Name", "Email", "Job Posting", "Status", "Applied"],
          rows: (data ?? []).map((a: any) => [
            `${a.first_name} ${a.last_name}`,
            a.email,
            a.job_postings?.title ?? "—",
            a.status,
            new Date(a.applied_at).toLocaleDateString(),
          ]),
        });
      } else if (type === "employee") {
        const { data } = await supabase
          .from("employees")
          .select(
            "employee_code,first_name,last_name,status,hire_date,departments(name),positions(title)",
          );
        setReport({
          columns: [
            "Code",
            "Name",
            "Department",
            "Position",
            "Status",
            "Hire date",
          ],
          rows: (data ?? []).map((e: any) => [
            e.employee_code,
            `${e.first_name} ${e.last_name}`,
            e.departments?.name ?? "—",
            e.positions?.title ?? "—",
            e.status,
            e.hire_date,
          ]),
        });
      } else if (type === "attendance") {
        const { data } = await supabase
          .from("attendance")
          .select(
            "date,working_hours,late_minutes,undertime_minutes,overtime_hours,employees(first_name,last_name)",
          )
          .gte("date", start)
          .lte("date", end);
        setReport({
          columns: [
            "Date",
            "Employee",
            "Hours worked",
            "Late (min)",
            "Undertime (min)",
            "Overtime (hrs)",
          ],
          rows: (data ?? []).map((a: any) => [
            a.date,
            `${a.employees?.first_name} ${a.employees?.last_name}`,
            a.working_hours ?? 0,
            a.late_minutes ?? 0,
            a.undertime_minutes ?? 0,
            a.overtime_hours ?? 0,
          ]),
        });
      } else if (type === "leave") {
        const { data } = await supabase
          .from("leave_requests")
          .select(
            "start_date,end_date,days,leave_type,status,employees(first_name,last_name)",
          )
          .gte("start_date", start)
          .lte("start_date", end);
        setReport({
          columns: ["Employee", "Type", "Start", "End", "Days", "Status"],
          rows: (data ?? []).map((l: any) => [
            `${l.employees?.first_name} ${l.employees?.last_name}`,
            l.leave_type,
            l.start_date,
            l.end_date,
            l.days,
            l.status,
          ]),
        });
      } else if (type === "payroll") {
        const { data } = await supabase
          .from("payroll")
          .select(
            "period_start,period_end,gross_salary,net_salary,status,employees(first_name,last_name)",
          )
          .gte("period_start", start)
          .lte("period_end", end);
        setReport({
          columns: [
            "Employee",
            "Period start",
            "Period end",
            "Gross",
            "Net",
            "Status",
          ],
          rows: (data ?? []).map((p: any) => [
            `${p.employees?.first_name} ${p.employees?.last_name}`,
            p.period_start,
            p.period_end,
            Number(p.gross_salary).toLocaleString(),
            Number(p.net_salary).toLocaleString(),
            p.status,
          ]),
        });
      } else {
        const [
          { count: totalEmployees },
          { count: activeEmployees },
          { count: onLeave },
          { count: openPostings },
          { data: payrollRows },
        ] = await Promise.all([
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("status", "on_leave"),
          supabase
            .from("job_postings")
            .select("*", { count: "exact", head: true })
            .eq("status", "published"),
          supabase
            .from("payroll")
            .select("net_salary")
            .gte("period_start", start)
            .lte("period_end", end),
        ]);
        const totalPayroll = (payrollRows ?? []).reduce(
          (s: number, r: any) => s + Number(r.net_salary ?? 0),
          0,
        );
        setReport({
          columns: ["Metric", "Value"],
          rows: [
            ["Total employees", totalEmployees ?? 0],
            ["Active employees", activeEmployees ?? 0],
            ["On leave", onLeave ?? 0],
            ["Open job postings", openPostings ?? 0],
            [`Payroll cost (${start} → ${end})`, totalPayroll.toLocaleString()],
          ],
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6 print:shadow-none">
      <CardHeader>
        <CardTitle>Report builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <div>
            <Label>Report type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type !== "employee" && (
            <>
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </>
          )}
          <Button onClick={generate} disabled={loading}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {loading ? "Generating…" : "Generate report"}
          </Button>
          {report && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(`${type}-report.csv`, report.columns, report.rows)
                }
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print / Save PDF
              </Button>
            </>
          )}
        </div>

        {report && (
          <div className="mt-4 max-h-[420px] overflow-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  {report.columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
                {!report.rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={report.columns.length}
                      className="text-center text-muted-foreground py-8"
                    >
                      No data for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsPage() {
  const { data: employees } = useQuery({
    queryKey: ["report-employees"],
    queryFn: async () =>
      (await supabase.from("employees").select("status,departments(name)"))
        .data ?? [],
  });
  const { data: leaves } = useQuery({
    queryKey: ["report-leaves"],
    queryFn: async () =>
      (await supabase.from("leave_requests").select("leave_type,status"))
        .data ?? [],
  });
  const { data: payroll } = useQuery({
    queryKey: ["report-payroll"],
    queryFn: async () =>
      (await supabase.from("payroll").select("period_start,net_salary")).data ??
      [],
  });

  const byDept: Record<string, number> = {};
  (employees ?? []).forEach((e: any) => {
    const n = e.departments?.name ?? "Unassigned";
    byDept[n] = (byDept[n] ?? 0) + 1;
  });
  const deptData = Object.entries(byDept).map(([name, value]) => ({
    name,
    value,
  }));

  const leaveByType: Record<string, number> = {};
  (leaves ?? []).forEach((l: any) => {
    leaveByType[l.leave_type] = (leaveByType[l.leave_type] ?? 0) + 1;
  });
  const leaveData = Object.entries(leaveByType).map(([name, count]) => ({
    name,
    count,
  }));

  const payrollByMonth: Record<string, number> = {};
  (payroll ?? []).forEach((p: any) => {
    const m = (p.period_start ?? "").slice(0, 7);
    payrollByMonth[m] = (payrollByMonth[m] ?? 0) + Number(p.net_salary ?? 0);
  });
  const payrollData = Object.entries(payrollByMonth)
    .sort()
    .map(([month, total]) => ({ month, total }));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Build and export reports, or browse analytics"
      />
      <ReportBuilder />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={leaveData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220 20% 92%)"
                />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="hsl(174 62% 40%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payroll trend (net)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <LineChart data={payrollData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220 20% 92%)"
                />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(212 74% 30%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
