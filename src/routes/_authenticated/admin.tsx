import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createStaffAccount,
  updateStaffAccount,
  setStaffAccountActive,
  listStaffAccounts,
} from "@/lib/staff.functions";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ShieldOff,
  ShieldCheck,
  Download,
  Upload,
  ScrollText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Administration"
        description="Staff accounts, departments, positions, salary grades, and system settings"
      />
      <Tabs defaultValue="staff">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="staff">HR Staff Accounts</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="grades">Salary Grades</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-4">
          <StaffAccounts />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <Departments />
        </TabsContent>
        <TabsContent value="positions" className="mt-4">
          <Positions />
        </TabsContent>
        <TabsContent value="grades" className="mt-4">
          <SalaryGrades />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditLogs />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// HR Staff Accounts — the flowchart's "Manage HR Staff Accounts" branch.
// This is the ONLY way a new user gets into Harmony Suite.
// ============================================================================
function StaffAccounts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deactivating, setDeactivating] = useState<any | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "hr" as "admin" | "hr",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["staff-accounts"],
    queryFn: async () => listStaffAccounts(),
  });

  const create = useMutation({
    mutationFn: () => createStaffAccount({ data: form }),
    onSuccess: () => {
      toast.success(`Account created for ${form.email}`);
      qc.invalidateQueries({ queryKey: ["staff-accounts"] });
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "hr" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (vars: {
      userId: string;
      fullName?: string;
      role?: "admin" | "hr";
    }) => updateStaffAccount({ data: vars }),
    onSuccess: () => {
      toast.success("Account updated");
      qc.invalidateQueries({ queryKey: ["staff-accounts"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setActive = useMutation({
    mutationFn: (vars: { userId: string; isActive: boolean }) =>
      setStaffAccountActive({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(
        vars.isActive ? "Account reactivated" : "Account deactivated",
      );
      qc.invalidateQueries({ queryKey: ["staff-accounts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create HR account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create HR staff account</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Temporary password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v: "admin" | "hr") =>
                      setForm({ ...form, role: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">HR Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.email ||
                    !form.password ||
                    !form.fullName ||
                    create.isPending
                  }
                >
                  {create.isPending ? "Creating…" : "Create account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.full_name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.email}
                </TableCell>
                <TableCell>
                  <Badge variant={s.role === "admin" ? "default" : "secondary"}>
                    {s.role === "admin" ? "Administrator" : "HR Staff"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.is_active ? (
                    <Badge
                      variant="outline"
                      className="text-emerald-600 border-emerald-600/40"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-destructive border-destructive/40"
                    >
                      Deactivated
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeactivating(s)}
                  >
                    {s.is_active ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No staff accounts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {editing && (
          <Dialog open onOpenChange={() => setEditing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {editing.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Full name</Label>
                  <Input
                    defaultValue={editing.full_name ?? ""}
                    onChange={(e) => (editing.full_name = e.target.value)}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    defaultValue={editing.role}
                    onValueChange={(v) => (editing.role = v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">HR Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    update.mutate({
                      userId: editing.id,
                      fullName: editing.full_name,
                      role: editing.role,
                    })
                  }
                  disabled={update.isPending}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(o) => !o && setDeactivating(null)}
          title={
            deactivating?.is_active
              ? "Deactivate this account?"
              : "Reactivate this account?"
          }
          description={
            deactivating?.is_active
              ? `${deactivating?.full_name} will be immediately signed out and unable to log back in until reactivated.`
              : `${deactivating?.full_name} will be able to sign in again.`
          }
          confirmLabel={deactivating?.is_active ? "Deactivate" : "Reactivate"}
          destructive={!!deactivating?.is_active}
          onConfirm={() =>
            setActive.mutate({
              userId: deactivating.id,
              isActive: !deactivating.is_active,
            })
          }
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Departments
// ============================================================================
function Departments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data } = useQuery({
    queryKey: ["depts-admin"],
    queryFn: async () =>
      (await supabase.from("departments").select("*").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department added");
      qc.invalidateQueries({ queryKey: ["depts-admin"] });
      setOpen(false);
      setForm({ name: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("departments")
        .update({ name: editing.name, description: editing.description })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department updated");
      qc.invalidateQueries({ queryKey: ["depts-admin"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department deleted");
      qc.invalidateQueries({ queryKey: ["depts-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add department</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!form.name}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {d.description ?? "—"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ ...d })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(d)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!data?.length && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
                >
                  No departments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {editing && (
          <Dialog open onOpenChange={() => setEditing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit department</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    defaultValue={editing.name}
                    onChange={(e) => (editing.name = e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    defaultValue={editing.description ?? ""}
                    onChange={(e) => (editing.description = e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => update.mutate()}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this department?"
          description={`"${deleting?.name}" will be permanently removed. Positions assigned to it will keep their historical data but lose the department link.`}
          confirmLabel="Delete"
          onConfirm={() => del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Positions
// ============================================================================
function Positions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: "",
    department_id: "",
    salary_grade_id: "",
    base_salary: "",
  });

  const { data } = useQuery({
    queryKey: ["positions-admin"],
    queryFn: async () =>
      (
        await supabase
          .from("positions")
          .select("*, departments(name), salary_grades(grade_code,label)")
          .order("title")
      ).data ?? [],
  });
  const { data: depts } = useQuery({
    queryKey: ["depts"],
    queryFn: async () =>
      (await supabase.from("departments").select("*")).data ?? [],
  });
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () =>
      (await supabase.from("salary_grades").select("*").order("grade_code"))
        .data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        base_salary: Number(form.base_salary || 0),
      };
      if (form.department_id) payload.department_id = form.department_id;
      if (form.salary_grade_id) payload.salary_grade_id = form.salary_grade_id;
      const { error } = await supabase.from("positions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Position added");
      qc.invalidateQueries({ queryKey: ["positions-admin"] });
      setOpen(false);
      setForm({
        title: "",
        department_id: "",
        salary_grade_id: "",
        base_salary: "",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("positions")
        .update({
          title: editing.title,
          department_id: editing.department_id || null,
          salary_grade_id: editing.salary_grade_id || null,
          base_salary: Number(editing.base_salary || 0),
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Position updated");
      qc.invalidateQueries({ queryKey: ["positions-admin"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Position deleted");
      qc.invalidateQueries({ queryKey: ["positions-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add position</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select
                    value={form.department_id}
                    onValueChange={(v) =>
                      setForm({ ...form, department_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {depts?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Salary grade</Label>
                    <Select
                      value={form.salary_grade_id}
                      onValueChange={(v) =>
                        setForm({ ...form, salary_grade_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades?.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.grade_code} — {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Base salary</Label>
                    <Input
                      type="number"
                      value={form.base_salary}
                      onChange={(e) =>
                        setForm({ ...form, base_salary: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!form.title}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Base</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.departments?.name ?? "—"}</TableCell>
                <TableCell>{p.salary_grades?.grade_code ?? "—"}</TableCell>
                <TableCell>
                  {Number(p.base_salary ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ ...p })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!data?.length && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No positions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {editing && (
          <Dialog open onOpenChange={() => setEditing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit position</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    defaultValue={editing.title}
                    onChange={(e) => (editing.title = e.target.value)}
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select
                    defaultValue={editing.department_id ?? undefined}
                    onValueChange={(v) => (editing.department_id = v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {depts?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Salary grade</Label>
                    <Select
                      defaultValue={editing.salary_grade_id ?? undefined}
                      onValueChange={(v) => (editing.salary_grade_id = v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades?.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.grade_code} — {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Base salary</Label>
                    <Input
                      type="number"
                      defaultValue={editing.base_salary ?? 0}
                      onChange={(e) => (editing.base_salary = e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => update.mutate()}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this position?"
          description={`"${deleting?.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={() => del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Salary Grades
// ============================================================================
function SalaryGrades() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState({
    grade_code: "",
    label: "",
    min_salary: "",
    max_salary: "",
  });

  const { data } = useQuery({
    queryKey: ["grades-admin"],
    queryFn: async () =>
      (await supabase.from("salary_grades").select("*").order("grade_code"))
        .data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salary_grades").insert({
        grade_code: form.grade_code,
        label: form.label,
        min_salary: Number(form.min_salary || 0),
        max_salary: Number(form.max_salary || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salary grade added");
      qc.invalidateQueries({ queryKey: ["grades-admin"] });
      setOpen(false);
      setForm({ grade_code: "", label: "", min_salary: "", max_salary: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("salary_grades")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salary grade deleted");
      qc.invalidateQueries({ queryKey: ["grades-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add salary grade</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Grade code</Label>
                    <Input
                      placeholder="e.g. G5"
                      value={form.grade_code}
                      onChange={(e) =>
                        setForm({ ...form, grade_code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input
                      placeholder="e.g. Senior"
                      value={form.label}
                      onChange={(e) =>
                        setForm({ ...form, label: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Min salary</Label>
                    <Input
                      type="number"
                      value={form.min_salary}
                      onChange={(e) =>
                        setForm({ ...form, min_salary: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max salary</Label>
                    <Input
                      type="number"
                      value={form.max_salary}
                      onChange={(e) =>
                        setForm({ ...form, max_salary: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.grade_code || !form.label}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Range</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((g: any) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.grade_code}</TableCell>
                <TableCell>{g.label}</TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(g.min_salary).toLocaleString()} –{" "}
                  {Number(g.max_salary).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(g)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!data?.length && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No salary grades yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this salary grade?"
          description={`Positions using "${deleting?.grade_code}" will keep their base salary but lose the grade link.`}
          confirmLabel="Delete"
          onConfirm={() => del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Audit Logs (read-only — rows are written automatically by database triggers)
// ============================================================================
function AuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () =>
      (
        await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ScrollText className="h-4 w-4" /> Showing the most recent 100 system
          actions. Entries are written automatically — there is no manual edit
          path.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="font-medium">{log.entity}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {log.entity_id}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No audit activity recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// System Settings — company info + a lightweight backup/restore for the
// reference tables (departments, positions, salary grades). Attendance,
// payroll, and employee records should be backed up via Supabase's own
// project-level backups (see DEPLOYMENT_GUIDE.md) — restoring those from a
// client-side JSON blob is out of scope for a safe, reversible action here.
// ============================================================================
function SystemSettings() {
  const [importing, setImporting] = useState(false);

  async function handleBackup() {
    const [depts, positions, grades] = await Promise.all([
      supabase.from("departments").select("*"),
      supabase.from("positions").select("*"),
      supabase.from("salary_grades").select("*"),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      departments: depts.data ?? [],
      positions: positions.data ?? [],
      salary_grades: grades.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harmony-suite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function handleRestore(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.salary_grades?.length) {
        await supabase.from("salary_grades").upsert(
          parsed.salary_grades.map((g: any) => ({
            grade_code: g.grade_code,
            label: g.label,
            min_salary: g.min_salary,
            max_salary: g.max_salary,
          })),
          { onConflict: "grade_code" },
        );
      }
      if (parsed.departments?.length) {
        await supabase.from("departments").upsert(
          parsed.departments.map((d: any) => ({
            name: d.name,
            description: d.description,
          })),
          { onConflict: "name" },
        );
      }
      toast.success("Restore complete for departments and salary grades");
    } catch (e: any) {
      toast.error(`Restore failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup database</CardTitle>
          <CardDescription>
            Download departments, positions, and salary grades as JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackup}>
            <Download className="mr-2 h-4 w-4" />
            Download backup
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            For full data protection including employee, payroll, and attendance
            history, use your Supabase project's own database backups (Supabase
            Dashboard → Database → Backups).
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restore from backup</CardTitle>
          <CardDescription>
            Re-import departments and salary grades from a JSON backup file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="restore-file">
            <div className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Restoring…" : "Choose backup file"}
            </div>
          </Label>
          <input
            id="restore-file"
            type="file"
            accept="application/json"
            className="hidden"
            disabled={importing}
            onChange={(e) =>
              e.target.files?.[0] && handleRestore(e.target.files[0])
            }
          />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Company information</CardTitle>
          <CardDescription>
            Displayed on the login screen and generated reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Harmony Suite HRMS — company profile fields (name, address, logo) can
          be wired to a
          <code className="mx-1 rounded bg-muted px-1 py-0.5">
            system_settings
          </code>{" "}
          table in a future iteration; kept out of this pass to avoid touching
          the branding without a specific request.
        </CardContent>
      </Card>
    </div>
  );
}
