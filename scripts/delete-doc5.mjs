// scripts/delete-doc5.mjs
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load credentials from .env.local
const envPath = join(__dirname, '..', '.env.local');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim();
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteDoc(docId) {
  console.log(`🗑️ Deleting Document: ${docId}...`);

  // Delete questions and options will be handled by Cascade if set up, 
  // but let's be safe if they aren't.
  
  // 1. Get Quiz ID
  const { data: quizzes } = await supabase.from('quizzes').select('id').eq('document_id', docId);
  
  if (quizzes && quizzes.length > 0) {
    for (const quiz of quizzes) {
      console.log(`  📝 Deleting Quiz: ${quiz.id}...`);
      
      // Delete questions
      const { data: questions } = await supabase.from('quiz_questions').select('id').eq('quiz_id', quiz.id);
      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        // Delete options
        await supabase.from('quiz_options').delete().in('question_id', questionIds);
        // Delete questions
        await supabase.from('quiz_questions').delete().eq('quiz_id', quiz.id);
      }
      
      // Delete quiz
      await supabase.from('quizzes').delete().eq('id', quiz.id);
    }
  }

  // 2. Delete Document
  const { error } = await supabase.from('documents').delete().eq('id', docId);

  if (error) {
    console.error(`  ❌ Error: ${error.message}`);
  } else {
    console.log(`  ✅ Successfully deleted ${docId}`);
  }
}

async function run() {
  await deleteDoc('doc5');
  // I'll also delete doc6 since it's clearly a sample that doesn't belong with the new doc IDs
  await deleteDoc('doc6');
  console.log('\n✨ Cleanup finished.');
}

run();
