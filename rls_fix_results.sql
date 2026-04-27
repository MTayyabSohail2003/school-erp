-- ============================================================================
-- RLS FIX: exam_terms & exam_results
-- These tables have RLS enabled but NO policies, causing empty results.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. exam_terms — Academic year + term definitions (readable by all, writable by admin)
-- ============================================================================

-- SELECT: All authenticated users can read terms (needed for dropdowns)
CREATE POLICY "Exam terms readable by authenticated users"
ON public.exam_terms
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only admins can create new terms
CREATE POLICY "Admins can insert exam terms"
ON public.exam_terms
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update terms
CREATE POLICY "Admins can update exam terms"
ON public.exam_terms
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- DELETE: Only admins can delete terms
CREATE POLICY "Admins can delete exam terms"
ON public.exam_terms
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 2. exam_results — Per-student subject results (admin/teacher manage, parent reads own)
-- ============================================================================

-- ALL: Admins can do everything on exam results
CREATE POLICY "Admins can manage exam results"
ON public.exam_results
FOR ALL
TO authenticated
USING (public.is_admin());

-- SELECT: Teachers can view all exam results
CREATE POLICY "Teachers can view exam results"
ON public.exam_results
FOR SELECT
TO authenticated
USING (public.is_teacher());

-- INSERT/UPDATE: Teachers can enter/edit marks
CREATE POLICY "Teachers can insert exam results"
ON public.exam_results
FOR INSERT
TO authenticated
WITH CHECK (public.is_teacher());

CREATE POLICY "Teachers can update exam results"
ON public.exam_results
FOR UPDATE
TO authenticated
USING (public.is_teacher());

-- SELECT: Parents can view their children's results only
CREATE POLICY "Parents can view their children exam results"
ON public.exam_results
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
);
