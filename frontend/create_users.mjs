import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhbfctdliqxrzjbvqcgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYmZjdGRsaXF4cnpqYnZxY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Mzk2NjEsImV4cCI6MjA5MzExNTY2MX0.bhqYmoV6B0NnRX700NTpw7H9SdOuHwkHnw1vwlKBL0U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function create() {
  console.log('Creating Mentor user (mentor@forgetrack.com / password123)...');
  const { data: mentor, error: mErr } = await supabase.auth.signUp({
    email: 'mentor@forgetrack.com',
    password: 'password123'
  });
  
  if (mErr) console.error('Mentor Error:', mErr.message);
  else console.log('Mentor created successfully! (Please check if email confirmation is required)');

  console.log('\nCreating Student user (4SH24CS001@forgetrack.com / 4SH24CS001)...');
  const { data: student, error: sErr } = await supabase.auth.signUp({
    email: '4SH24CS001@forgetrack.com',
    password: '4SH24CS001'
  });
  
  if (sErr) console.error('Student Error:', sErr.message);
  else console.log('Student created successfully! (Please check if email confirmation is required)');
}

create();
