-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Mentors have full access. Students have restricted access.
-- We can create a helper function to get the current user's role and student_id.

-- Students Policies
CREATE POLICY "students_mentor_all" ON public.students FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "students_student_select_own" ON public.students FOR SELECT USING (
  id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Sessions Policies
CREATE POLICY "sessions_mentor_all" ON public.sessions FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "sessions_student_select_all" ON public.sessions FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'student'
);

-- Attendance Policies
CREATE POLICY "attendance_mentor_all" ON public.attendance FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "attendance_student_select_own" ON public.attendance FOR SELECT USING (
  student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Materials Policies
CREATE POLICY "materials_mentor_all" ON public.materials FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "materials_student_select_all" ON public.materials FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'student'
);

-- ImportLog Policies
CREATE POLICY "importlog_mentor_all" ON public.import_log FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Users Table Policies
CREATE POLICY "users_mentor_all" ON public.users FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "users_self_select" ON public.users FOR SELECT USING (
  id = auth.uid()
);
