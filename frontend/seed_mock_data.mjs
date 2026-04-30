import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhbfctdliqxrzjbvqcgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYmZjdGRsaXF4cnpqYnZxY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Mzk2NjEsImV4cCI6MjA5MzExNTY2MX0.bhqYmoV6B0NnRX700NTpw7H9SdOuHwkHnw1vwlKBL0U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Clearing old test data...');
  // Optional: clear data if you want fresh
  
  console.log('Inserting mock students...');
  const { data: students, error: studentErr } = await supabase.from('students').upsert([
    { name: 'Rahul K', usn: '4SH24CS001', email: 'rahul@forgetrack.com', branch_code: 'CS', admission_number: '24CS001' },
    { name: 'Sneha Rao', usn: '4SH24CS002', email: 'sneha@forgetrack.com', branch_code: 'AI', admission_number: '24CS002' },
    { name: 'Amitabh B', usn: '4SH24CS003', email: 'amitabh@forgetrack.com', branch_code: 'CS', admission_number: '24CS003' },
    { name: 'Priya M', usn: '4SH24IS004', email: 'priya@forgetrack.com', branch_code: 'IS', admission_number: '24IS004' },
    { name: 'Arjun Reddy', usn: '4SH24CS005', email: 'arjun@forgetrack.com', branch_code: 'CS', admission_number: '24CS005' },
    ...Array.from({ length: 20 }).map((_, i) => ({
      name: `Student ${i+6}`, usn: `4SH24CS0${i+6 < 10 ? '0'+(i+6) : i+6}`, email: `student${i+6}@forgetrack.com`, branch_code: 'CS', admission_number: `24CS0${i+6}`
    }))
  ], { onConflict: 'usn' }).select();

  if (studentErr) console.error('Error inserting students:', studentErr);

  console.log('Inserting sessions (including one for today)...');
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: sessions, error: sessionErr } = await supabase.from('sessions').insert([
    { date: lastWeek, topic: 'Introduction to React', month_number: 4, session_type: 'offline', duration_hours: 2 },
    { date: today, topic: 'Agentic Workflows', month_number: 4, session_type: 'online', duration_hours: 2 },
  ]).select();

  if (sessionErr) console.error('Error inserting sessions:', sessionErr);

  if (sessions && students) {
    console.log('Inserting attendance for today...');
    const todaySession = sessions.find(s => s.date === today);
    
    // Mark everyone present except first 3
    const attendanceRecords = students.map((s, index) => ({
      session_id: todaySession.id,
      student_id: s.id,
      present: index > 2 // first 3 are absent (Rahul, Sneha, Amitabh)
    }));

    const { error: attErr } = await supabase.from('attendance').upsert(attendanceRecords);
    if (attErr) console.error('Error inserting attendance:', attErr);
    else console.log('Mock Data Seeded Successfully!');
  }
}

seed();
