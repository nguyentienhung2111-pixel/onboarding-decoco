import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

if (readFileSync(envPath, 'utf8')) {
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchQuiz() {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('document_id', 'doc-content-san-xuat-video')
    .single();

  if (quizError) {
    console.error('❌ Error fetching quiz:', quizError.message);
    return;
  }

  // Format back to the JSON structure I use in MD files
  const formattedQuiz = {
    quizId: quiz.id,
    documentId: quiz.document_id,
    title: quiz.title,
    passingScore: quiz.passing_score,
    questions: quiz.quiz_questions.map(q => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      explanation: q.explanation,
      options: q.quiz_options.map(o => ({
        id: o.id,
        text: o.text,
        isCorrect: o.is_correct
      }))
    }))
  };

  writeFileSync('recovered_quiz.json', JSON.stringify(formattedQuiz, null, 2));
  console.log('✅ Quiz recovered and saved to recovered_quiz.json');
}

fetchQuiz();
