-- Dynamic Subject Management Patch
-- Run this in your Supabase SQL Editor

-- 1. Create the Master Subject Collection table
CREATE TABLE IF NOT EXISTS public.subjects_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify the subjects table (Class Assignments)
-- Add master_id to link to the collection
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES public.subjects_master(id) ON DELETE CASCADE;

-- 3. Enable RLS on subjects_master
ALTER TABLE public.subjects_master ENABLE ROW LEVEL SECURITY;

-- 4. Policies for subjects_master
CREATE POLICY "Everyone can view master subjects" 
ON public.subjects_master FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage master subjects" 
ON public.subjects_master FOR ALL TO authenticated USING (public.is_admin());

-- 5. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects_master;
