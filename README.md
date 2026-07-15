# Harmony Suite HRMS

A Human Resource Management System built for an academic capstone project —
recruitment, interviews, hiring & deployment, employee records, attendance,
leave, payroll, and reporting, for **Admin** and **HR Staff** roles.

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR) + TanStack Router, React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui
- [Supabase](https://supabase.com) (Postgres, Auth, Storage, Row Level Security)
- Deploys to [Vercel](https://vercel.com) via Nitro's Vercel preset

## Getting started (local development)

```bash
npm install
cp .env.example .env   # fill in your Supabase project values
npm run dev
```

The app expects a Supabase project with the migrations in
`supabase/migrations/` applied, and at least one Administrator account
provisioned. **There is no self-registration** — see `DEPLOYMENT_GUIDE.md`
for how to create the first Admin account.

## Documentation

| File | Contents |
|---|---|
| `DEPLOYMENT_GUIDE.md` | Step-by-step: GitHub → Supabase → Vercel, from an empty account to a live URL |
| `DATABASE.md` | Schema, RLS policy design, and why key tables are structured the way they are |
| `SECURITY.md` | Auth model, RBAC, what changed from the original audit, and how to report new issues |
| `ARCHITECTURE.md` | Folder structure, server-function conventions, and design decisions |
| `FLOWCHART_ANALYSIS.md` | Original node-by-node comparison against the source flowchart |
| `PROJECT_AUDIT.md` | Original full technical audit this rebuild was based on |
| `FIX_REPORT.md` | What was actually changed, phase by phase, against that audit |
| `CHANGELOG.md` | Chronological log of changes |
| `TEST_CHECKLIST.md` | Manual test checklist to run through before presenting |

## Roles

- **Administrator** — manages HR staff accounts, departments, positions,
  salary grades, audit logs, and system settings.
- **HR Staff** — runs recruitment, employee management, attendance, leave,
  payroll, and reporting.

Accounts are provisioned exclusively from **Admin → HR Staff Accounts**
inside the app. There is intentionally no public sign-up.
