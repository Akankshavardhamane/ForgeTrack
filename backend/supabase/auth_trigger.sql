-- Create auth trigger to auto-create public.users row when a student is inserted.
-- Wait, the spec says "When a student is added to the Students table, a corresponding user account is auto-created with role='student' and a default password (their USN)."
-- Supabase doesn't allow inserting into auth.users directly from public triggers due to permissions.
-- Alternatively, we can use an Edge Function or a SECURITY DEFINER function to create the auth.user and then the public.users record.
-- However, we can create a trigger on `public.students` that calls an RPC function or we provide an RPC to mentors to add students.
-- For demo purposes, we will provide a function to create a student which handles both.

-- Here is a trigger that runs after insert on `auth.users` to create a `public.users` row
-- But since students are created without signup, we need a way to insert into auth.users.
-- Let's provide a script for this logic.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- If this user is signing up (mentor, etc) and not seeded
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (new.id, new.email, 'mentor', new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- We will handle creating `auth.users` for students in `seed.sql` or from application code (Supabase admin API) since direct insertion to `auth.users` from `public` is restricted.
