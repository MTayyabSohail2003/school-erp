-- ============================================================
-- SCHOOL ERP — FULL RESET SCRIPT
-- Deletes ALL users and ALL linked data in safe dependency order.
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Results & Academic Data
DELETE FROM public.exam_results;
DELETE FROM public.exam_terms;

-- 2. Leave Requests
DELETE FROM public.leave_requests;

-- 3. Notifications
DELETE FROM public.notifications;

-- 4. Notices
DELETE FROM public.notices;

-- 5. Attendance
DELETE FROM public.attendance;

-- 6. Fee Data
DELETE FROM public.fee_challans;
DELETE FROM public.fee_concessions;
DELETE FROM public.fee_structures;

-- 7. Payroll Ledger
DELETE FROM public.staff_payroll_ledger;

-- 8. Teacher Subjects
DELETE FROM public.teacher_subjects;

-- 9. Students (must come before users since students.parent_id → users)
DELETE FROM public.students;

-- 10. Staff / Role Profiles
DELETE FROM public.teacher_profiles;
DELETE FROM public.admin_profiles;
DELETE FROM public.parent_profiles;

-- 11. Classes & Subjects
DELETE FROM public.subjects;
DELETE FROM public.classes;

-- 12. Public Users (cascades to nothing — safe now)
DELETE FROM public.users;

-- 13. Supabase Auth Users (CASCADE will clean up any remaining links)
DELETE FROM auth.users;

-- ============================================================
-- VERIFY — All should return 0 rows
-- ============================================================
SELECT 'auth.users'    AS table_name, COUNT(*) FROM auth.users
UNION ALL
SELECT 'public.users',               COUNT(*) FROM public.users
UNION ALL
SELECT 'students',                   COUNT(*) FROM public.students
UNION ALL
SELECT 'fee_challans',               COUNT(*) FROM public.fee_challans;
