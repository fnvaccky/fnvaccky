import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, ClipboardCheck, PencilLine, Send, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const qc = useQueryClient();
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  const [period, setPeriod] = useState({ start: first, end: last });
  const [adjusting, setAdjusting] = useState<any | null>(null);
  const [payslip, setPayslip] = useState<any | null>(null);

  const { data: runs } = useQuery({
    queryKey: ["payroll"],
    queryFn: async () =>
      (
        await supabase
          .from("payroll")
          .select("*, employees(first_name,last_name,employee_code)")
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? [],
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data: employees } = await supabase
        .from("employees")
        .select("id,basic_salary")
        .eq("status", "active");
      if (!employees?.length) throw new Error("No active employees");

      // Data integrity: never overwrite an existing payroll run for the same
      // employee + period (DB also enforces this via a unique constraint).
      const { data: existing } = await supabase
        .from("payroll")
        .select("employee_id")
        .eq("period_start", period.start)
        .eq("period_end", period.end);
      const alreadyRun = new Set(
        (existing ?? []).map((r: any) => r.employee_id),
      );
      const toRun = employees.filter((e: any) => !alreadyRun.has(e.id));
      if (!toRun.length)
        throw new Error(
          "Payroll for this period has already been generated for every active employee.",
        );

      const { data: att } = await supabase
        .from("attendance")
        .select("employee_id,late_minutes,undertime_minutes,overtime_hours")
        .gte("date", period.start)
        .lte("date", period.end);
      const attBucket: Record<string, { late: number; ot: number }> = {};
      (att ?? []).forEach((a: any) => {
        const b = (attBucket[a.employee_id] ??= { late: 0, ot: 0 });
        b.late += (a.late_minutes ?? 0) + (a.undertime_minutes ?? 0);
        b.ot += Number(a.overtime_hours ?? 0);
      });

      // Unpaid leave taken during the period reduces salary.
      const { data: leave } = await supabase
        .from("leave_requests")
        .select("employee_id,days,leave_type,status,start_date")
        .eq("status", "approved")
        .eq("leave_type", "unpaid")
        .gte("start_date", period.start)
        .lte("start_date", period.end);
      const leaveBucket: Record<string, number> = {};
      (leave ?? []).forEach((l: any) => {
        leaveBucket[l.employee_id] =
          (leaveBucket[l.employee_id] ?? 0) + (l.days ?? 0);
      });

      const rows = toRun.map((e: any) => {
        const basic = Number(e.basic_salary ?? 0);
        const daily = basic / 22;
        const hourly = daily / 8;
        const a = attBucket[e.id] ?? { late: 0, ot: 0 };
        const lateDeduction = (a.late / 60) * hourly;
        const overtime_pay = a.ot * hourly * 1.25;
        const allowances = basic * 0.05;
        const leaveDays = leaveBucket[e.id] ?? 0;
        const leave_deduction = leaveDays * daily;
        const gross = basic + allowances + overtime_pay;
        const tax = gross * 0.1;
        const deductions = lateDeduction + tax;
        const net = gross - deductions - leave_deduction;
        return {
          employee_id: e.id,
          period_start: period.start,
          period_end: period.end,
          basic_salary: basic,
          allowances: Number(allowances.toFixed(2)),
          overtime_pay: Number(overtime_pay.toFixed(2)),
          deductions: Number(deductions.toFixed(2)),
          leave_deduction: Number(leave_deduction.toFixed(2)),
          gross_salary: Number(gross.toFixed(2)),
          net_salary: Number(net.toFixed(2)),
          status: "draft" as const,
        };
      });
      const { error } = await supabase.from("payroll").insert(rows);
      if (error) throw error;
      return {
        generated: rows.length,
        skipped: employees.length - toRun.length,
      };
    },
    onSuccess: (result) => {
      toast.success(
        `Generated payroll for ${result.generated} employee(s)` +
          (result.skipped
            ? ` — ${result.skipped} already had a run for this period`
            : ""),
      );
      qc.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("payroll")
        .update({
          status: "reviewed",
          reviewed_by: userData.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as reviewed");
      qc.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveAdjustment = useMutation({
    mutationFn: async () => {
      const gross =
        Number(adjusting.basic_salary) +
        Number(adjusting.allowances) +
        Number(adjusting.overtime_pay);
      const net =
        gross -
        Number(adjusting.deductions) -
        Number(adjusting.leave_deduction);
      const { error } = await supabase
        .from("payroll")
        .update({
          allowances: Number(adjusting.allowances),
          overtime_pay: Number(adjusting.overtime_pay),
          deductions: Number(adjusting.deductions),
          leave_deduction: Number(adjusting.leave_deduction),
          review_notes: adjusting.review_notes,
          gross_salary: Number(gross.toFixed(2)),
          net_salary: Number(net.toFixed(2)),
        })
        .eq("id", adjusting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payroll adjusted");
      qc.invalidateQueries({ queryKey: ["payroll"] });
      setAdjusting(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const release = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payroll")
        .update({ status: "released" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payslip released");
      qc.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Generate, review, adjust, and release payroll for the selected period"
      />
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Period start</Label>
              <Input
                type="date"
                value={period.start}
                onChange={(e) =>
                  setPeriod({ ...period, start: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Period end</Label>
              <Input
                type="date"
                value={period.end}
                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              />
            </div>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              <Play className="mr-2 h-4 w-4" /> Run payroll
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Leave ded.</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.employees?.first_name} {r.employees?.last_name}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.period_start} → {r.period_end}
                  </TableCell>
                  <TableCell>
                    {Number(r.basic_salary).toLocaleString()}
                  </TableCell>
                  <TableCell>{Number(r.allowances).toLocaleString()}</TableCell>
                  <TableCell>
                    {Number(r.overtime_pay).toLocaleString()}
                  </TableCell>
                  <TableCell>{Number(r.deductions).toLocaleString()}</TableCell>
                  <TableCell>
                    {Number(r.leave_deduction ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Number(r.net_salary).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "released"
                          ? "default"
                          : r.status === "reviewed"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.status === "draft" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => review.mutate(r.id)}
                        >
                          <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                          Review
                        </Button>
                      </>
                    )}
                    {r.status === "reviewed" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAdjusting({ ...r })}
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => release.mutate(r.id)}>
                          <Send className="mr-1 h-3.5 w-3.5" />
                          Release
                        </Button>
                      </>
                    )}
                    {r.status === "released" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPayslip(r)}
                      >
                        <Printer className="mr-1 h-3.5 w-3.5" />
                        Payslip
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!runs?.length && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No payroll runs yet. Click "Run payroll" to generate.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {adjusting && (
        <Dialog open onOpenChange={() => setAdjusting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Adjust payroll — {adjusting.employees?.first_name}{" "}
                {adjusting.employees?.last_name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Allowances</Label>
                <Input
                  type="number"
                  value={adjusting.allowances}
                  onChange={(e) =>
                    setAdjusting({ ...adjusting, allowances: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Overtime pay</Label>
                <Input
                  type="number"
                  value={adjusting.overtime_pay}
                  onChange={(e) =>
                    setAdjusting({ ...adjusting, overtime_pay: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Deductions</Label>
                <Input
                  type="number"
                  value={adjusting.deductions}
                  onChange={(e) =>
                    setAdjusting({ ...adjusting, deductions: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Leave deduction</Label>
                <Input
                  type="number"
                  value={adjusting.leave_deduction}
                  onChange={(e) =>
                    setAdjusting({
                      ...adjusting,
                      leave_deduction: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Review notes</Label>
                <Textarea
                  value={adjusting.review_notes ?? ""}
                  onChange={(e) =>
                    setAdjusting({ ...adjusting, review_notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => saveAdjustment.mutate()}
                disabled={saveAdjustment.isPending}
              >
                Save adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {payslip && (
        <PayslipDialog run={payslip} onClose={() => setPayslip(null)} />
      )}
    </div>
  );
}

function PayslipDialog({ run, onClose }: { run: any; onClose: () => void }) {
  const line = (label: string, value: number, negative = false) => (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={negative ? "text-destructive" : ""}>
        {negative ? "-" : ""}
        {Number(value).toLocaleString()}
      </span>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="print:shadow-none">
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
        </DialogHeader>
        <div id="payslip-print" className="space-y-1">
          <p
            className="text-lg font-semibold"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Harmony Suite HRMS
          </p>
          <p className="text-sm text-muted-foreground">
            {run.employees?.first_name} {run.employees?.last_name} ·{" "}
            {run.employees?.employee_code}
          </p>
          <p className="text-sm text-muted-foreground">
            Pay period: {run.period_start} → {run.period_end}
          </p>
          <div className="my-3 border-t border-border" />
          {line("Basic salary", run.basic_salary)}
          {line("Allowances", run.allowances)}
          {line("Overtime pay", run.overtime_pay)}
          <div className="my-2 border-t border-dashed border-border" />
          {line("Deductions", run.deductions, true)}
          {line("Leave deduction", run.leave_deduction ?? 0, true)}
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between py-1 font-semibold">
            <span>Net pay</span>
            <span>{Number(run.net_salary).toLocaleString()}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
