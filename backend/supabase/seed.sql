-- Replace with your actual UUIDs if running from app, but for pure SQL seed, we need to bypass auth.users or use Supabase interface.
-- Here we insert mock data into public tables for UI testing.
-- To test properly, sign up a user in Supabase Auth, get their UUID, and update the public.users table.

INSERT INTO public.students (name, usn, email, branch_code, admission_number) VALUES
('Abhishek Sharma', '4SH24CS001', 'abhishek@gmail.com', 'CS', '24CS001'),
('Divya Kulkarni', '4SH24CS002', 'divya@gmail.com', 'AI', '24CS002'),
('Ravi Kumar', '4SH24CS003', 'ravi@gmail.com', 'CS', '24CS003'),
('Arjun Reddy', '4SH24IS004', 'arjun@gmail.com', 'IS', '24IS004'),
('Sneha Patil', '4SH24CS005', 'sneha@gmail.com', 'CS', '24CS005');

INSERT INTO public.sessions (date, topic, month_number, session_type) VALUES
('2026-04-01', '8-Layer AI Stack', 4, 'offline'),
('2026-04-02', 'ReAct Agent Pattern', 4, 'offline'),
('2026-04-08', 'pgvector RAG', 4, 'offline'),
('2026-04-15', 'Tiered Autonomy Multi-Agent', 4, 'offline');

-- We leave attendance and materials empty for now, or you can run mock attendance:
INSERT INTO public.attendance (student_id, session_id, present) VALUES
(1, 1, true), (2, 1, true), (3, 1, false), (4, 1, true), (5, 1, true),
(1, 2, true), (2, 2, false), (3, 2, true), (4, 2, true), (5, 2, false);

INSERT INTO public.materials (session_id, title, type, url) VALUES
(1, '8-Layer Architecture Slides', 'slides', 'https://docs.google.com/presentation/...'),
(1, 'Class Recording - 01 Apr', 'recording', 'https://youtube.com/...');
