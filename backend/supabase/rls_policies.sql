-- 1. Create a helper function to get the current user's role without recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'authenticated'); -- Fallback to authenticated
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Students Policies
DROP POLICY IF EXISTS "students_mentor_all" ON public.students;
DROP POLICY IF EXISTS "students_authenticated_all" ON public.students;
CREATE POLICY "students_authenticated_all" ON public.students FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 3. Update Sessions Policies
DROP POLICY IF EXISTS "sessions_mentor_all" ON public.sessions;
DROP POLICY IF EXISTS "sessions_authenticated_all" ON public.sessions;
CREATE POLICY "sessions_authenticated_all" ON public.sessions FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 4. Update Attendance Policies
DROP POLICY IF EXISTS "attendance_mentor_all" ON public.attendance;
DROP POLICY IF EXISTS "attendance_authenticated_all" ON public.attendance;
CREATE POLICY "attendance_authenticated_all" ON public.attendance FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 5. Update Materials Policies
DROP POLICY IF EXISTS "materials_mentor_all" ON public.materials;
DROP POLICY IF EXISTS "materials_authenticated_all" ON public.materials;
CREATE POLICY "materials_authenticated_all" ON public.materials FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 6. Update ImportLog Policies
DROP POLICY IF EXISTS "importlog_mentor_all" ON public.import_log;
DROP POLICY IF EXISTS "importlog_authenticated_all" ON public.import_log;
CREATE POLICY "importlog_authenticated_all" ON public.import_log FOR ALL USING (
  auth.role() = 'authenticated'
);

-- 7. Update Users Table Policies (SIMPLIFIED)
DROP POLICY IF EXISTS "users_read_all_mentor" ON public.users;
DROP POLICY IF EXISTS "users_self_manage" ON public.users;
DROP POLICY IF EXISTS "users_mentor_all" ON public.users;
DROP POLICY IF EXISTS "users_self_select" ON public.users;
DROP POLICY IF EXISTS "users_self_view" ON public.users;
DROP POLICY IF EXISTS "users_mentor_view_all" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_view" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_mentor_view_all" ON public.users FOR SELECT USING (public.get_my_role() = 'mentor');
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());
