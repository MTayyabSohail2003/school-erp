-- ============================================================================
-- MIGRATION: Results System Hardening (Phase A)
-- Purpose: Make exam_results safe for 10-30+ years of institutional data
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Add `class_id` snapshot to exam_results
--    This preserves the class the student was in AT THE TIME of the exam,
--    so results survive batch promotions across academic years.
-- ============================================================================

ALTER TABLE public.exam_results
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);

-- Backfill existing results with the student's current class_id
UPDATE public.exam_results er
SET class_id = s.class_id
FROM public.students s
WHERE er.student_id = s.id
AND er.class_id IS NULL;

-- ============================================================================
-- 2. Add audit timestamps to exam_results
--    Tracks when each result was last modified for compliance and debugging.
-- ============================================================================

ALTER TABLE public.exam_results
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.exam_results
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.exam_results
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Auto-update `updated_at` on every row change
CREATE OR REPLACE FUNCTION public.handle_exam_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_exam_results_updated_at ON public.exam_results;
CREATE TRIGGER set_exam_results_updated_at
    BEFORE UPDATE ON public.exam_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_exam_results_updated_at();

-- ============================================================================
-- 3. Create efficient RPC for metadata usage check
--    Replaces the full-table scan with a SELECT DISTINCT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_used_term_ids()
RETURNS SETOF UUID AS $$
    SELECT DISTINCT term_id FROM public.exam_results;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. Create index for performance on the new class_id column
--    This makes historical queries by class blazing fast
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_results_class_id
ON public.exam_results(class_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_term_class
ON public.exam_results(term_id, class_id);

-- ============================================================================
-- VERIFICATION: Run these queries after migration to confirm success
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'exam_results' ORDER BY ordinal_position;
--
-- SELECT * FROM public.get_used_term_ids();
