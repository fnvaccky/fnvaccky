# Project Audit — Harmony Suite HRMS

Scope: full read-through of the extracted archive `Flow HRMS2.0/` (every `.ts`/`.tsx`/`.sql`/`.toml`/config file, ~90 files, ~1,800 lines of app code + 274-line SQL migration + generated Supabase types). This audit reflects what the code actually does, not what the description says it does.

## Executive Summary

This is a real, working proof-of-concept — auth, RLS, and five of the seven HR modules genuinely function end-to-end against Supabase. But it is a **thin CRUD skeleton**, not a production HRMS: most flowchart *workflows* (multi-step approval chains, offer/contract flow, payroll review cycle, reporting/export) are collapsed into single free-form status dropdowns, several tables and columns exist in SQL with no UI ever touching them, and there is one critical, unauthenticated admin-account-creation endpoint that must be removed before this goes anywhere near a public URL. Given the deadline, the highest-leverage work is: (1) remove the security holes, (2) build the one missing feature that blocks everything else — Admin can create HR accounts — (3) close the data-integrity gaps, then (4) work down the module-by-module gap list in `FLOWCHART_ANALYSIS.md`.

## Actual Tech Stack (verified from package.json / configs)

- **Framework:** TanStack Start (SSR, file-based routing via `@tanstack/react-router`) + Nitro server, **not** a plain Vite SPA
- React 19, TypeScript 5.8, Tailwind CSS 4, shadcn/ui (Radix primitives), TanStack Query 5
- Supabase JS client 2.110, `zod` 3.24 and `react-hook-form` 7.71 installed **but unused anywhere in the code**
- **Framer Motion is not installed** despite being named in the project description
- Package manager: Bun (`bunfig.toml` present); scripts also work under npm/pnpm since it's plain `vite`/`nitro` under the hood
- No test framework, no CI config, no `.gitignore`, no `README.md`, no `vercel.json`, no `.env.example` anywhere in the archive

---

## 🔴 Critical Security Issues

1. **Unauthenticated admin-account backdoor.** `src/routes/api/public/seed-admin.ts` is a public `POST` endpoint (no auth check) that uses the **service-role key** (bypasses RLS entirely) to create or reset an account with a **hardcoded email and password** (`admin@harmony.test` / `Admin@1234`) and grants it the `admin` role. It is wired to a visible "Seed demo admin" button on the public login page (`auth.tsx`). Anyone who finds the deployed URL can get full admin access in one click, with zero credentials of their own. **This must be deleted, not fixed, before any deployment.**
2. **Self-registration is live and violates the stated requirement.** The login page has a "Create account" tab (`auth.tsx`) calling `supabase.auth.signUp` with no restriction. Anyone can create an account. It's *currently* low-impact only because the resulting user gets no role and can't pass `is_staff()` checks — but that's an accident of a bug (§ Database below), not a safety net, and it leaves broken, roleless auth users accumulating in the system.
3. **No role-based authorization on the frontend.** `_authenticated/route.tsx` checks only "is a user logged in," never their role. The Admin route and nav link are visible and reachable by any authenticated account, HR included. RLS backstops the actual data writes for departments/positions, but there's no defense in depth, and for other tables (employees, payroll, leave — see next point) there is no backstop at all.
4. **HR and Admin have identical database-level permissions on the most sensitive tables.** The RLS policies for `employees`, `payroll`, `leave_requests`, `interviews`, `applicants`, and `job_postings` all use a single `is_staff()` check (`role IN (admin, hr)`) with no distinction — any HR account can read and write **all payroll data for all employees**, approve/deny leave for anyone including edit access to salary figures, with no server-side restriction and no audit trail (see next point).
5. **`audit_logs` table exists but nothing ever writes to it.** Despite the flowchart and the RLS policy structure implying an audit trail (`"Admin read audit"` policy exists), zero `INSERT` calls into `audit_logs` exist anywhere in the app. There is currently no way to answer "who changed this payroll record" — a significant gap for an HR system.
6. **Environment variable / secret hygiene.** No `.gitignore` exists in the archive. If a real `.env` is ever created in this repo before a `.gitignore` is added, service-role keys risk being committed to the new GitHub repo you're about to create.

---

## 🟠 Database Issues

1. **Destructive cascades on historical data.** `attendance`, `leave_requests`, and `payroll` all reference `employees(id) ON DELETE CASCADE`. Deleting an employee record — the only "offboarding" action the UI offers — permanently erases their entire attendance, leave, and payroll history. This is both a data-integrity and (in most jurisdictions) a compliance problem; payroll records typically must be retained regardless of employment status.
2. **No indexes on foreign keys.** Postgres does not automatically index FK columns (only the referenced PK side is indexed). None of `department_id`, `position_id`, `employee_id`, `job_posting_id`, `applicant_id`, `approved_by` have explicit indexes. Every join in this app (and there's a join on nearly every query) will degrade as data grows.
3. **Missing uniqueness constraints:**
   - `payroll` has no unique constraint on `(employee_id, period_start, period_end)` → duplicate payroll runs are possible with no warning.
   - `employees.employee_code` is `UNIQUE`, which is good, but the app-layer ID generator (random 5-digit suffix) never checks for collisions before insert, so it relies entirely on the DB throwing an opaque unique-violation error that the UI surfaces as a raw Postgres message.
4. **Dead/unused RLS policy.** `"Users insert own profile"` on `profiles` is unreachable in practice because `handle_new_user()` (a `SECURITY DEFINER` trigger) already creates the profile row server-side on signup — the client-side insert path this policy protects is never exercised by the app.
5. **No table for job offers, employment contracts, notifications, or document storage**, even though the flowchart explicitly requires an offer/contract workflow, and the description's own module list requires notifications and documents. These need new tables in the redesign.
6. **Salary grade is a free-text column** (`positions.salary_grade TEXT`) rather than a managed reference table, so "Assign Salary Grade" from the flowchart has no actual grade catalog to select from — HR can type anything.
7. **No `updated_at`/trigger coverage gaps:** every core table does have `set_updated_at` wired correctly — this part is solid and worth keeping.

---

## 🟡 Architecture & Code Quality Issues

1. **No client-side validation layer.** `zod` and `react-hook-form` are dependencies but every form in the codebase is raw `useState` + manual `onChange` handlers with no schema validation, so the only feedback on bad input is a raw database error message surfaced via toast.
2. **No reusable data layer / API abstraction.** Every route file (`employees.tsx`, `payroll.tsx`, `leave.tsx`, etc.) inlines its own Supabase queries and mutations directly in the component. There's no shared `hooks/useEmployees.ts`-style layer, so the same query shapes (e.g., "employees with department+position joined") are duplicated across files with slightly different field selections each time.
3. **No pagination anywhere.** Every list query does `.select(...)` with at most a hardcoded `.limit(100)` (attendance) or `.limit(200)` (payroll) and no page controls — this will silently truncate data as the org grows, with no indication to the user that anything is missing.
4. **No edit capability on core entities.** Employees, job postings, and departments/positions can be created and deleted, but not edited, in the current UI (delete-and-recreate is the only "correction" path, which also orphans any FK references).
5. **No confirmation dialogs before destructive actions.** Every delete button (`employees.tsx`, `admin.tsx`, `recruitment.tsx`) fires immediately on click with no "Are you sure?" step, despite the project brief explicitly asking for confirmation dialogs.
6. **`any` typing throughout mutation handlers** (`(e: any) => toast.error(e.message)` pattern repeated everywhere) despite the project running strict TypeScript — errors aren't typed, so nothing stops a future refactor from silently breaking error handling.
7. **Empty states are present and consistent** (e.g., "No employees yet.") — this part follows good UX practice already and is worth keeping.

---

## 🟡 Deployment Configuration Issues

1. **Nitro build target defaults to Cloudflare, not Vercel.** `vite.config.ts`'s own comment states the shared config includes "nitro (build-only using **cloudflare** as a default target)." Since you intend to deploy exclusively to Vercel, this must be explicitly overridden to the Vercel preset in `tanstackStart`/nitro config, or the production build output will not run correctly on Vercel.
2. **No `vercel.json`.** For a TanStack Start + Nitro SSR app (not a static site), Vercel needs to know this is a Node/Edge function target; without explicit config this is fragile.
3. **No `.env.example`.** You'll need one listing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus whatever `VITE_*` client-exposed equivalents `client.ts` expects, or you'll rediscover the required variable names by trial and error against Vercel's build logs.
4. **No `.gitignore`.** Needs one before the first commit to the new GitHub repo (covers `node_modules`, `.env`, `dist`/`.output`, etc.).
5. **Several files carry "This file is automatically generated. Do not edit it directly." headers and reference "Lovable Cloud"** (`client.ts`, `client.server.ts`, `auth-middleware.ts`, error messages like `"Connect Supabase in Lovable Cloud"`). These are functionally fine (plain Supabase JS client under the hood) but the user-facing error copy and `AGENTS.md`'s Lovable-sync warning should be cleaned up since you're moving off Lovable.

---

## 🟢 What's Actually Solid (keep as-is)

- RLS is enabled on every table with sensible `has_role`/`is_staff` helper functions — the *pattern* is correct, it just needs finer-grained policies per role.
- `updated_at` triggers are consistently applied.
- The visual design system (Tailwind tokens, `hs-*` utility classes, shadcn components) is cohesive and doesn't need a rewrite — the brief says preserve branding unless functionality requires a change, and there's no functional reason to touch it.
- Empty states, loading skeletons on the dashboard, and toast notifications are already implemented app-wide.
- The attendance/payroll math (hours worked, late minutes, overtime, gross/net) is correctly implemented arithmetic — it just needs to account for leave deductions and be wired into an editable review step.

---

## Prioritized Fix List

**P0 — Critical, before anything else:**
1. Delete `src/routes/api/public/seed-admin.ts` and the "Seed demo admin" button entirely.
2. Remove the self-registration tab from `auth.tsx`; login page becomes email + password + submit only.
3. Fix the sign-up-creates-roleless-user bug as part of #2 (moot once self-signup is removed).
4. Build Admin → Manage HR Staff Accounts (create/edit/deactivate), since it's the only way to get a second real user into the system once seed-admin and self-signup are gone.

**P1 — Data integrity:**
5. Change `attendance`/`leave_requests`/`payroll` FKs from `CASCADE` to a safe pattern (`RESTRICT` + employee soft-delete/status).
6. Add the missing unique constraint on `payroll(employee_id, period_start, period_end)` and a real collision-checked employee ID generator.
7. Add FK indexes.

**P2 — Close the biggest flowchart gaps:**
8. Employee edit page; interview outcome transitions (pass/fail → next stage); job offer/contract mini-workflow; payroll review/adjust/payslip step.
9. Route-level + UI-level role guards (hide Admin nav from HR, redirect on direct navigation).

**P3 — Reporting & polish:**
10. Reports module: type/filter selection + CSV/PDF export (a realistic capstone-scope version of the flowchart's DOCX/PDF/EXCEL export gate).
11. Confirmation dialogs on all deletes, zod validation on all forms, audit log writes on sensitive actions.

**P4 — Deployment:**
12. Vercel-target nitro config, `vercel.json`, `.env.example`, `.gitignore`, `README.md` deployment guide.

---

*This audit is deliberately based only on what's in the uploaded archive — no assumptions about unseen code. See `FLOWCHART_ANALYSIS.md` for the node-by-node comparison this priority list is derived from.*
