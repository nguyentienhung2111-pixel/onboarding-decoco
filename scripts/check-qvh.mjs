import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mwrtvvfpgkivhxohxatz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM'
);

async function main() {
  // Check if qvh_1 exists and what quiz_id it belongs to
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .like('id', 'qvh_%');
  
  if (error) { console.error('Error:', error); return; }
  
  console.log(`Found ${data.length} questions with id like qvh_%`);
  for (const q of data) {
    console.log(`  ${q.id} | quiz_id: ${q.quiz_id} | ${q.question_text?.substring(0, 50)}`);
  }

  // Also check if questions exist with q2_ prefix (from old seed data)
  const { data: data2 } = await supabase
    .from('quiz_questions')
    .select('*')
    .like('id', 'q2_%');
  
  console.log(`\nFound ${data2?.length || 0} questions with id like q2_%`);
  for (const q of (data2 || [])) {
    console.log(`  ${q.id} | quiz_id: ${q.quiz_id} | ${q.question_text?.substring(0, 50)}`);
  }
}

main().catch(console.error);
