// scripts/delete-sample-docs.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteSampleData() {
  const docIds = ['doc1', 'doc2', 'doc4'];
  const quizIds = ['quiz1', 'quiz2', 'quiz4'];

  console.log('🚀 Starting cleanup of sample data...');

  // Delete Progress
  console.log('  🗑️ Deleting user progress...');
  await supabase.from('user_progress').delete().in('document_id', docIds);

  // Delete Options
  console.log('  🗑️ Deleting quiz options...');
  const { data: questions } = await supabase.from('quiz_questions').select('id').in('quiz_id', quizIds);
  if (questions?.length > 0) {
    await supabase.from('quiz_options').delete().in('question_id', questions.map(q => q.id));
  }

  // Delete Questions
  console.log('  🗑️ Deleting quiz questions...');
  await supabase.from('quiz_questions').delete().in('quiz_id', quizIds);

  // Delete Quizzes
  console.log('  🗑️ Deleting quizzes...');
  await supabase.from('quizzes').delete().in('id', quizIds);

  // Delete Documents
  console.log('  🗑️ Deleting documents...');
  const { error: docError } = await supabase.from('documents').delete().in('id', docIds);

  if (docError) {
    console.error('  ❌ Error deleting documents:', docError.message);
  } else {
    console.log('  ✅ Cleanup complete.');
  }

  console.log('\n--- Final Verification ---');
  const { data: remainingDocs } = await supabase.from('documents').select('id, title').in('id', docIds);
  if (remainingDocs?.length === 0) {
    console.log('  🎉 All specified sample documents are gone!');
  } else {
    console.warn(`  ⚠️ Some documents still exist: ${remainingDocs.map(d => d.id).join(', ')}`);
  }
}

deleteSampleData();
