// scripts/sync-doc-t4.mjs — Sync DocT4 (doc-content-product-training) to Supabase
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const filePath = join(__dirname, '..', '..', 'docs', 'Team Content', 'DocT4_Content_Kien_Thuc_San_Pham.md');
const content = readFileSync(filePath, 'utf-8');

const idMatch      = content.match(/\*\*ID:\*\* `(.+?)`/);
const timeMatch    = content.match(/\*\*Thời gian đọc:\*\* (\d+)/);
const emojiMatch   = content.match(/\*\*Emoji:\*\* (.+?)(?:\n|$)/);
const summaryMatch = content.match(/\*\*Tóm tắt:\*\* (.+?)(?:\n|$)/);
const htmlMatch    = content.match(/```html\n([\s\S]+?)\n```/);
const jsonMatch    = content.match(/```json\n([\s\S]+?)\n```/);

const doc = {
  id: idMatch?.[1] ?? 'doc-content-product-training',
  title: 'Kiến thức sản phẩm DECOCO',
  doc_type: 'team',
  status: 'published',
  estimated_read_minutes: timeMatch ? parseInt(timeMatch[1], 10) : 12,
  thumbnail: emojiMatch?.[1].trim() ?? '💎',
  summary: summaryMatch?.[1].trim() ?? '',
  content_html: htmlMatch?.[1].trim() ?? '',
  is_general: false,
  assigned_team_id: 'team1',
  assigned_department_id: 'dept1',
  sort_order: 10,
  updated_at: new Date().toISOString(),
};

console.log(`🚀 Syncing: ${doc.title} (${doc.id})...`);

const { error: docError } = await supabase.from('documents').upsert(doc);
if (docError) {
  console.error('❌ Document Error:', docError.message);
  process.exit(1);
}
console.log('  ✅ Document updated in Supabase.');

// Quiz
if (jsonMatch) {
  const quiz = JSON.parse(jsonMatch[1]);
  const { error: qErr } = await supabase.from('quizzes').upsert({
    id: quiz.quizId,
    document_id: quiz.documentId,
    title: quiz.title,
    passing_score: quiz.passingScore,
    is_active: true,
  });
  if (qErr) { console.error('❌ Quiz Error:', qErr.message); process.exit(1); }

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    await supabase.from('quiz_questions').upsert({
      id: q.id, quiz_id: quiz.quizId,
      question_text: q.questionText, question_type: q.questionType,
      explanation: q.explanation, sort_order: i,
    });
    await supabase.from('quiz_options').upsert(
      q.options.map((o, idx) => ({ id: o.id, question_id: q.id, text: o.text, is_correct: o.isCorrect, sort_order: idx }))
    );
  }
  console.log('  ✅ Quiz updated in Supabase.');
}

console.log('\n🎉 DocT4 synced successfully.');
