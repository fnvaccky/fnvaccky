# Database

Two migrations, applied in order:

1. `20260714051610_..._df0526b3....sql` — the original schema (departments,
   positions, employees, job_postings, applicants, interviews, attendance,
   leave_requests, payroll, profiles, user_roles, audit_logs) with RLS
   enabled everywhere.
2. `20260715090000_core_fixes_and_missing_tables.sql` — everything added or
   changed in this rebuild. This file is the one to read to understand what
   changed and why; every section has an inline comment explaining the
   audit finding it addresses.

## Key design decisions

**Roles.** Two roles only — `admin` and `hr` — stored in `user_roles`
(one row per user). `public.is_staff(uid)` returns true for either;
`public.has_role(uid, 'admin')` checks a specific role. Almost every table's
RLS policy is "any staff member can read/write," matching the flowchart's
model where Admin and HR share the same operational modules. `user_roles`
itself can only be written by an Administrator (`Admin manage roles` policy),
and in practice is only ever written through the service-role staff-account
server functions — see `SECURITY.md`.

**Employee codes are generated in the database, not the client.**
`generate_employee_code()` pulls from a Postgres `SEQUENCE`, which is
atomic and collision-proof by construction — this replaces the original
`Math.random()` generator that had no way to detect a collision before
insert.

**History doesn't cascade-delete.** `attendance`, `leave_requests`, and
`payroll` reference `employees(id)` with `ON DELETE RESTRICT`, not
`CASCADE`. An employee with any history can't be hard-deleted at all — the
app only exposes a status change ("Deactivate" → `status = 'terminated'`),
which is also what the flowchart implies (there's no "delete employee" node,
only lifecycle status).

**Payroll can't be double-run.** `UNIQUE (employee_id, period_start,
period_end)` on `payroll`, plus the app checks for existing rows before
generating and only inserts for employees who don't already have one.

**Salary grades are a real table**, not a free-text field. `positions`
gained `salary_grade_id` referencing `salary_grades`; the old
`salary_grade` text column is kept (unused by new code) for backward
read-compatibility rather than a destructive drop.

**Hiring & Deployment has real tables.** `job_offers` and
`employment_contracts` back the flowchart's offer → acceptance → contract →
signing → deployment sequence. Deployment (creating the `employees` row) is
done by the app once a contract's status reaches `signed`.

**Notifications** is a simple table keyed to `auth.users` (staff only —
applicants and employees don't have login accounts in this system, so
flowchart "Notify Applicant/Employee" steps are represented as in-app
status/badge changes visible to HR, not an external message).

**Audit logging is automatic, not manual.** `write_audit_log()` is a
generic trigger function attached to `employees`, `payroll`,
`user_roles`, `job_offers`, and leave status changes. Nothing in the
application code has to remember to call it — this was a deliberate
response to the original audit finding that `audit_logs` existed but was
never written to.

**Storage.** Two private buckets, `resumes` and `employee-documents`,
created directly via SQL insert into `storage.buckets` (works on Supabase
without dashboard access), each with staff-only RLS policies mirroring the
table-level `is_staff()` pattern.

## Indexes

Every foreign-key column that didn't already have one from a `UNIQUE`
constraint got an explicit `CREATE INDEX` — Postgres does not auto-index the
referencing side of a foreign key, only the referenced side.

## Re-running / rolling back

Migrations use `IF NOT EXISTS` / `DROP ... IF EXISTS` guards where practical
so re-running the second migration against a database that already has it
applied is safe. There's no down-migration — for a capstone project scope,
the recommended rollback path is restoring a Supabase project backup rather
than hand-writing reverse SQL.
