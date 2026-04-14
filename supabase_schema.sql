-- School ERP Master Database Schema & Security Policies (Live Supabase)
-- Please execute this entire script in your Supabase SQL Editor.

-- ============================================================================
-- 1. ENUMS (Constants)
-- ============================================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'PARENT');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');
CREATE TYPE fee_status AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- A. USERS (Extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'PARENT',
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. CLASSES
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'Nursery', 'Class 10'
    section TEXT NOT NULL, -- e.g., 'A', 'B'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, section)
);

-- C. STUDENTS (Core Entity)
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    b_form_url TEXT,
    old_cert_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. TEACHER PROFILES
CREATE TABLE public.teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    qualification TEXT NOT NULL,
    monthly_salary NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- E. FEE STRUCTURES
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    monthly_fee NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id)
);

-- F. FEE CHALLANS
CREATE TABLE public.fee_challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE RESTRICT,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    amount_due NUMERIC NOT NULL,
    status fee_status NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- G. EXAMS
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. SUBJECTS
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- I. EXAM MARKS
CREATE TABLE public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    marks_obtained NUMERIC NOT NULL,
    total_marks NUMERIC NOT NULL,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(exam_id, student_id, subject_id)
);

-- J. ATTENDANCE
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, record_date)
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'TEACHER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Users
CREATE POLICY "Admins can do everything on users" 
ON public.users FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Users can view their own record" 
ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update their own record" 
ON public.users FOR UPDATE TO authenticated USING (id = auth.uid());

-- Classes (Publicly readable for authenticated users)
CREATE POLICY "Classes are readable by authenticated users" 
ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage classes" 
ON public.classes FOR ALL TO authenticated USING (public.is_admin());

-- Students
CREATE POLICY "Admins and Teachers can view all students" 
ON public.students FOR SELECT TO authenticated USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Parents can only view their own children" 
ON public.students FOR SELECT TO authenticated USING (parent_id = auth.uid());

CREATE POLICY "Admins can manage students" 
ON public.students FOR ALL TO authenticated USING (public.is_admin());

-- Teacher Profiles
CREATE POLICY "Admins can manage teacher profiles" 
ON public.teacher_profiles FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can view their own profile" 
ON public.teacher_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Fee Structures
CREATE POLICY "Fee structures readable by authenticated users" 
ON public.fee_structures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fee structures" 
ON public.fee_structures FOR ALL TO authenticated USING (public.is_admin());

-- Fee Challans
CREATE POLICY "Admins can manage fee challans" 
ON public.fee_challans FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Parents can view their children's challans" 
ON public.fee_challans FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);
    
-- Exams & Subjects
CREATE POLICY "Exams and Subjects readable by authenticated users" 
ON public.exams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage exams" 
ON public.exams FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Subjects readable by authenticated users" 
ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" 
ON public.subjects FOR ALL TO authenticated USING (public.is_admin());

-- Exam Marks
CREATE POLICY "Admins and Teachers can manage exam marks" 
ON public.exam_marks FOR ALL TO authenticated USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Parents can view their children's marks" 
ON public.exam_marks FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);

-- Attendance
CREATE POLICY "Admins and Teachers can manage attendance" 
ON public.attendance FOR ALL TO authenticated USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Parents can view their children's attendance" 
ON public.attendance FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);

-- ============================================================================
-- 4. BUCKET (Storage)
-- ============================================================================
-- Note: Remember to create a public bucket named 'documents' in the Supabase UI 
-- for B-Forms and Certificates. Storage RLS policies will be managed via UI or 
-- a separate storage API.

-- ============================================================================
-- 5. NEW PHASE 1 ENTITIES
-- ============================================================================

-- K. ADMIN PROFILES
CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage admin profiles" ON public.admin_profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can view their own profile" ON public.admin_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- L. PARENT PROFILES
CREATE TABLE public.parent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    address TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage parent profiles" ON public.parent_profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Parents can view their own profile" ON public.parent_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- M. FEE CONCESSIONS
CREATE TABLE public.fee_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    concession_type TEXT NOT NULL,
    discount_percentage NUMERIC NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id)
);

ALTER TABLE public.fee_concessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fee concessions" ON public.fee_concessions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Parents can view their child's concessions" ON public.fee_concessions FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);

-- N. TEACHER SUBJECTS (Junction)
CREATE TABLE public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage teacher subjects" ON public.teacher_subjects FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Teachers can view their own subjects" ON public.teacher_subjects FOR SELECT TO authenticated USING (teacher_id = auth.uid());

-- O. STAFF PAYROLL LEDGER
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

-- P. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Admins and teachers can insert notifications"
    ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_teacher());
CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- Q. ADD TERM TO EXAMS TABLE
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'UNIT_TEST';

-- R. ARREARS CARRY-FORWARD — add to fee_challans
ALTER TABLE public.fee_challans ADD COLUMN IF NOT EXISTS arrears NUMERIC NOT NULL DEFAULT 0;

-- S. NOTICES TABLE (Global Notice Board)
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    posted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view notices"
    ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can post notices"
    ON public.notices FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can delete notices"
    ON public.notices FOR DELETE TO authenticated USING (public.is_admin());



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
-- U. DYNAMIC RESULT MANAGEMENT SYSTEM
-- ============================================================================

-- 1. ACADEMIC YEARS
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., '2024-2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academic years readable by authenticated users" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage academic years" ON public.academic_years FOR ALL TO authenticated USING (public.is_admin());

-- 2. TERMS
CREATE TABLE public.terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'First Term', 'Mid Term', 'Final Term'
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(academic_year_id, name)
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Terms readable by authenticated users" ON public.terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage terms" ON public.terms FOR ALL TO authenticated USING (public.is_admin());

-- 3. STUDENT RESULTS
CREATE TABLE public.student_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    total_marks NUMERIC NOT NULL,
    obtained_marks NUMERIC NOT NULL,
    percentage NUMERIC GENERATED ALWAYS AS ((obtained_marks / total_marks) * 100) STORED,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, term_id, subject_id)
);

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and Teachers can manage results" ON public.student_results FOR ALL TO authenticated USING (public.is_admin() OR public.is_teacher());
CREATE POLICY "Parents can view their children's results" ON public.student_results FOR SELECT TO authenticated 
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);
