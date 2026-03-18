-- Run this query in your Supabase SQL Editor to add the highly requested columns

ALTER TABLE public.students 
ADD COLUMN guardian_name TEXT;

ALTER TABLE public.students 
ADD COLUMN status TEXT DEFAULT 'ACTIVE';

-- ============================================================================
-- T. LEAVE REQUESTS TABLE
-- ============================================================================
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    applied_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's leave requests
CREATE POLICY "Parents can view their children's leave requests" 
ON public.leave_requests FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
    OR applied_by = auth.uid()
);

-- Parents can insert leave requests for their children
CREATE POLICY "Parents can insert leave requests"
ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (
    applied_by = auth.uid() AND
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);

-- Admins and Teachers can view all leave requests (to approve/reject)
CREATE POLICY "Admins and Teachers can view all leave requests"
ON public.leave_requests FOR SELECT TO authenticated
USING (public.is_admin() OR public.is_teacher());

-- Admins and Teachers can update leave request status
CREATE POLICY "Admins and Teachers can update leave requests"
ON public.leave_requests FOR UPDATE TO authenticated
USING (public.is_admin() OR public.is_teacher());

-- ============================================================================
-- O. STAFF PAYROLL LEDGER
-- ============================================================================
CREATE TABLE public.staff_payroll_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    base_salary NUMERIC NOT NULL,
    deductions NUMERIC DEFAULT 0,
    net_paid NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PAID',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staff_payroll_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payroll ledger" ON public.staff_payroll_ledger FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Teachers can view own ledger" ON public.staff_payroll_ledger FOR SELECT TO authenticated USING (teacher_id = auth.uid());

-- ============================================================================
-- REALTIME NOTIFICATION SYSTEM PATCHES
-- Run this patch in your Supabase SQL Editor
-- ============================================================================

-- Add type and link columns to notifications for richer UX
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'INFO';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Enable Supabase Realtime publication for all key tables
-- (Do this via Supabase Dashboard > Database > Replication, or run the SQL below)
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

-- ============================================================================
-- CLASS TEACHER & PRIMARY CLASS SUPPORT
-- ============================================================================
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- ============================================================================
-- U. FEE CHALLAN ENHANCEMENTS (Payment Methods)
-- ============================================================================
ALTER TABLE public.fee_challans 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('CASH', 'BANK'));

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC;

-- ============================================================================
-- STUDENT PHOTO UPLOAD SUPPORT
-- ============================================================================
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================================
-- V. FEE CHALLAN ENHANCEMENTS (Partial Payments)
-- ============================================================================
ALTER TABLE public.fee_challans 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC NOT NULL DEFAULT 0;

-- ============================================================================
-- W. MAKE FEE_STRUCTURE_ID OPTIONAL FOR DYNAMIC CHALLANS
-- ============================================================================
ALTER TABLE public.fee_challans
ALTER COLUMN fee_structure_id DROP NOT NULL;
