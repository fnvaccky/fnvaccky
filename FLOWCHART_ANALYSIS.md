# Flowchart Analysis — Harmony Suite HRMS

**Method:** Every node in `Blank_diagram_(1).png` was compared against the actual extracted source (`Flow HRMS2.0/`, ~1,800 lines of app code + 274-line SQL migration). Nothing below is guessed — each item cites the file that proves it.

**Stack correction:** The project description says "React, Vite, Tailwind, shadcn/ui, Framer Motion." The real stack is **TanStack Start (SSR) + TanStack Router + Nitro**, React 19, Tailwind 4, shadcn/ui — **no Framer Motion is installed**. This matters because it changes how deployment, routing, and "remove self-registration" get implemented later.

---

## 1. Correctly Implemented (matches flowchart)

| Flowchart node | Status | Evidence |
|---|---|---|
| Login Form → Enter Email/Password → Authentication Success? | ✅ | `auth.tsx` sign-in tab |
| Display Error Message on failed auth | ✅ | `toast.error(error.message)` |
| Check user roles → Admin / HR branch | ⚠️ Partial | Role is *read* (`user-menu.tsx`) but never *enforced* — see §4 |
| Admin → Manage Departments (Create/Edit/Delete) | ✅ | `admin.tsx` `Departments()` |
| Admin → Manage Positions (Create/Edit/Delete) + Assign Salary Grade | ⚠️ Partial | Positions CRUD works; "salary grade" is a free-text field, not a managed grade table |
| Recruitment → Create Job Posting / Publish | ✅ | `recruitment.tsx` `JobPostings()` |
| Recruitment → Receive/Review Applications | ⚠️ Partial | Applicants are manually entered by staff, not received from a public application form (see §2) |
| Interview Process → Schedule Interview | ✅ | `recruitment.tsx` `Interviews()` |
| Attendance → Record Time In/Out, calculate hours/late/undertime/overtime | ✅ | `attendance.tsx` (single combined form rather than two separate clock events — see §3) |
| Leave → Receive Request → Approved? → Deduct credits → Update balance → Save | ✅ | `leave.tsx` `decide` mutation |
| Payroll → Retrieve records → Compute allowances/OT/deductions → Gross/Net | ✅ | `payroll.tsx` `generate` mutation |
| Reports → basic analytics (dept distribution, leave by type, payroll trend) | ⚠️ Partial | Charts exist but the flowchart's actual report *workflow* is missing (see §2) |

---

## 2. Missing Features / Missing Workflows

These are flowchart steps with **no corresponding code at all**:

1. **Admin → Manage HR Staff Accounts (Create/Edit/Deactivate HR Account).** There is no UI to create an HR user, and no way to assign the `admin`/`hr` role to anyone. Confirmed by searching the entire source: `user_roles` is only ever written by (a) the public seed-admin endpoint and (b) never by sign-up. **This is the single most important missing feature** — an Admin literally cannot onboard an HR staff member today.
2. **Admin → System Settings.** No route, no page.
3. **Admin → Backup Database / Restore Database.** Not implemented anywhere.
4. **Admin → View Audit Logs.** The `audit_logs` table exists in SQL, but nothing in the app ever writes to it or displays it. Every "Log Action" implied throughout the flowchart is silently skipped.
5. **Admin → Generate System Reports.** No admin-level reporting screen.
6. **Recruitment → Applicant-facing Fill Application Form / Upload Resume / Submit Application.** The flowchart describes applicants applying themselves (a candidate-facing flow); the implementation only lets HR *manually type in* an applicant's name/email — there is no resume upload (the `resume_url` column exists but no upload control uses it), and no public/candidate-facing form.
7. **Recruitment → Applicant Qualified? screening gate.** Status is a free dropdown (`applied/screening/interview/offer/hired/rejected`) set manually by a human — the flowchart's decision logic ("Qualified? Yes/No → Notify Rejected") is not modeled or automated anywhere.
8. **Interview Process → Passed Initial Interview? → Schedule Final Interview → Conduct Final Interview → Hiring Decision.** The `interviews` table has a `status` enum (`scheduled/completed/cancelled/passed/failed`) but the UI **never lets a user change it** — interviews are created and then frozen at "scheduled" forever. The entire two-stage interview gate from the flowchart doesn't exist in the UI.
9. **Hiring & Deployment (whole branch): Prepare Job Offer → Applicant Accepts Offer? → Prepare Employment Contract → Print Contract → Contract Signing → Deployment.** None of this exists. There is no `job_offers` or `contracts` table, no offer/acceptance step, no contract generation.
10. **Employee Management → Generate Employee ID + "Employee ID Already Exists?" retry loop.** The code generates a code with `"EMP-" + Math.floor(Math.random()*90000+10000)` and **never checks for collisions** — the exact duplicate-ID scenario the flowchart explicitly guards against is unhandled (`employees.tsx` line 43).
11. **Employee Management → Generate Employee Account.** No auth account, invite, or credential is created for a new employee record — only a database row.
12. **Employee Management → Upload Employee Document.** Not implemented; no Storage bucket exists in `supabase/config.toml`.
13. **Employee Management → Update Employee Information.** There is no edit form for an existing employee — only Create and Delete. HR cannot correct a typo or change a department after hire without going into the database directly.
14. **Payroll → Display Payroll Summary → HR Reviews Payroll → Payroll Correct? → Edit/Adjust Payroll (if needed) → Generate Payslip → Release Payslip.** The implementation jumps straight from `draft` to `released` with a single button; there is no review step, no editable line items, and no payslip document is ever generated for an employee.
15. **Reports → Select Report Type → Select Filters (date range, etc.) → Retrieve Report Data → Generate Report → Preview Report → Export Report → Export Format (DOCX/PDF/EXCEL) → Generate Report File.** None of this exists. The Reports page is three fixed charts with zero filtering and zero export capability — the entire reporting workflow in the flowchart is absent.
16. **Notify Applicant / Notify Employee steps** (appear at every rejection point in the flowchart). No notification system exists at all — no `notifications` table, no email, no in-app alert. Rejections are silent from the recipient's point of view.

---

## 3. Incorrect Implementations (present, but diverges from the flowchart's actual logic)

1. **Login page still has a "Create account" self-registration tab** (`auth.tsx`), directly contradicting the flowchart, which starts at Login Form with no register path, and contradicting the project brief's explicit "remove self-registration" instruction. Worse: the sign-up handler creates a Supabase Auth user but **never inserts a `user_roles` row**, so a self-registered account ends up in a broken, roleless state — the UI's own claim that "New accounts default to HR role" is false; no code does that.
2. **A public, unauthenticated `/api/public/seed-admin` endpoint** (`src/routes/api/public/seed-admin.ts`) creates or resets an **admin** account with a hardcoded email/password (`admin@harmony.test` / `Admin@1234`) using the service-role key, and is wired to a "Seed demo admin" button directly on the login page. This is unrelated to any flowchart node and is a critical security hole in a system whose spec explicitly says "only Administrators can create accounts."
3. **Attendance is recorded as a single retroactive form** (pick date, type in time-in and time-out together) rather than the flowchart's two discrete events ("Record Time In" now, "Record Time Out" later that day). Functionally usable for a demo, but it isn't actually a clock-in/clock-out system.
4. **Payroll deductions only account for lateness/undertime**, not the "Leave, etc." the flowchart explicitly lists next to deductions — unpaid leave days taken during the period are never subtracted from salary.
5. **Payroll has no protection against generating the same period twice** — there's no unique constraint on `(employee_id, period_start, period_end)`, so clicking "Run payroll" repeatedly silently creates duplicate payroll rows per employee.
6. **Deleting an employee cascades and permanently destroys their attendance, leave, and payroll history** (`ON DELETE CASCADE` in the migration). For an HRMS this is backwards — historical payroll/attendance records must survive an employee's departure for audit and legal purposes. This also means the "Deactivate" concept implied throughout the flowchart doesn't really exist; the only lifecycle action available is irreversible deletion.

---

## 4. Missing Permissions / Access Control Gaps

1. **No role-based route protection anywhere in the frontend.** `_authenticated/route.tsx` only checks "is there a logged-in user," never which role. Any authenticated HR account can navigate directly to `/admin`.
2. **The sidebar shows the "Administration" (Admin) nav item to every logged-in user**, regardless of role (`app-sidebar.tsx` — the `admin` array is rendered unconditionally).
3. Database RLS *does* correctly restrict department/position writes to `admin` only, so an HR user clicking "Add department" would get a silent Postgres permission error — the frontend gives no indication why the action failed, since there's no client-side guard to prevent the attempt in the first place.
4. No distinction anywhere between what an Admin vs. an HR user should see on Employees/Attendance/Leave/Payroll — the flowchart implies these are HR-operated modules, and today Admin and HR share identical, unfiltered access with no audit trail of who did what (compounded by #4 in §2 — audit_logs is never written to).

---

## 5. Missing Pages (routes that don't exist)

- Admin: HR Staff Accounts, System Settings, Backup/Restore, Audit Logs, System Reports
- Recruitment: candidate-facing application form, job offer/contract pages
- Employee: employee detail/edit page, document upload page
- Payroll: payslip view/print page
- Reports: report builder / export page
- Cross-cutting: Notifications center, user Profile page (the "Profile" item in the account dropdown menu is present in the UI but is a dead menu item with no route or handler — `user-menu.tsx`)

---

## 6. Missing Validations

- No duplicate-employee-ID check (flowchart explicitly requires this — §2.10)
- No duplicate-payroll-run check for the same period (§3.5)
- No leave-balance-sufficiency check before approval (a request for more days than an employee has can still be approved; the balance is just clamped to 0 after the fact)
- No email format/uniqueness feedback in forms beyond the database's raw unique-constraint error bubbling up as a raw Postgres error string via `toast.error(e.message)`
- No form-level required-field validation beyond disabling the submit button (no inline error messages, no schema validation — despite `zod` and `react-hook-form` being installed dependencies, **neither is used anywhere in the app**)

---

## 7. Conflict Between the Flowchart and `PROJECT_DESCRIPTION.docx`

Per your instruction, the flowchart is the source of truth, so this is flagged rather than auto-resolved:

The project description's "Modules" list additionally names **Announcements, Notifications, Profile, Settings, and Role Management** as required modules. None of these appear as nodes in the flowchart. The dashboard currently shows a hardcoded, non-functional "Announcements" card as a placeholder (`dashboard.tsx`), which isn't backed by any table or CRUD — it's decoration, not a feature.

**Recommendation:** Since "Manage HR Staff Accounts" (flowchart) and "Role Management" (description) are really the same underlying need, and a real HRMS needs at least a minimal notification mechanism to make the flowchart's many "Notify Applicant/Employee" steps mean anything, I'd fold a lightweight version of Notifications + Role Management into the rebuild even though they're not literal flowchart boxes. Announcements/Profile/Settings I'd treat as optional/stretch unless you tell me your adviser expects them.

---

## 8. Recommended Improvements (beyond strict flowchart compliance)

- Add indexes on all foreign-key columns (`department_id`, `position_id`, `employee_id`, etc.) — none exist today; Postgres does not auto-index FKs.
- Replace `ON DELETE CASCADE` on historical tables (attendance, leave, payroll) with a soft-delete/status model on `employees`.
- Add a `UNIQUE` constraint on `payroll(employee_id, period_start, period_end)`.
- Introduce `zod` schema validation on every form (already a dependency, currently unused).
- Fix the Nitro build target: `vite.config.ts` currently defaults to a **Cloudflare** preset, not Vercel — this will not deploy correctly to Vercel as-is (details in `PROJECT_AUDIT.md`).

---

*Next: see `PROJECT_AUDIT.md` for the full technical audit (security, database, architecture, deployment) and the prioritized fix list.*
