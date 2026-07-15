# Changelog

## [Unreleased] — Capstone rebuild

### Security
- **Removed** the public, unauthenticated `/api/public/seed-admin` endpoint
  and its "Seed demo admin" login-page button (created a hardcoded admin
  account, bypassed RLS via the service-role key).
- **Removed** self-registration ("Create account") from the login page.
- **Added** `Admin → HR Staff Accounts`: the only way to provision a new
  user, gated by a server-side admin-role check independent of the client.
- **Added** account deactivation: immediately signs the user out on next
  navigation and bans further sign-in; the last remaining Administrator is
  protected from being demoted or deactivated.
- **Added** route-level and UI-level role guards (Admin nav hidden from HR,
  `/admin` redirects non-admins).

### Database
- Switched `attendance`/`leave_requests`/`payroll` → `employees` foreign
  keys from `ON DELETE CASCADE` to `ON DELETE RESTRICT`.
- Added a unique constraint preventing duplicate payroll runs for the same
  employee + period.
- Replaced client-side random employee code generation with a database
  sequence + default (collision-proof by construction).
- Added indexes on every foreign-key column that lacked one.
- Added `salary_grades`, `job_offers`, `employment_contracts`,
  `notifications`, `employee_documents` tables.
- Added automatic audit logging via database triggers on `employees`,
  `payroll`, `user_roles`, `job_offers`, and leave status changes.
- Added `resumes` and `employee-documents` private Storage buckets with
  staff-only RLS policies.
- Added `profiles.is_active` and admin-only RLS write policy on
  `user_roles`.

### Features
- Employees: edit dialog, document upload/download, pagination, search,
  deactivate-instead-of-delete.
- Recruitment: resume upload, a real qualify/reject screening gate,
  interview pass/fail outcomes that drive applicant status, and a new
  Offers & Deployment tab covering offer → accept/decline → contract →
  signing → deployment (auto-creates the employee record).
- Payroll: draft → reviewed → released pipeline, an adjustment dialog,
  unpaid-leave salary deduction, and a printable payslip view.
- Leave: balance-sufficiency check before approval; unpaid leave no longer
  incorrectly deducts from the paid leave balance.
- Reports: report type + date-range builder covering Recruitment, Employee,
  Attendance, Leave, Payroll, and Overall HR, with CSV export and
  print/PDF.
- Profile: fixed a dead "Profile" menu item into a working self-service
  page (name, password).
- Notifications: an in-app bell for staff-facing notices.
- Admin: Salary Grades tab (replaces the old free-text field), Audit Logs
  viewer, System Settings (backup/restore for reference data).

### Deployment
- Pinned the Nitro build target to Vercel explicitly (`vite.config.ts`) —
  previously defaulted to Cloudflare.
- Added `vercel.json`, `.env.example`, `.gitignore`.
- Replaced the Lovable-sync notice in `AGENTS.md` with standalone
  contributor notes.

### Documentation
- Added `README.md`, `DEPLOYMENT_GUIDE.md`, `DATABASE.md`, `SECURITY.md`,
  `ARCHITECTURE.md`, `FLOWCHART_ANALYSIS.md`, `PROJECT_AUDIT.md`,
  `FIX_REPORT.md`, `TEST_CHECKLIST.md`.
