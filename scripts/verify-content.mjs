// scripts/verify-content.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
  console.log('--- Checking Documents ---');
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('id, title, status, estimated_read_minutes, thumbnail')
    .in('id', ['doc-gioi-thieu', 'doc-van-hoa', 'doc-so-do-to-chuc']);

  if (docErr) console.error('Error docs:', docErr.message);
  else console.table(docs);

  console.log('--- Checking Quizzes ---');
  const { data: quizzes, error: qErr } = await supabase
    .from('quizzes')
    .select('id, title, document_id, passing_score')
    .in('id', ['quiz-gioi-thieu', 'quiz-van-hoa', 'quiz-so-do-to-chuc']);

  if (qErr) console.error('Error quizzes:', qErr.message);
  else console.table(quizzes);

  console.log('--- Checking Quiz Questions Count ---');
  const { data: questions, error: questErr } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id')
    .in('quiz_id', ['quiz-gioi-thieu', 'quiz-van-hoa', 'quiz-so-do-to-chuc']);

  if (questErr) console.error('Error questions:', questErr.message);
  else {
    const counts = questions.reduce((acc, q) => {
      acc[q.quiz_id] = (acc[q.quiz_id] || 0) + 1;
      return acc;
    }, {});
    console.log('Question counts:', counts);
  }
}

verify();
