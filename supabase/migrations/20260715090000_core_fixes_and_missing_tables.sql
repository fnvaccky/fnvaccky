-- =====================================================================================
-- Harmony Suite HRMS — Core fixes & missing tables
-- Addresses P0 (HR staff account management) and P1 (data integrity) findings from
-- PROJECT_AUDIT.md / FLOWCHART_ANALYSIS.md. See DATABASE.md for the full rationale.
-- =====================================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES: account status flag
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- 2. USER_ROLES: explicit admin-only write policy (defense in depth — the app
--    only ever writes this table through the service-role staff-management
--    server functions, but RLS should not depend on that alone).
-- ---------------------------------------------------------------------------
CREATE POLICY "Admin manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. FOREIGN KEY INDEXES (Postgres does not auto-index the referencing side)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON public.positions(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_department_id ON public.job_postings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_position_id ON public.job_postings(position_id);
CREATE INDEX IF NOT EXISTS idx_applicants_job_posting_id ON public.applicants(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON public.applicants(status);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON public.interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);

-- ---------------------------------------------------------------------------
-- 4. DATA INTEGRITY: stop payroll/attendance/leave history from being wiped
--    out when an employee record is removed. History must survive for audit
--    and compliance purposes — offboarding should be a status change, not a
--    delete. We keep the FK but switch it to RESTRICT.
-- ---------------------------------------------------------------------------
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

ALTER TABLE public.payroll DROP CONSTRAINT IF EXISTS payroll_employee_id_fkey;
ALTER TABLE public.payroll ADD CONSTRAINT payroll_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- 5. Prevent duplicate payroll runs for the same employee + period
-- ---------------------------------------------------------------------------
ALTER TABLE public.payroll ADD CONSTRAINT payroll_employee_period_unique
  UNIQUE (employee_id, period_start, period_end);

-- Payroll needs a "reviewed" checkpoint the flowchart requires between
-- draft and released, plus a place to store an HR reviewer note.
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS leave_deduction NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 6. Server-side, collision-proof employee code generator (replaces the
--    client-side Math.random() generator that had no duplicate check).
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.employee_code_seq START 1001;

CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT 'EMP-' || LPAD(nextval('public.employee_code_seq')::TEXT, 5, '0');
$$;

ALTER TABLE public.employees ALTER COLUMN employee_code SET DEFAULT public.generate_employee_code();

-- ---------------------------------------------------------------------------
-- 7. SALARY GRADES — a real managed catalog instead of a free-text field,
--    so "Assign Salary Grade" (flowchart, Admin branch) is an actual choice.
-- ---------------------------------------------------------------------------
CREATE TABLE public.salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  min_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_grades TO authenticated;
GRANT ALL ON public.salary_grades TO service_role;
ALTER TABLE public.salary_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read salary grades" ON public.salary_grades FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin manage salary grades" ON public.salary_grades FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_salary_grades_updated BEFORE UPDATE ON public.salary_grades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS salary_grade_id UUID REFERENCES public.salary_grades(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_positions_salary_grade_id ON public.positions(salary_grade_id);
-- The old free-text column is kept temporarily for backward compatibility with any
-- existing rows, but the UI now writes to salary_grade_id going forward.
COMMENT ON COLUMN public.positions.salary_grade IS 'Deprecated free-text grade — superseded by salary_grade_id. Kept for read compatibility only.';

-- ---------------------------------------------------------------------------
-- 8. JOB OFFERS + EMPLOYMENT CONTRACTS — the flowchart's entire
--    "Hiring & Deployment" branch had no backing tables at all.
-- ---------------------------------------------------------------------------
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  offered_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  status public.offer_status NOT NULL DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_offers TO authenticated;
GRANT ALL ON public.job_offers TO service_role;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage job offers" ON public.job_offers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_job_offers_updated BEFORE UPDATE ON public.job_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_job_offers_applicant_id ON public.job_offers(applicant_id);

CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'signed');

CREATE TABLE public.employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  status public.contract_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment_contracts TO authenticated;
GRANT ALL ON public.employment_contracts TO service_role;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage contracts" ON public.employment_contracts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.employment_contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_employment_contracts_job_offer_id ON public.employment_contracts(job_offer_id);

-- ---------------------------------------------------------------------------
-- 9. NOTIFICATIONS — every "Notify Applicant / Notify Employee" step in the
--    flowchart previously had nothing to write to.
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);

-- ---------------------------------------------------------------------------
-- 10. AUTOMATIC AUDIT LOGGING — the audit_logs table existed but nothing
--     ever wrote to it. A generic trigger removes the risk of a developer
--     forgetting to log a sensitive action.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row_id TEXT;
BEGIN
  row_id := COALESCE(NEW.id, OLD.id)::TEXT;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    row_id,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER trg_audit_payroll AFTER INSERT OR UPDATE OR DELETE ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER trg_audit_leave AFTER UPDATE ON public.leave_requests FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER trg_audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER trg_audit_job_offers AFTER INSERT OR UPDATE ON public.job_offers FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- ---------------------------------------------------------------------------
-- 11. STORAGE — resume uploads and employee documents (flowchart explicitly
--     calls for "Upload Resume / CV" and "Upload Employee Document").
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('employee-documents', 'employee-documents', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff read resumes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff upload resumes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete resumes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff read employee documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff upload employee documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete employee documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-documents' AND public.is_staff(auth.uid()));

CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.employee_documents TO authenticated;
GRANT ALL ON public.employee_documents TO service_role;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage employee documents" ON public.employee_documents FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents(employee_id);

-- ---------------------------------------------------------------------------
-- 12. Applicants: add a resume storage path column used by the upload UI
-- ---------------------------------------------------------------------------
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS resume_path TEXT;
