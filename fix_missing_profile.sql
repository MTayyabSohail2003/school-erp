-- ============================================================
-- DIAGNOSTIC: Run this in Supabase SQL Editor to check if
-- the logged-in user has a matching row in the public.users table
-- ============================================================

-- 1. See ALL rows in users table
SELECT id, email, role, full_name FROM public.users;

-- 2. Check if there are Supabase Auth users with NO matching public.users row
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- ============================================================
-- FIX: If the above query returns rows, insert missing profiles
-- Replace the values with your admin user's actual details
-- ============================================================

-- Example fix (run only if the above shows missing rows):
-- INSERT INTO public.users (id, email, role, full_name)
-- SELECT id, email, 'ADMIN', 'Admin User'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.users);

-- ============================================================
-- VERIFY RLS is allowing self-read (should return your own row)
-- ============================================================
SELECT * FROM public.users WHERE id = auth.uid();
