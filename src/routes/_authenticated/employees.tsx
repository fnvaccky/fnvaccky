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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  FileText,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

const PAGE_SIZE = 20;
const STATUSES = [
  "active",
  "probation",
  "on_leave",
  "resigned",
  "terminated",
] as const;

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department_id: "",
  position_id: "",
  basic_salary: "",
  status: "active" as (typeof STATUSES)[number],
};

function EmployeesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deactivating, setDeactivating] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(emptyForm);

  const { data: employeesResult } = useQuery({
    queryKey: ["employees", page, q],
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("*, departments(name), positions(title)", { count: "exact" })
        .order("created_at", { ascending: false });
      if (q)
        query = query.or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,employee_code.ilike.%${q}%`,
        );
      const { data, count } = await query.range(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE - 1,
      );
      return { rows: data ?? [], count: count ?? 0 };
    },
  });
  const { data: depts } = useQuery({
    queryKey: ["depts"],
    queryFn: async () =>
      (await supabase.from("departments").select("*")).data ?? [],
  });
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () =>
      (await supabase.from("positions").select("*")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.department_id) delete payload.department_id;
      if (!payload.position_id) delete payload.position_id;
      payload.basic_salary = Number(payload.basic_salary || 0);
      // employee_code is intentionally omitted — the database generates a
      // guaranteed-unique code via generate_employee_code() (see DATABASE.md).
      const { error } = await supabase.from("employees").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("employees")
        .update({
          first_name: editing.first_name,
          last_name: editing.last_name,
          email: editing.email,
          phone: editing.phone,
          department_id: editing.department_id || null,
          position_id: editing.position_id || null,
          basic_salary: Number(editing.basic_salary || 0),
          status: editing.status,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .update({ status: "terminated" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee deactivated");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = employeesResult?.rows ?? [];
  const total = employeesResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employee records"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm
                form={form}
                setForm={setForm}
                depts={depts}
                positions={positions}
              />
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.first_name || !form.last_name || create.isPending
                  }
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
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-9"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">
                    {e.employee_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {e.first_name} {e.last_name}
                  </TableCell>
                  <TableCell>{e.email ?? "—"}</TableCell>
                  <TableCell>{e.departments?.name ?? "—"}</TableCell>
                  <TableCell>{e.positions?.title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={e.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {e.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditing({ ...e, basic_salary: e.basic_salary ?? 0 })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {e.status !== "terminated" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeactivating(e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No employees yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page + 1} of {totalPages} ({total} employees)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Edit {editing.first_name} {editing.last_name}{" "}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {editing.employee_code}
                </span>
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <EmployeeForm
                  form={editing}
                  setForm={setEditing}
                  depts={depts}
                  positions={positions}
                  showStatus
                />
                <DialogFooter className="mt-4">
                  <Button
                    onClick={() => update.mutate()}
                    disabled={update.isPending}
                  >
                    Save changes
                  </Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="documents" className="mt-4">
                <EmployeeDocuments employeeId={editing.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(null)}
        title="Deactivate this employee?"
        description={`${deactivating?.first_name} ${deactivating?.last_name} will be marked as terminated. Their attendance, leave, and payroll history is preserved and can still be reported on.`}
        confirmLabel="Deactivate"
        onConfirm={() => deactivate.mutate(deactivating.id)}
      />
    </div>
  );
}

function EmployeeForm({
  form,
  setForm,
  depts,
  positions,
  showStatus,
}: {
  form: any;
  setForm: (f: any) => void;
  depts: any[] | undefined;
  positions: any[] | undefined;
  showStatus?: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label>First name</Label>
        <Input
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
      </div>
      <div>
        <Label>Last name</Label>
        <Input
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={form.phone ?? ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div>
        <Label>Department</Label>
        <Select
          value={form.department_id ?? undefined}
          onValueChange={(v) => setForm({ ...form, department_id: v })}
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
      <div>
        <Label>Position</Label>
        <Select
          value={form.position_id ?? undefined}
          onValueChange={(v) => setForm({ ...form, position_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {positions?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Basic salary</Label>
        <Input
          type="number"
          value={form.basic_salary}
          onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
        />
      </div>
      {showStatus && (
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v: any) => setForm({ ...form, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function EmployeeDocuments({ employeeId }: { employeeId: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: docs } = useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () =>
      (
        await supabase
          .from("employee_documents")
          .select("*")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `${employeeId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("employee_documents").insert({
        employee_id: employeeId,
        file_name: file.name,
        storage_path: path,
        uploaded_by: userData.user?.id,
      });
      if (error) throw error;
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  const remove = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage
        .from("employee-documents")
        .remove([doc.storage_path]);
      const { error } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleDownload(doc: any) {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(doc.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="doc-upload">
        <div className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading…" : "Upload document"}
        </div>
      </Label>
      <input
        id="doc-upload"
        type="file"
        className="hidden"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />

      <div className="space-y-2">
        {docs?.map((d: any) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
          >
            <button
              className="flex items-center gap-2 text-sm hover:underline"
              onClick={() => handleDownload(d)}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />{" "}
              {d.file_name}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove.mutate(d)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!docs?.length && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        )}
      </div>
    </div>
  );
}
