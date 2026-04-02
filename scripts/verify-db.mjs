import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUsers() {
  console.log('Checking users in Supabase...');
  const { data, error } = await supabase.from('users').select('id, email, password_hash, full_name, role');
  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log('No users found in the "users" table.');
  } else {
    console.log(`Found ${data.length} users:`);
    console.table(data);
  }
}

checkUsers();
