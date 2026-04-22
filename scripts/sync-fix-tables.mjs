// scripts/sync-fix-tables.mjs
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

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
  console.error('❌ Credentials not found in .env.local. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
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

  const docTypeRaw = typeMatch ? typeMatch[1].toLowerCase() : 'general';
  
  return {
    doc: {
      id: idMatch ? idMatch[1] : null,
      title: content.split('\n')[0].replace('# ', '').replace(/Tài liệu [^:]+: /, '').trim(),
      docType: docTypeRaw.includes('team') ? 'team' : (docTypeRaw.includes('department') ? 'department' : 'general'),
      estimatedReadMinutes: timeMatch ? parseInt(timeMatch[1], 10) : 5,
      thumbnail: emojiMatch ? emojiMatch[1].trim() : '📄',
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      contentHtml: htmlMatch ? htmlMatch[1].trim() : '',
      status: 'published'
    },
    quiz: jsonMatch ? JSON.parse(jsonMatch[1]) : null,
    filePath
  };
}

async function uploadDocAndQuiz(data) {
  const { doc, quiz, filePath } = data;
  if (!doc.id) {
    console.warn(`⚠️ Skipped: ID not found for ${filePath}`);
    return;
  }

  console.log(`🚀 Syncing: ${doc.title} (${doc.id})...`);
  
  const isGeneral = true; // For Docs 1-4, these are all general

  const { error: docError } = await supabase.from('documents').upsert({
    id: doc.id,
    title: doc.title,
    doc_type: doc.docType,
    status: doc.status,
    estimated_read_minutes: doc.estimatedReadMinutes,
    thumbnail: doc.thumbnail,
    summary: doc.summary,
    content_html: doc.contentHtml,
    is_general: isGeneral,
    sort_order: {
      'doc-gioi-thieu': 1,
      'doc-van-hoa': 2,
      'doc-so-do-to-chuc': 3,
      'doc-noi-quy-chung': 4
    }[doc.id] || 999,
    updated_at: new Date().toISOString()
  });

  if (docError) {
    console.error(`  ❌ Document Error: ${docError.message}`);
    return;
  }

  if (quiz) {
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
        await supabase.from('quiz_questions').upsert({
          id: q.id,
          quiz_id: quiz.quizId,
          question_text: q.questionText,
          question_type: q.questionType,
          explanation: q.explanation,
          sort_order: i
        });
  
        // Upsert options
        const options = q.options.map((o, index) => ({
          id: o.id,
          question_id: q.id,
          text: o.text,
          is_correct: o.isCorrect,
          sort_order: index
        }));
  
        await supabase.from('quiz_options').upsert(options);
    }
  }
  console.log(`  ✅ Done.`);
}

async function run() {
  const docsToSync = [
    'Doc1_Gioi_Thieu_DECOCO.md',
    'Doc2_Van_Hoa_Cong_Ty.md',
    'Doc3_So_Do_To_Chuc_Phong_Ban.md',
    'Doc4_Noy_Quy_Chung.md' // Wait, let me check the file name for Doc 4
  ];

  // Actually, I'll use the correct names from the directory listing.
  const targetFiles = [
    join(ROOT_DIR, 'docs', 'Doc1_Gioi_Thieu_DECOCO.md'),
    join(ROOT_DIR, 'docs', 'Doc2_Van_Hoa_Cong_Ty.md'),
    join(ROOT_DIR, 'docs', 'Doc3_So_Do_To_Chuc_Phong_Ban.md'),
    join(ROOT_DIR, 'docs', 'Doc4_Noi_Quy_Chung.md')
  ];

  console.log('🔄 Starting focused sync for Docs 1-4... \n');

  for (const file of targetFiles) {
    if (existsSync(file)) {
      try {
        const data = parseMarkdown(file);
        await uploadDocAndQuiz(data);
      } catch (err) {
        console.error(`❌ Error processing ${file}: ${err.message}`);
      }
    } else {
      console.error(`❌ File not found: ${file}`);
    }
  }

  console.log('\n🎉 Finished updating Docs 1-4 to Supabase.');
}

run();
