-- Run this in your Supabase SQL Editor to allow saving users without Supabase Auth accounts.
-- This removes the strict requirement that every row in public.users must have a matching record in auth.users.

-- 1. Remove the foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Ensure id has a default UUID generator if we want to insert without providing one (optional but recommended)
-- ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
