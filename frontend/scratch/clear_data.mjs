import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase Service Role credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function clearData() {
  console.log('Clearing all attendance records...');
  await supabase.from('attendance').delete().neq('id', 0);
  
  console.log('Clearing all sessions...');
  await supabase.from('sessions').delete().neq('id', 0);
  
  console.log('Clearing all students...');
  await supabase.from('students').delete().neq('id', 0);
  
  console.log('Clearing all materials...');
  await supabase.from('materials').delete().neq('id', 0);

  console.log('Clearing all import logs...');
  await supabase.from('import_log').delete().neq('id', 0);

  console.log('Data cleared successfully!');
}

clearData();
