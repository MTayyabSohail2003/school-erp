-- SQL Patch: Attendance Class Snapping
-- Ensures attendance records stay tied to the class they were marked in.

-- 1. Add class_id to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);

-- 2. Backfill class_id from current student assignments for existing records
-- (This is an approximation but safe for current data)
UPDATE public.attendance a
SET class_id = s.class_id
FROM public.students s
WHERE a.student_id = s.id
AND a.class_id IS NULL;

-- 3. Modify Index/Constraint to include class_id if necessary
-- Note: composite unique on (student_id, record_date) is still mostly correct 
-- unless a student moves class on the SAME DAY and is marked twice.
-- We will keep (student_id, record_date) unique but add class_id for lookup.

-- 4. Create index for fast class-based filtering
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, record_date);
