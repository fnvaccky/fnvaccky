# Contributor notes

Harmony Suite HRMS is a standalone TanStack Start + Supabase project. It is no
longer connected to Lovable — this repository is the source of truth.

- Run `npm install` then `npm run dev` for local development.
- Server-only code must live in files ending in `.server.ts` (never imported
  by client code) or use `createServerFn()` (see `src/lib/*.functions.ts`).
  Files under a `server/` directory are blocked from client-side import by
  the build's import-protection plugin — keep server function files at the
  top level of `src/lib/` instead.
- Database changes go in `supabase/migrations/` as new, timestamped SQL
  files — never edit a migration that has already been applied to a shared
  environment. See `DATABASE.md`.
- See `DEPLOYMENT_GUIDE.md` for the full GitHub -> Supabase -> Vercel
  deployment flow, and `TEST_CHECKLIST.md` before presenting/demoing.
