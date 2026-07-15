# Deployment Guide: GitHub → Supabase → Vercel

This walks through deploying Harmony Suite HRMS from scratch using only
GitHub, Supabase, and Vercel — no Lovable account or Lovable Cloud project
involved anywhere in this flow.

---

## 1. Create a new GitHub repository

1. Go to [github.com/new](https://github.com/new).
2. Name it (e.g. `harmony-suite-hrms`), choose **Private** (recommended for a
   capstone with real-looking data), and create it **without** a README
   (this project already has one).
3. On your machine, inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Harmony Suite HRMS"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/harmony-suite-hrms.git
   git push -u origin main
   ```
4. Confirm `.env` is **not** in the pushed files (it's covered by
   `.gitignore` — only `.env.example` should appear on GitHub).

---

## 2. Create a new Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New
   project**.
2. Pick an organization, name the project, set a strong database password
   (save it somewhere safe), and choose a region close to you.
3. Wait for provisioning to finish (a couple of minutes).

### 2a. Run the SQL migrations

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/20260714051610_df0526b3-8ef0-4a5c-8835-c8fbed1dad47.sql`
   from this repo, copy its full contents, paste into a new SQL Editor query,
   and click **Run**.
3. Do the same for
   `supabase/migrations/20260715090000_core_fixes_and_missing_tables.sql`
   — **run it after** the first one; it depends on tables the first one
   creates.
4. If you use the [Supabase CLI](https://supabase.com/docs/guides/cli)
   instead, `supabase link` to this project and run `supabase db push`,
   which applies every file in `supabase/migrations/` in order automatically.

### 2b. Confirm Storage buckets were created

The second migration creates two private Storage buckets via SQL
(`resumes` and `employee-documents`). Check **Storage** in the dashboard —
both should already be listed. If they're missing (some Supabase plans
restrict bucket creation via SQL), create them manually with the same names,
both **private** (not public).

### 2c. Get your API keys

Go to **Settings → API**. You'll need three values for the next steps:
- **Project URL**
- **anon / publishable key**
- **service_role / secret key** (click "reveal" — keep this one secret)

### 2d. Create the first Administrator account

There is no self-registration, and the old public "seed admin" endpoint has
been removed for security. Create your first Admin directly in Supabase:

1. **Authentication → Users → Add user** → enter an email and password,
   check "Auto Confirm User", create it. Copy the generated **User UID**.
2. **SQL Editor**, run (replacing the UID and desired name):
   ```sql
   insert into public.user_roles (user_id, role) values ('PASTE-USER-UID-HERE', 'admin');
   update public.profiles set full_name = 'Your Name' where id = 'PASTE-USER-UID-HERE';
   ```
3. Sign in with that email/password once the app is deployed. From
   **Admin → HR Staff Accounts**, you can create every other account from
   then on — you won't need to touch SQL again.

---

## 3. Create a new Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub
   repository you pushed in step 1.
2. **Framework Preset:** choose **Other** (this project isn't a framework
   Vercel auto-detects; `vercel.json` and the Nitro Vercel preset handle the
   build shape).
3. **Root Directory:** leave as the repository root (`.`) — don't point it
   at a subfolder.
4. **Build settings:** `vercel.json` already sets `"buildCommand": "npm run
   build"` and `"installCommand": "npm install"` — you shouldn't need to
   override anything, but if Vercel's UI asks, use those exact values, and
   leave **Output Directory** on its default (the build produces
   `.vercel/output`, which Vercel's Build Output API detects automatically).

### 3a. Configure Environment Variables

In the Vercel project → **Settings → Environment Variables**, add all five
(Production, and Preview if you want PR previews to work too):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your anon/publishable key |
| `SUPABASE_URL` | same Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | same anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role/secret key |

See `.env.example` for what each is used for.

### 3b. Deploy

Click **Deploy**. Vercel will install dependencies, run the build, and
publish. On future pushes to `main`, Vercel redeploys automatically.

---

## 4. Post-deploy checklist

- [ ] Visit the deployed URL → you land on the login page (no "Create
      account" option should be visible).
- [ ] Sign in with the Admin account created in step 2d.
- [ ] Go to **Admin → HR Staff Accounts** and create a real HR account —
      confirm it can sign in.
- [ ] Walk through `TEST_CHECKLIST.md`.

---

## Troubleshooting

**Build fails on Vercel with a Supabase env var error.** Double-check all
five variables in §3a are set for the **Production** environment specifically
(not just Preview/Development), then redeploy.

**Login page shows a Supabase error.** `VITE_SUPABASE_URL` /
`VITE_SUPABASE_PUBLISHABLE_KEY` are missing or wrong — these are the two
that ship to the browser; typos here are the most common cause.

**"Forbidden: this action requires the Administrator role" when creating
staff accounts.** You're signed in as an HR account, not Admin — only Admins
can provision accounts. Confirm your `user_roles` row for that user has
`role = 'admin'`.

**Storage upload fails (resume/document upload).** Confirm the `resumes`
and `employee-documents` buckets exist (§2b) and that you ran both
migrations, since the Storage RLS policies are created in the second one.

**Payroll "Run payroll" says everyone already has a run.** That period has
already been generated for every active employee — pick a different date
range, or check existing rows in the Payroll table.

**Local dev can't reach Supabase.** Confirm `.env` (not `.env.example`) exists
locally with real values — `.env` is gitignored on purpose and isn't part of
the repository you pushed.
