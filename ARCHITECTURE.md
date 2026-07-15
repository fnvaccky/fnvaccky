# Architecture

## Stack

TanStack Start (SSR framework built on Nitro) + TanStack Router (file-based
routing) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + TanStack
Query + Supabase.

## Folder structure

```
src/
  routes/                    File-based routes (TanStack Router)
    _authenticated/          Layout route: requires login, resolves role,
                              renders sidebar + header + <Outlet/>
      dashboard.tsx
      recruitment.tsx        Job postings, applicants, interviews, offers
      employees.tsx
      attendance.tsx
      leave.tsx
      payroll.tsx
      reports.tsx
      admin.tsx               Admin-only (route-guarded)
      profile.tsx
    auth.tsx                 Login only — no self-registration
    index.tsx                Public marketing/landing page
  components/                 Shared UI (sidebar, user menu, notifications
                               bell, confirm dialog) + components/ui (shadcn)
  integrations/supabase/      Supabase clients (generated — see below)
  lib/                        Server functions + server-only helpers +
                               general utilities
  server.ts, start.ts         SSR entry / global middleware registration
supabase/
  migrations/                 Timestamped SQL migrations, applied in order
```

## Server-only code: the `.server.ts` / `*.functions.ts` convention

This project's Vite config includes an **import-protection plugin** that
throws a build error if anything under a `src/server/**` directory is
imported into client-shipped code (discovered and worked around during this
rebuild — see `FIX_REPORT.md`). Two safe patterns are used instead:

- **`*.server.ts`** files (e.g. `client.server.ts`) are never imported
  directly by client code; instead, they're loaded with a dynamic
  `import()` from inside a server function's handler body, so bundlers can
  tree-shake them out of the client bundle.
- **`*.functions.ts`** files (e.g. `src/lib/staff.functions.ts`) export
  `createServerFn(...)`-built functions. TanStack Start's compiler splits
  the handler body into a server-only chunk automatically — the client only
  ever gets a thin RPC stub. These files are safe to import directly from
  route components.

Both live under `src/lib/`, not `src/server/`, specifically because of the
import-protection rule above.

## Auth & RBAC flow

1. `src/start.ts` registers `attachSupabaseAuth` as global `functionMiddleware`
   — every `createServerFn` call automatically gets the caller's Supabase
   session token attached as a Bearer header.
2. `requireSupabaseAuth` (generated, `integrations/supabase/auth-middleware.ts`)
   validates that token server-side and exposes an RLS-scoped Supabase
   client plus the caller's `userId`.
3. `requireAdmin` (`src/lib/require-admin.ts`) composes on top of that and
   additionally checks the caller's role in `user_roles`, throwing an
   `AppError` (see below) if they aren't an Administrator.
4. Route-level: `_authenticated/route.tsx`'s `beforeLoad` resolves the
   user's role and account-active status once per navigation and puts them
   in TanStack Router's route context, which any descendant route or
   component can read via `Route.useRouteContext()` — used by the sidebar
   to hide the Admin section and by `admin.tsx` to redirect non-admins.

## Error propagation from server functions

`src/start.ts` wraps every request in an error-handling middleware that
converts unhandled exceptions into an HTML error page — appropriate for a
failed page render, but not what you want from a server function call a
`useMutation` is waiting on (it would swallow the real error message).
`src/lib/app-error.ts` defines `AppError`, which carries a `statusCode`;
the request middleware special-cases errors with a `statusCode` and
re-throws them as-is instead of converting them, so `error.message` reaches
the client's `onError` handler intact. Server functions that need to surface
a specific message to the UI throw `AppError`, not a plain `Error`.

## Why the Lovable build wrapper (`@lovable.dev/vite-tanstack-config`) was kept

The original audit flagged this as a Lovable dependency to evaluate. It was
**kept, not removed** — it's a plain, publicly-published npm package (not a
Lovable-hosted service), and its own documented API supports pinning a
deployment target for self-hosted use (`nitro: { preset: "vercel" }`, now
set explicitly in `vite.config.ts`). Rewriting the routing/build wiring it
provides by hand would have meant re-implementing a large, semi-documented
configuration surface from scratch for no functional benefit, and would
have been a much higher-risk change than a one-line preset override. What
actually mattered for the "don't depend on Lovable" requirement — the
public deployment-time dependency — was removing the Lovable Cloud
assumption (fresh Supabase project, real env vars) and pinning the build
output to Vercel, both of which are done. See `PROJECT_AUDIT.md` and
`FIX_REPORT.md` for the full reasoning.
