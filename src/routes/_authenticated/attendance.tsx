import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Plus, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    employee_id: "",
    date: today,
    time_in: "09:00",
    time_out: "18:00",
  });

  const { data: records } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () =>
      (
        await supabase
          .from("attendance")
          .select("*, employees(first_name,last_name,employee_code)")
          .order("date", { ascending: false })
          .limit(100)
      ).data ?? [],
  });
  const { data: employees } = useQuery({
    queryKey: ["employees-lite"],
    queryFn: async () =>
      (
        await supabase
          .from("employees")
          .select("id,first_name,last_name,employee_code")
      ).data ?? [],
  });

  const record = useMutation({
    mutationFn: async () => {
      const timeIn = new Date(`${form.date}T${form.time_in}:00`);
      const timeOut = new Date(`${form.date}T${form.time_out}:00`);
      const worked = Math.max(
        0,
        (timeOut.getTime() - timeIn.getTime()) / 3600000,
      );
      const late = Math.max(
        0,
        timeIn.getHours() * 60 + timeIn.getMinutes() - 9 * 60,
      );
      const under = Math.max(
        0,
        18 * 60 - (timeOut.getHours() * 60 + timeOut.getMinutes()),
      );
      const overtime = Math.max(0, worked - 9);
      const payload = {
        employee_id: form.employee_id,
        date: form.date,
        time_in: timeIn.toISOString(),
        time_out: timeOut.toISOString(),
        hours_worked: Number(worked.toFixed(2)),
        late_minutes: late,
        undertime_minutes: under,
        overtime_hours: Number(overtime.toFixed(2)),
      };
      const { error } = await supabase
        .from("attendance")
        .upsert(payload, { onConflict: "employee_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance recorded");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Record and review daily attendance"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record attendance</DialogTitle>
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Time in</Label>
                    <Input
                      type="time"
                      value={form.time_in}
                      onChange={(e) =>
                        setForm({ ...form, time_in: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Time out</Label>
                    <Input
                      type="time"
                      value={form.time_out}
                      onChange={(e) =>
                        setForm({ ...form, time_out: e.target.value })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Late is computed against 9:00,
                  undertime against 18:00.
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => record.mutate()}
                  disabled={!form.employee_id}
                >
                  Save
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
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Late (m)</TableHead>
                <TableHead>OT (h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-medium">
                    {r.employees?.first_name} {r.employees?.last_name}
                  </TableCell>
                  <TableCell>
                    {r.time_in
                      ? new Date(r.time_in).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {r.time_out
                      ? new Date(r.time_out).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>{r.hours_worked}</TableCell>
                  <TableCell>{r.late_minutes}</TableCell>
                  <TableCell>{r.overtime_hours}</TableCell>
                </TableRow>
              ))}
              {!records?.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No attendance records yet.
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
