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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leave")({
  component: LeavePage,
});

function LeavePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    leave_type: "vacation" as any,
    start_date: "",
    end_date: "",
    reason: "",
  });

  const { data: requests } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () =>
      (
        await supabase
          .from("leave_requests")
          .select("*, employees(first_name,last_name,leave_balance)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const { data: employees } = useQuery({
    queryKey: ["employees-lite"],
    queryFn: async () =>
      (await supabase.from("employees").select("id,first_name,last_name"))
        .data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(form.end_date).getTime() -
            new Date(form.start_date).getTime()) /
            86400000,
        ) + 1,
      );
      const { error } = await supabase
        .from("leave_requests")
        .insert({ ...form, days });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Leave requested");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      setOpen(false);
      setForm({
        employee_id: "",
        leave_type: "vacation",
        start_date: "",
        end_date: "",
        reason: "",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({
      id,
      status,
      employeeId,
      days,
      leaveType,
    }: {
      id: string;
      status: "approved" | "rejected";
      employeeId: string;
      days: number;
      leaveType: string;
    }) => {
      if (status === "approved" && leaveType !== "unpaid") {
        const { data: emp } = await supabase
          .from("employees")
          .select("leave_balance")
          .eq("id", employeeId)
          .single();
        if ((emp?.leave_balance ?? 0) < days) {
          throw new Error(
            `Cannot approve — employee only has ${emp?.leave_balance ?? 0} day(s) of leave balance remaining.`,
          );
        }
      }
      const { error } = await supabase
        .from("leave_requests")
        .update({ status, approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (status === "approved" && leaveType !== "unpaid") {
        const { data: emp } = await supabase
          .from("employees")
          .select("leave_balance")
          .eq("id", employeeId)
          .single();
        const newBal = Math.max(0, (emp?.leave_balance ?? 0) - days);
        await supabase
          .from("employees")
          .update({ leave_balance: newBal })
          .eq("id", employeeId);
      }
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Requests, approvals, and balances"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New leave request</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={form.employee_id}
                    onValueChange={(v) => setForm({ ...form, employee_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.first_name} {e.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.leave_type}
                    onValueChange={(v: any) =>
                      setForm({ ...form, leave_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "vacation",
                        "sick",
                        "emergency",
                        "maternity",
                        "paternity",
                        "unpaid",
                      ].map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({ ...form, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) =>
                        setForm({ ...form, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.employee_id || !form.start_date || !form.end_date
                  }
                >
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.employees?.first_name} {r.employees?.last_name}
                  </TableCell>
                  <TableCell className="capitalize">{r.leave_type}</TableCell>
                  <TableCell className="text-xs">
                    {r.start_date} → {r.end_date}
                  </TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell>{r.employees?.leave_balance ?? 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "approved"
                          ? "default"
                          : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            decide.mutate({
                              id: r.id,
                              status: "approved",
                              employeeId: r.employee_id,
                              days: r.days,
                              leaveType: r.leave_type,
                            })
                          }
                        >
                          <Check className="h-4 w-4 text-teal" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            decide.mutate({
                              id: r.id,
                              status: "rejected",
                              employeeId: r.employee_id,
                              days: r.days,
                              leaveType: r.leave_type,
                            })
                          }
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!requests?.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No leave requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
