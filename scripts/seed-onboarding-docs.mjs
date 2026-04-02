// scripts/seed-onboarding-docs.mjs
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..'); // e:\Obsidian Data\Onboarding DECOCO App

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

function parseMarkdown(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  // Extract metadata
  const idMatch = content.match(/\*\*ID:\*\* `(.+?)`/);
  const typeMatch = content.match(/\*\*Loại:\*\* (.+?)(?:\s|\n|$)/);
  const timeMatch = content.match(/\*\*Thời gian đọc:\*\* (\d+)/);
  const emojiMatch = content.match(/\*\*Emoji:\*\* (.+?)(?:\n|$)/);
  const summaryMatch = content.match(/\*\*Tóm tắt:\*\* (.+?)(?:\n|$)/);
  
  // Extract HTML
  const htmlMatch = content.match(/```html\n([\s\S]+?)\n```/);
  
  // Extract Quiz JSON
  const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);

  return {
    doc: {
      id: idMatch ? idMatch[1] : null,
      title: content.split('\n')[0].replace('# ', '').replace('Tài liệu 1: ', '').replace('Tài liệu 2: ', '').trim(),
      docType: typeMatch ? typeMatch[1] : 'general',
      estimatedReadMinutes: timeMatch ? parseInt(timeMatch[1], 10) : 5,
      thumbnail: emojiMatch ? emojiMatch[1].trim() : '📄',
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      contentHtml: htmlMatch ? htmlMatch[1].trim() : '',
      status: 'published'
    },
    quiz: jsonMatch ? JSON.parse(jsonMatch[1]) : null
  };
}

async function uploadDocAndQuiz(data) {
  const { doc, quiz } = data;
  if (!doc.id) {
    console.warn(`⚠️ Skipped: ID not found for document.`);
    return;
  }

  console.log(`🚀 Uploading Document: ${doc.title} (${doc.id})...`);
  
  const { error: docError } = await supabase.from('documents').upsert({
    id: doc.id,
    title: doc.title,
    doc_type: doc.docType,
    status: doc.status,
    estimated_read_minutes: doc.estimatedReadMinutes,
    thumbnail: doc.thumbnail,
    summary: doc.summary,
    content_html: doc.contentHtml,
    is_general: true,
    sort_order: doc.id === 'doc-gioi-thieu' ? 1 : 2,
    created_at: new Date().toISOString()
  });

  if (docError) {
    console.error(`  ❌ Document Error: ${docError.message}`);
    return;
  }
  console.log(`  ✅ Document uploaded.`);

  if (quiz) {
    console.log(`  📝 Uploading Quiz: ${quiz.title}...`);
    const { error: quizError } = await supabase.from('quizzes').upsert({
      id: quiz.quizId,
      document_id: quiz.documentId,
      title: quiz.title,
      passing_score: quiz.passingScore,
      is_active: true
    });

    if (quizError) {
      console.error(`    ❌ Quiz Error: ${quizError.message}`);
      return;
    }

    // Upsert questions
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const { error: qError } = await supabase.from('quiz_questions').upsert({
        id: q.id,
        quiz_id: quiz.quizId,
        question_text: q.questionText,
        question_type: q.questionType,
        explanation: q.explanation,
        sort_order: i
      });

      if (qError) {
        console.error(`    ❌ Question ${q.id} Error: ${qError.message}`);
        continue;
      }

      // Upsert options
      const options = q.options.map((o, index) => ({
        id: o.id,
        question_id: q.id,
        text: o.text,
        is_correct: o.isCorrect,
        sort_order: index
      }));

      const { error: oError } = await supabase.from('quiz_options').upsert(options);
      if (oError) {
        console.error(`    ❌ Options for Question ${q.id} Error: ${oError.message}`);
      }
    }
    console.log(`  ✅ Quiz uploaded with ${quiz.questions.length} questions.`);
  }
}

async function run() {
  const files = [
    join(ROOT_DIR, 'docs', 'Doc1_Gioi_Thieu_DECOCO.md'),
    join(ROOT_DIR, 'docs', 'Doc2_Van_Hoa_Cong_Ty.md'),
    join(ROOT_DIR, 'docs', 'Doc3_So_Do_To_Chuc_Phong_Ban.md')
  ];

  for (const file of files) {
    if (existsSync(file)) {
      try {
        const data = parseMarkdown(file);
        await uploadDocAndQuiz(data);
      } catch (err) {
        console.error(`❌ Error processing ${file}: ${err.message}`);
      }
    } else {
      console.warn(`⚠️ File not found: ${file}`);
    }
  }

  console.log('\n🎉 Finished seeding onboarding docs.');
}

run();
