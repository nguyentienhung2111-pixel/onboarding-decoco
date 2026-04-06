import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkOrgData() {
  const [dept, teams, pos] = await Promise.all([
    supabase.from('departments').select('*'),
    supabase.from('teams').select('*'),
    supabase.from('positions').select('*'),
  ]);

  console.log('Departments:', dept.data?.length || 0);
  console.table(dept.data);
  
  console.log('Teams:', teams.data?.length || 0);
  console.table(teams.data);
  
  console.log('Positions:', pos.data?.length || 0);
  console.table(pos.data);
}

checkOrgData();
