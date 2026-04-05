// scripts/delete-doc3.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteDoc3() {
  const id = 'doc3';
  console.log(`🚀 Deleting document ${id}...`);
  
  // Progress
  await supabase.from('user_progress').delete().eq('document_id', id);
  
  // Quiz
  const { data: quiz } = await supabase.from('quizzes').select('id').eq('document_id', id).single();
  if (quiz) {
    const { data: questions } = await supabase.from('quiz_questions').select('id').eq('quiz_id', quiz.id);
    if (questions?.length > 0) {
      await supabase.from('quiz_options').delete().in('question_id', questions.map(q => q.id));
      await supabase.from('quiz_questions').delete().eq('quiz_id', quiz.id);
    }
    await supabase.from('quizzes').delete().eq('id', quiz.id);
  }

  // Doc
  const { error } = await supabase.from('documents').delete().eq('id', id);
  
  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ doc3 deleted successfully.');
}

deleteDoc3();
