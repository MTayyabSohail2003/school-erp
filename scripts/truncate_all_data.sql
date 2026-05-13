-- Since we don't have superuser privileges to set session_replication_role,
-- we must use TRUNCATE with CASCADE to delete all data across all tables.
-- The CASCADE keyword automatically deletes rows from dependent tables.

-- We only need to truncate the top-level tables and any independent tables,
-- but for completeness we can truncate them all at once.

TRUNCATE TABLE 
    public.student_results,
    public.leave_requests,
    public.notices,
    public.notifications,
    public.staff_payroll_ledger,
    public.teacher_subjects,
    public.fee_concessions,
    public.parent_profiles,
    public.admin_profiles,
    public.attendance,
    public.exam_marks,
    public.subjects,
    public.exams,
    public.fee_challans,
    public.fee_structures,
    public.teacher_profiles,
    public.students,
    public.terms,
    public.academic_years,
    public.classes,
    public.users
CASCADE;

-- Confirm completion
SELECT 'All data has been successfully truncated from all tables using CASCADE.' as status;
