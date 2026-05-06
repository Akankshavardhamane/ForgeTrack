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

async function autoConfirmStudents() {
  console.log('Fetching students from public.students...');
  
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('*');

  if (fetchError) {
    console.error('Error fetching students:', fetchError);
    return;
  }

  console.log('Fetching existing Auth users...');
  const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  
  if (listUsersError) {
    console.error('Error listing users:', listUsersError);
    return;
  }

  const existingUsersMap = new Map();
  for (const u of users) {
    existingUsersMap.set(u.email, u.id);
  }

  console.log(`Processing ${students.length} students...`);

  for (const student of students) {
    const email = `${student.usn}@forgetrack.com`;
    const password = student.usn;

    if (existingUsersMap.has(email)) {
      // User exists, just auto-confirm their email
      const userId = existingUsersMap.get(email);
      console.log(`User ${email} already exists. Auto-confirming email...`);
      
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true
      });
      
      if (error) {
        console.error(`  - Error confirming ${email}:`, error.message);
      } else {
        console.log(`  - Successfully confirmed ${email}.`);
      }
    } else {
      // User doesn't exist, create them as confirmed
      console.log(`Creating and confirming user ${email}...`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) {
        console.error(`  - Error creating ${email}:`, error.message);
      } else {
        console.log(`  - Successfully created ${email}.`);
      }
    }
  }
  
  console.log('Admin seeding and auto-confirmation complete!');
}

autoConfirmStudents();
