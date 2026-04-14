-- SQL Patch: Student & Promotion Module Enhancements

-- 1. Students Table Updates
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS b_form_id TEXT;

-- Add unique constraint to b_form_id (if not already there)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_b_form_id_key') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_b_form_id_key UNIQUE (b_form_id);
    END IF;
END $$;

-- 2. Promotion History Table
CREATE TABLE IF NOT EXISTS public.promotion_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    from_class_id UUID NOT NULL REFERENCES public.classes(id),
    to_class_id UUID REFERENCES public.classes(id), -- Null if graduated
    academic_year_from TEXT,
    academic_year_to TEXT,
    promoted_by UUID REFERENCES public.users(id),
    promotion_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'PROMOTED' CHECK (status IN ('PROMOTED', 'GRADUATED', 'DEMOTED'))
);

-- 3. Security (RLS)
ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promotion history" 
ON public.promotion_history FOR ALL TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admins and Teachers can view promotion history" 
ON public.promotion_history FOR SELECT TO authenticated 
USING (public.is_admin() OR public.is_teacher());

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_promotion_history_student ON public.promotion_history(student_id);
CREATE INDEX IF NOT EXISTS idx_students_b_form ON public.students(b_form_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON public.students(academic_year);
