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

async function fixUsers() {
  console.log('Fetching students from public.students...');
  
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('*');

  if (fetchError) {
    console.error('Error fetching students:', fetchError);
    return;
  }

  for (const student of students) {
    const email = `${student.usn}@forgetrack.com`.toLowerCase();

    console.log(`Fixing public.users for ${email}...`);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'student',
        student_id: student.id,
        display_name: student.name
      })
      .ilike('email', email); // Use ilike just in case of case-mismatch

    if (updateError) {
      console.error(`  - Error updating ${email}:`, updateError.message);
    } else {
      console.log(`  - Successfully updated ${email} to student role.`);
    }
  }
  
  console.log('User fix complete!');
}

fixUsers();
