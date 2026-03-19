-- Enable Supabase Realtime publication for all key tables
-- Run this in the Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_challans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_marks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_payroll_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_subjects;

-- CRITICAL: Without REPLICA IDENTITY FULL, Supabase Realtime row-level filters
-- (e.g. recipient_id=eq.<uuid>) silently ignore INSERT events because PostgreSQL's
-- default replica identity only includes the primary key column in the CDC payload.
-- This is what causes parent→admin notifications to not arrive in real-time.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.notices REPLICA IDENTITY FULL;

-- Role-based notice board: separate Teacher / Parent / All notices
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'ALL'
    CHECK (target_audience IN ('TEACHER', 'PARENT', 'ALL'));
