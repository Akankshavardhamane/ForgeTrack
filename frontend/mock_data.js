import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase Service Role credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function populateMockData() {
  console.log('Populating mock data for Student Dashboard...');

  // Create 13 new mock sessions (so we have ~17 total)
  const newSessions = [];
  for (let i = 0; i < 13; i++) {
    newSessions.push({
      date: new Date(2026, 3, i + 15).toISOString().split('T')[0], // April 2026 dates, starting from 15th to avoid conflict
      topic: `Mock Session ${i + 1}`,
      session_type: i % 3 === 0 ? 'lab' : 'lecture',
      month_number: 4,
      duration_hours: 2.0
    });
  }

  const { data: insertedSessions, error: sessionError } = await supabase
    .from('sessions')
    .upsert(newSessions, { onConflict: 'date' })
    .select('id');

  if (sessionError) {
    console.error('Error inserting sessions:', sessionError);
    return;
  }

  // Fetch all session ids to make sure we have enough
  const { data: allSessions } = await supabase.from('sessions').select('id');
  const allIds = allSessions.map(s => s.id);

  // We want the student (id: 6) to have exactly 12 present and 5 absent out of 17.
  // We'll just delete existing attendance for student 6 to ensure exact numbers.
  await supabase.from('attendance').delete().eq('student_id', 6);

  // Create attendance for exactly 17 sessions (12 present, 5 absent)
  const attendanceRecords = [];
  const selectedIds = allIds.slice(0, Math.min(17, allIds.length));

  for (let i = 0; i < selectedIds.length; i++) {
    attendanceRecords.push({
      student_id: 6, // Rahul K
      session_id: selectedIds[i],
      present: i < 12 // first 12 are true, rest false
    });
  }

  const { error: attError } = await supabase
    .from('attendance')
    .insert(attendanceRecords);

  if (attError) {
    console.error('Error inserting attendance:', attError);
    return;
  }

  // Create some learning materials linked to sessions
  const materials = [
    { session_id: allIds[0], title: 'Slides: Python Basics', url: '#', type: 'slides', description: 'Intro to Python' },
    { session_id: allIds[1], title: 'Slides: Data Structures', url: '#', type: 'slides', description: 'Arrays and Linked Lists' },
    { session_id: allIds[2], title: 'Lab Guide: Database Workshop', url: '#', type: 'document', description: 'SQL Queries' }
  ];

  await supabase.from('materials').delete().neq('id', 0); // clear existing
  const { error: matError } = await supabase.from('materials').insert(materials);

  if (matError) {
    console.error('Error inserting materials:', matError);
  } else {
    console.log('Successfully populated mock data! Attendance and materials added.');
  }
}

populateMockData();
