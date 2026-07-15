import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Briefcase,
  CalendarCheck,
  Trash2,
  FileCheck2,
  Upload,
  FileText,
  Check,
  X,
  Send,
  PenLine,
  Rocket,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/recruitment")({
  component: Recruitment,
});

function Recruitment() {
  return (
    <div>
      <PageHeader
        title="Recruitment"
        description="Job postings, applicants, interviews, offers, and deployment"
      />
      <Tabs defaultValue="postings">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="postings">
            <Briefcase className="mr-2 h-4 w-4" /> Job Postings
          </TabsTrigger>
          <TabsTrigger value="applicants">
            <Users className="mr-2 h-4 w-4" /> Applicants
          </TabsTrigger>
          <TabsTrigger value="interviews">
            <CalendarCheck className="mr-2 h-4 w-4" /> Interviews
          </TabsTrigger>
          <TabsTrigger value="offers">
            <FileCheck2 className="mr-2 h-4 w-4" /> Offers & Deployment
          </TabsTrigger>
        </TabsList>
        <TabsContent value="postings" className="mt-4">
          <JobPostings />
        </TabsContent>
        <TabsContent value="applicants" className="mt-4">
          <Applicants />
        </TabsContent>
        <TabsContent value="interviews" className="mt-4">
          <Interviews />
        </TabsContent>
        <TabsContent value="offers" className="mt-4">
          <OffersAndDeployment />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Job Postings
// ============================================================================
function JobPostings() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    department_id: "",
    status: "draft" as "draft" | "published" | "closed",
  });

  const { data: postings } = useQuery({
    queryKey: ["postings"],
    queryFn: async () =>
      (
        await supabase
          .from("job_postings")
          .select("*, departments(name)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const { data: depts } = useQuery({
    queryKey: ["depts"],
    queryFn: async () =>
      (await supabase.from("departments").select("*")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.department_id) delete payload.department_id;
      if (payload.status === "published")
        payload.posted_date = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("job_postings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job posting created");
      qc.invalidateQueries({ queryKey: ["postings"] });
      setOpen(false);
      setForm({
        title: "",
        description: "",
        requirements: "",
        department_id: "",
        status: "draft",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["postings"] });
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
                New posting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create job posting</DialogTitle>
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
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Requirements</Label>
                  <Textarea
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({ ...form, requirements: e.target.value })
                    }
                  />
                </div>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.title || create.isPending}
                >
                  Create
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
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {postings?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.departments?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={p.status === "published" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell>{p.posted_date ?? "—"}</TableCell>
                <TableCell className="text-right">
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
            {!postings?.length && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No job postings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this job posting?"
          description={`"${deleting?.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={() => del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Applicants — Submit Application -> Review -> Applicant Qualified? gate
// ============================================================================
function Applicants() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_posting_id: "",
  });

  const { data: applicants } = useQuery({
    queryKey: ["applicants"],
    queryFn: async () =>
      (
        await supabase
          .from("applicants")
          .select("*, job_postings(title)")
          .order("applied_at", { ascending: false })
      ).data ?? [],
  });
  const { data: postings } = useQuery({
    queryKey: ["postings-lite"],
    queryFn: async () =>
      (await supabase.from("job_postings").select("id,title")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.job_posting_id) delete payload.job_posting_id;
      const { data: inserted, error } = await supabase
        .from("applicants")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      if (resumeFile) {
        setUploading(true);
        const path = `${inserted.id}/${Date.now()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, resumeFile);
        if (!uploadError) {
          await supabase
            .from("applicants")
            .update({ resume_path: path })
            .eq("id", inserted.id);
        }
      }
    },
    onSuccess: () => {
      toast.success("Applicant added");
      qc.invalidateQueries({ queryKey: ["applicants"] });
      setOpen(false);
      setUploading(false);
      setResumeFile(null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_posting_id: "",
      });
    },
    onError: (e: any) => {
      toast.error(e.message);
      setUploading(false);
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("applicants")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function downloadResume(path: string) {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  const statusHint: Record<string, string> = {
    screening: "Qualified — schedule an interview from the Interviews tab",
    interview: "In interview process — manage outcomes in the Interviews tab",
    offer: "Ready for an offer — go to Offers & Deployment",
    hired: "Hired and deployed",
    rejected: "Not proceeding",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add applicant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New applicant</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>First name</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
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
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Job posting</Label>
                  <Select
                    value={form.job_posting_id}
                    onValueChange={(v) =>
                      setForm({ ...form, job_posting_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {postings?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Resume / CV</Label>
                  <Label htmlFor="resume-upload">
                    <div className="mt-1 inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                      <Upload className="mr-2 h-4 w-4" />
                      {resumeFile ? resumeFile.name : "Choose file (PDF/DOC)"}
                    </div>
                  </Label>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.first_name ||
                    !form.email ||
                    create.isPending ||
                    uploading
                  }
                >
                  Add
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
              <TableHead>Posting</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applicants?.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.first_name} {a.last_name}
                </TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.job_postings?.title ?? "—"}</TableCell>
                <TableCell>
                  {a.resume_path ? (
                    <button
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                      onClick={() => downloadResume(a.resume_path)}
                    >
                      <FileText className="h-3.5 w-3.5" /> View
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      a.status === "hired"
                        ? "default"
                        : a.status === "rejected"
                          ? "outline"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {a.status}
                  </Badge>
                  {statusHint[a.status] && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {statusHint[a.status]}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {a.status === "applied" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStatus.mutate({ id: a.id, status: "screening" })
                        }
                      >
                        Qualify
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setStatus.mutate({ id: a.id, status: "rejected" })
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {["screening", "interview", "offer"].includes(a.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setStatus.mutate({ id: a.id, status: "rejected" })
                      }
                    >
                      Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!applicants?.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No applicants yet.
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
// Interviews — Schedule -> Conduct -> Passed? gate (drives applicant status)
// ============================================================================
function Interviews() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    applicant_id: "",
    scheduled_at: "",
    type: "initial" as any,
    interviewer: "",
    notes: "",
  });

  const { data: interviews } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () =>
      (
        await supabase
          .from("interviews")
          .select("*, applicants(id,first_name,last_name,email,status)")
          .order("scheduled_at", { ascending: false })
      ).data ?? [],
  });
  // Only applicants who've passed the initial qualification gate can be scheduled.
  const { data: applicants } = useQuery({
    queryKey: ["applicants-schedulable"],
    queryFn: async () =>
      (
        await supabase
          .from("applicants")
          .select("id,first_name,last_name,status")
          .in("status", ["screening", "interview"])
      ).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interviews").insert({
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      if (error) throw error;
      // Move the applicant into the "interview" stage once something is on the calendar.
      await supabase
        .from("applicants")
        .update({ status: "interview" })
        .eq("id", form.applicant_id)
        .eq("status", "screening");
    },
    onSuccess: () => {
      toast.success("Interview scheduled");
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["applicants-schedulable"] });
      setOpen(false);
      setForm({
        applicant_id: "",
        scheduled_at: "",
        type: "initial",
        interviewer: "",
        notes: "",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const outcome = useMutation({
    mutationFn: async ({
      interview,
      result,
    }: {
      interview: any;
      result: "passed" | "failed";
    }) => {
      const { error } = await supabase
        .from("interviews")
        .update({ status: result })
        .eq("id", interview.id);
      if (error) throw error;

      if (result === "failed") {
        await supabase
          .from("applicants")
          .update({ status: "rejected" })
          .eq("id", interview.applicant_id);
      } else if (result === "passed" && interview.type === "final") {
        // Hiring Decision: Hired -> move to the offer stage.
        await supabase
          .from("applicants")
          .update({ status: "offer" })
          .eq("id", interview.applicant_id);
      }
    },
    onSuccess: (_r, vars) => {
      toast.success(
        vars.result === "passed" ? "Marked as passed" : "Marked as failed",
      );
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["applicants-schedulable"] });
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
                Schedule interview
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule interview</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Applicant</Label>
                  <Select
                    value={form.applicant_id}
                    onValueChange={(v) => setForm({ ...form, applicant_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a qualified applicant" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicants?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.first_name} {a.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!applicants?.length && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No applicants are ready for interview yet — qualify one
                      first.
                    </p>
                  )}
                </div>
                <div>
                  <Label>When</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) =>
                      setForm({ ...form, scheduled_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v: any) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interviewer</Label>
                  <Input
                    value={form.interviewer}
                    onChange={(e) =>
                      setForm({ ...form, interviewer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.applicant_id || !form.scheduled_at || create.isPending
                  }
                >
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews?.map((i: any) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">
                  {i.applicants?.first_name} {i.applicants?.last_name}
                </TableCell>
                <TableCell>
                  {new Date(i.scheduled_at).toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">{i.type}</TableCell>
                <TableCell>{i.interviewer ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      i.status === "passed"
                        ? "default"
                        : i.status === "failed"
                          ? "outline"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {i.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {i.status === "scheduled" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          outcome.mutate({ interview: i, result: "passed" })
                        }
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          outcome.mutate({ interview: i, result: "failed" })
                        }
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Fail
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!interviews?.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No interviews yet.
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
// Offers & Deployment — Prepare Offer -> Accepts? -> Contract -> Signing -> Deployment
// ============================================================================
function OffersAndDeployment() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    applicant_id: "",
    position_id: "",
    offered_salary: "",
    start_date: "",
  });

  const { data: offers } = useQuery({
    queryKey: ["job-offers"],
    queryFn: async () =>
      (
        await supabase
          .from("job_offers")
          .select(
            "*, applicants(first_name,last_name,email), positions(title,department_id), employment_contracts(*)",
          )
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const { data: offerableApplicants } = useQuery({
    queryKey: ["applicants-offerable"],
    queryFn: async () =>
      (
        await supabase
          .from("applicants")
          .select("id,first_name,last_name")
          .eq("status", "offer")
      ).data ?? [],
  });
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () =>
      (await supabase.from("positions").select("*")).data ?? [],
  });

  const createOffer = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("job_offers").insert({
        applicant_id: form.applicant_id,
        position_id: form.position_id || null,
        offered_salary: Number(form.offered_salary || 0),
        start_date: form.start_date || null,
        created_by: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer prepared");
      qc.invalidateQueries({ queryKey: ["job-offers"] });
      setOpen(false);
      setForm({
        applicant_id: "",
        position_id: "",
        offered_salary: "",
        start_date: "",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const decideOffer = useMutation({
    mutationFn: async ({
      offer,
      accepted,
    }: {
      offer: any;
      accepted: boolean;
    }) => {
      await supabase
        .from("job_offers")
        .update({
          status: accepted ? "accepted" : "declined",
          decided_at: new Date().toISOString(),
        })
        .eq("id", offer.id);
      if (!accepted) {
        await supabase
          .from("applicants")
          .update({ status: "rejected" })
          .eq("id", offer.applicant_id);
      }
    },
    onSuccess: (_r, vars) => {
      toast.success(
        vars.accepted
          ? "Offer accepted"
          : "Offer declined — application closed",
      );
      qc.invalidateQueries({ queryKey: ["job-offers"] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createContract = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("employment_contracts")
        .insert({ job_offer_id: offerId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contract drafted");
      qc.invalidateQueries({ queryKey: ["job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const advanceContract = useMutation({
    mutationFn: async ({
      contract,
      next,
    }: {
      contract: any;
      next: "sent" | "signed";
    }) => {
      const patch: any = { status: next };
      if (next === "signed") patch.signed_at = new Date().toISOString();
      const { error } = await supabase
        .from("employment_contracts")
        .update(patch)
        .eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contract updated");
      qc.invalidateQueries({ queryKey: ["job-offers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deploy = useMutation({
    mutationFn: async (offer: any) => {
      const contract = offer.employment_contracts?.[0];
      if (!contract) throw new Error("No contract on file for this offer");

      const { data: employee, error: empError } = await supabase
        .from("employees")
        .insert({
          first_name: offer.applicants.first_name,
          last_name: offer.applicants.last_name,
          email: offer.applicants.email,
          position_id: offer.position_id,
          department_id: offer.positions?.department_id ?? null,
          basic_salary: offer.offered_salary,
          status: "active",
        })
        .select("id")
        .single();
      if (empError) throw empError;

      await supabase
        .from("employment_contracts")
        .update({
          deployed_at: new Date().toISOString(),
          employee_id: employee.id,
        })
        .eq("id", contract.id);
      await supabase
        .from("applicants")
        .update({ status: "hired" })
        .eq("id", offer.applicant_id);
    },
    onSuccess: () => {
      toast.success("Deployed — employee record created");
      qc.invalidateQueries({ queryKey: ["job-offers"] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
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
                Prepare offer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Prepare job offer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Applicant</Label>
                  <Select
                    value={form.applicant_id}
                    onValueChange={(v) => setForm({ ...form, applicant_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hiring-decision applicant" />
                    </SelectTrigger>
                    <SelectContent>
                      {offerableApplicants?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.first_name} {a.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!offerableApplicants?.length && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No applicants have reached the hiring decision stage yet.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Position</Label>
                  <Select
                    value={form.position_id}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Offered salary</Label>
                    <Input
                      type="number"
                      value={form.offered_salary}
                      onChange={(e) =>
                        setForm({ ...form, offered_salary: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({ ...form, start_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createOffer.mutate()}
                  disabled={!form.applicant_id || createOffer.isPending}
                >
                  Send offer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {offers?.map((o: any) => {
            const contract = o.employment_contracts?.[0];
            return (
              <div
                key={o.id}
                className="rounded-lg border border-border/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {o.applicants?.first_name} {o.applicants?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {o.positions?.title ?? "No position set"} · ₱
                      {Number(o.offered_salary).toLocaleString()}
                      {o.start_date ? ` · starts ${o.start_date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        o.status === "accepted"
                          ? "default"
                          : o.status === "declined"
                            ? "outline"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {o.status}
                    </Badge>
                    {contract && (
                      <Badge variant="secondary" className="capitalize">
                        Contract: {contract.status}
                      </Badge>
                    )}
                    {contract?.deployed_at && <Badge>Deployed</Badge>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          decideOffer.mutate({ offer: o, accepted: true })
                        }
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Applicant accepted
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          decideOffer.mutate({ offer: o, accepted: false })
                        }
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Applicant declined
                      </Button>
                    </>
                  )}
                  {o.status === "accepted" && !contract && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createContract.mutate(o.id)}
                    >
                      <PenLine className="mr-1 h-3.5 w-3.5" />
                      Prepare contract
                    </Button>
                  )}
                  {contract?.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        advanceContract.mutate({ contract, next: "sent" })
                      }
                    >
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Send contract
                    </Button>
                  )}
                  {contract?.status === "sent" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        advanceContract.mutate({ contract, next: "signed" })
                      }
                    >
                      <FileCheck2 className="mr-1 h-3.5 w-3.5" />
                      Mark signed
                    </Button>
                  )}
                  {contract?.status === "signed" && !contract.deployed_at && (
                    <Button
                      size="sm"
                      onClick={() => deploy.mutate(o)}
                      disabled={deploy.isPending}
                    >
                      <Rocket className="mr-1 h-3.5 w-3.5" />
                      Deploy & create employee
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!offers?.length && (
            <p className="py-8 text-center text-muted-foreground">
              No offers yet. Prepare one once an applicant reaches the hiring
              decision.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
