-- ==========================================
-- ROLL NUMBER REUSE FIX
-- ==========================================
-- This script allows reuse of roll numbers and B-Form IDs 
-- for new students once previous students have graduated.

-- 1. FIX ROLL NUMBER CONSTRAINT
-- Drop the global unique constraint that is blocking reuse
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_roll_number_key;

-- Create a conditional unique index: 
-- Uniqueness is only enforced for students who are 'ACTIVE' or 'INACTIVE'.
-- 'GRADUATED' or 'LEAVER' students are ignored, freeing their roll numbers for reuse.
CREATE UNIQUE INDEX IF NOT EXISTS students_roll_number_active_idx 
ON public.students (roll_number) 
WHERE status IN ('ACTIVE', 'INACTIVE');

-- 2. FIX B-FORM ID CONSTRAINT
-- Drop the global unique constraint
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_b_form_id_key;

-- Apply the same industrial logic to B-Form ID
CREATE UNIQUE INDEX IF NOT EXISTS students_b_form_active_idx 
ON public.students (b_form_id) 
WHERE status IN ('ACTIVE', 'INACTIVE');
