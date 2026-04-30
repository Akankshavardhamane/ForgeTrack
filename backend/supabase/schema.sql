-- Spec §3.1 Students Table
CREATE TABLE public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spec §3.2 Sessions Table
CREATE TABLE public.sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spec §3.5 ImportLog Table
CREATE TABLE public.import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings JSONB,
  column_mapping JSONB,
  status TEXT NOT NULL
);

-- Spec §3.3 Attendance Table
CREATE TABLE public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id),
  session_id INTEGER NOT NULL REFERENCES public.sessions(id),
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES public.import_log(id),
  UNIQUE (student_id, session_id)
);

-- Spec §3.4 Materials Table
CREATE TABLE public.materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spec §3.6 Users Table (Authentication)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES public.students(id),
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
