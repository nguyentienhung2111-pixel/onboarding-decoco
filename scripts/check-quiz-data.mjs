import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mwrtvvfpgkivhxohxatz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM'
);

async function main() {
  // 1. List all quizzes
  const { data: quizzes, error: qError } = await supabase.from('quizzes').select('*');
  if (qError) { console.error('Quizzes error:', qError); return; }
  console.log('\n=== ALL QUIZZES ===');
  for (const q of quizzes) {
    // Count questions for this quiz
    const { count } = await supabase.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('quiz_id', q.id);
    console.log(`  Quiz: ${q.id} | Doc: ${q.document_id} | Title: ${q.title} | Questions: ${count}`);
  }

  // 2. Check quiz_questions count
  const { count: totalQ } = await supabase.from('quiz_questions').select('*', { count: 'exact', head: true });
  console.log(`\nTotal quiz_questions in DB: ${totalQ}`);

  // 3. Check quiz_options count
  const { count: totalO } = await supabase.from('quiz_options').select('*', { count: 'exact', head: true });
  console.log(`Total quiz_options in DB: ${totalO}`);

  // 4. List all documents
  const { data: docs } = await supabase.from('documents').select('id, title').order('sort_order');
  console.log('\n=== ALL DOCUMENTS ===');
  for (const d of docs) {
    console.log(`  ${d.id} - ${d.title}`);
  }
}

main().catch(console.error);
