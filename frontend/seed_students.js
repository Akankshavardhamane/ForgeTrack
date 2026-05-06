import { createClient } from '@supabase/supabase-js';

// process.env is populated by --env-file


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedStudents() {
  console.log('Fetching students from public.students...');
  
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('*');

  if (fetchError) {
    console.error('Error fetching students:', fetchError);
    return;
  }

  console.log(`Found ${students.length} students. Seeding auth accounts...`);

  for (const student of students) {
    const email = `${student.usn}@forgetrack.com`;
    const password = student.usn;

    console.log(`Signing up ${student.name} (${email})...`);
    
    // We use signUp here. If the user already exists, it will return an error or skip.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  - User ${email} already exists.`);
      } else {
        console.error(`  - Error signing up ${email}:`, error.message);
      }
    } else {
      console.log(`  - Successfully seeded ${email}.`);
    }
  }
  
  console.log('Seeding complete!');
}

seedStudents();
