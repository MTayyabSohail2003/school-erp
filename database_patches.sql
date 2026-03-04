-- Run this query in your Supabase SQL Editor to add the highly requested columns

ALTER TABLE public.students 
ADD COLUMN guardian_name TEXT;

ALTER TABLE public.students 
ADD COLUMN status TEXT DEFAULT 'ACTIVE';
