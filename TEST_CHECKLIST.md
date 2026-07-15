# Test Checklist

Run through this against your deployed (or local) instance, connected to a
real Supabase project, before presenting. Check off as you go.

## Login
- [ ] Login page shows only Email, Password, Sign in — no "Create account".
- [ ] Wrong password shows an error, doesn't sign in.
- [ ] Correct credentials sign in and land on the Dashboard.
- [ ] Signing out returns to the login page and blocks back-navigation into
      authenticated pages.

## Roles & permissions
- [ ] Signed in as HR: no "Administration" section in the sidebar.
- [ ] Signed in as HR: manually navigating to `/admin` redirects away.
- [ ] Signed in as Admin: Administration section is visible and works.
- [ ] Admin → HR Staff Accounts → create a new HR account → sign in as
      that account in a different browser/incognito window → works.
- [ ] Admin → deactivate that account → the deactivated account is signed
      out (on its next action) and can no longer sign in.
- [ ] Attempting to deactivate or demote the only Administrator account is
      blocked with a clear error.

## Dashboard
- [ ] Stat cards load without errors.
- [ ] Recent activity / charts render.

## Admin
- [ ] Departments: create, edit, delete (with confirmation).
- [ ] Positions: create, edit (including assigning a Salary Grade), delete.
- [ ] Salary Grades: create, delete.
- [ ] Audit Logs: shows entries after performing actions above (may take a
      refresh).
- [ ] System Settings: Backup downloads a JSON file; Restore re-imports it
      without error.

## Recruitment
- [ ] Job Postings: create, publish, delete.
- [ ] Applicants: add a new applicant with a resume file attached; resume
      "View" link opens the file.
- [ ] Applicants: "Qualify" moves an applicant to Screening; "Reject"
      terminates the pipeline for that applicant.
- [ ] Interviews: schedule an interview for a qualified applicant.
- [ ] Interviews: mark an interview "Pass" and "Fail" — confirm applicant
      status updates accordingly (Fail → Rejected; Pass on a Final
      interview → Offer stage).
- [ ] Offers & Deployment: prepare an offer for an applicant at the offer
      stage.
- [ ] Mark the offer Accepted → Prepare contract → Send → Mark signed →
      Deploy — confirm a new row appears in Employees with the right name,
      position, and salary.
- [ ] Mark a different offer Declined — confirm the applicant is marked
      Rejected.

## Employees
- [ ] Add a new employee manually — confirm an employee code is generated
      automatically (no code field to fill in).
- [ ] Edit an existing employee's details and save.
- [ ] Upload a document to an employee, then download and delete it.
- [ ] Deactivate an employee (with confirmation) — confirm their attendance
      /leave/payroll history (if any) is still visible elsewhere, not
      deleted.
- [ ] Search and pagination work with more than 20 employees (or confirm
      pagination controls appear/disappear correctly at the boundary).

## Attendance
- [ ] Record a day's time in/out for an employee — hours worked, late,
      undertime, and overtime calculate correctly.

## Leave
- [ ] Submit a leave request.
- [ ] Approve a request within the employee's remaining balance — balance
      decreases correctly.
- [ ] Attempt to approve a request for more days than the employee's
      balance — confirm it's blocked with a clear message.
- [ ] Submit and approve an "unpaid" leave request — confirm the paid
      leave balance is unaffected.
- [ ] Reject a pending request.

## Payroll
- [ ] Run payroll for a period with active employees — rows appear as
      Draft.
- [ ] Run payroll again for the exact same period — confirm it reports
      that employees already have a run instead of creating duplicates.
- [ ] Mark a draft row Reviewed.
- [ ] Adjust a reviewed row's allowances/deductions and save — Net Pay
      recalculates.
- [ ] Release a reviewed row — status becomes Released.
- [ ] Open the Payslip view for a released row and use Print / Save PDF.
- [ ] Run payroll for a period including an approved unpaid-leave day for
      an employee — confirm their Leave deduction column is non-zero.

## Reports
- [ ] Generate each of the 6 report types with a date range that has data.
- [ ] Export CSV and confirm the file opens correctly (e.g. in Excel/Sheets).
- [ ] Use Print / Save PDF and confirm the table is legible in the print
      preview.
- [ ] Scroll down to the existing analytics charts and confirm they still
      render.

## Profile
- [ ] Open Profile from the user menu (previously a dead link).
- [ ] Update display name — confirm it updates in the sidebar/user menu.
- [ ] Change password — sign out and sign back in with the new password.

## Notifications
- [ ] Bell icon shows an unread count when a notification exists, clears
      on open.

## Deployment sanity
- [ ] `npm run build` completes with no errors.
- [ ] `npx tsc --noEmit` completes with no errors.
- [ ] Fresh clone + `npm install` + `.env` from `.env.example` + `npm run
      dev` works end to end against your Supabase project.
