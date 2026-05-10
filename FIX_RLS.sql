-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX DATA VISIBILITY ISSUES

-- 1. Allow anonymous users to look up students by USN (needed for student login fallback)
DROP POLICY IF EXISTS "students_anon_read" ON public.students;
CREATE POLICY "students_anon_read" ON public.students
FOR SELECT TO anon
USING (true);

-- 2. Allow anonymous users to look up users by email (needed for student login fallback)
DROP POLICY IF EXISTS "users_anon_read" ON public.users;
CREATE POLICY "users_anon_read" ON public.users
FOR SELECT TO anon
USING (true);

-- 3. Ensure the search path is correct
ALTER ROLE authenticator SET search_path = public, auth;

-- 4. Allow anonymous users to read attendance (needed for guest student dashboard)
DROP POLICY IF EXISTS "attendance_anon_read" ON public.attendance;
CREATE POLICY "attendance_anon_read" ON public.attendance
FOR SELECT TO anon
USING (true);

-- 5. Allow anonymous users to read sessions (needed for guest student dashboard)
DROP POLICY IF EXISTS "sessions_anon_read" ON public.sessions;
CREATE POLICY "sessions_anon_read" ON public.sessions
FOR SELECT TO anon
USING (true);

-- 6. Allow anonymous users to read materials (needed for guest student dashboard)
DROP POLICY IF EXISTS "materials_anon_read" ON public.materials;
CREATE POLICY "materials_anon_read" ON public.materials
FOR SELECT TO anon
USING (true);
