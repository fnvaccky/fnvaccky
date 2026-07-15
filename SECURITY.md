# Security

## What changed

The original codebase had a public, unauthenticated endpoint
(`/api/public/seed-admin`) that used the Supabase service-role key to create
an `admin` account with a hardcoded email and password, callable by anyone
who found the URL. It has been **deleted**, along with the login page button
that called it and the self-registration ("Create account") tab. See
`FIX_REPORT.md` and `PROJECT_AUDIT.md` for the original finding.

## Account provisioning

There is no self-service sign-up anywhere in this application. The only way
a new user gets an account is:

1. An existing Administrator opens **Admin → HR Staff Accounts → Create HR
   account**.
2. This calls `createStaffAccount` (`src/lib/staff.functions.ts`), a
   TanStack Start server function gated by the `requireAdmin` middleware
   (`src/lib/require-admin.ts`), which itself builds on the framework's
   `requireSupabaseAuth` middleware.
3. `requireAdmin` re-verifies the caller's role server-side by querying
   `user_roles` — it does not trust anything the client claims about its
   own role. Only after that check passes does the handler use the
   service-role client to create the Supabase Auth user and assign a role.
4. The very first Administrator account has no "creator" (nobody exists
   yet) and must be provisioned once via direct SQL — documented in
   `DEPLOYMENT_GUIDE.md` §2d. This is the only place a role is ever
   assigned outside the app itself.

## Defense in depth

Authorization is checked at three independent layers, any one of which
would stop an unauthorized action on its own:

1. **UI** — the Admin nav item is hidden from HR accounts
   (`app-sidebar.tsx`), and `/admin` redirects non-admins away in its route
   `beforeLoad` (`admin.tsx`).
2. **Server function** — `requireAdmin` re-checks the role on every
   admin-only server function call, independent of the UI.
3. **Database (RLS)** — every table has Row Level Security enabled;
   `user_roles` itself can only be mutated by an admin per its RLS policy,
   even though in practice only the service-role client (which bypasses
   RLS) ever writes to it.

## Account deactivation

Deactivating a staff account (Admin → HR Staff Accounts) does two things
immediately: sets `profiles.is_active = false` (checked on every route load
— an already-open session gets signed out on its next navigation) and bans
the Supabase Auth user via the Admin API (`ban_duration`), which blocks
future sign-ins. The last remaining Administrator cannot be deactivated or
demoted, to prevent accidental total lockout.

## Secrets

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely and must only ever be set
as a server-side environment variable (never `VITE_`-prefixed). It's read
exclusively inside `.server.ts` files and inside `createServerFn` handler
bodies via dynamic `import()`, following the pattern already established in
this codebase's generated Supabase client files. The project's own Vite
build has an **import-protection plugin** that throws a build error if a
`src/server/**`-pathed module is imported into client-shipped code — this
was actually caught during this rebuild and is a genuinely useful guardrail
worth keeping in mind for future changes (see `ARCHITECTURE.md`).

## Reporting a new issue

This is an academic project without a formal disclosure process — if you
find something during review, note it in `TEST_CHECKLIST.md` / raise it with
whoever is maintaining the repository.
