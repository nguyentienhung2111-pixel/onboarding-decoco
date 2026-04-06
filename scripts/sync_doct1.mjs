import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

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
      title: content.split('\n')[0].replace('# ', '').trim(),
      docType: typeMatch ? typeMatch[1] : 'team',
      estimatedReadMinutes: timeMatch ? parseInt(timeMatch[1], 10) : 15,
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
    is_general: false,
    assigned_team_id: 'team1', // Team Content
    sort_order: 101, // DocT1 sort order
    created_at: new Date().toISOString()
  });

  if (docError) {
    console.error(`  ❌ Document Error: ${docError.message}`);
    return;
  }
  console.log(`  ✅ Document updated.`);

  if (quiz) {
    console.log(`  📝 Uploading Quiz: ${quiz.title}...`);
    try {
      const { data: quizData, error: quizError } = await supabase.from('quizzes').upsert({
        id: quiz.quizId,
        document_id: quiz.documentId,
        title: quiz.title,
        passing_score: quiz.passingScore,
        is_active: true
      }).select();

      if (quizError) {
        console.error(`    ❌ Quiz Error: ${quizError.message}`);
        return;
      }
      console.log(`    ✅ Quiz upserted.`);

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

        const options = q.options.map((o, index) => ({
          id: o.id,
          question_id: q.id,
          text: o.text,
          is_correct: o.isCorrect,
          sort_order: index
        }));

        await supabase.from('quiz_options').upsert(options);
      }
      console.log(`  ✅ Quiz uploaded with ${quiz.questions.length} questions.`);
    } catch (e) {
      console.error(`    💥 Exception while uploading quiz: ${e.message}`);
    }
  }
}

const docPath = 'e:\\Obsidian Data\\Onboarding DECOCO App\\docs\\Team Content\\DocT1_Content_San_Xuat_Video_TikTok.md';
if (existsSync(docPath)) {
  const data = parseMarkdown(docPath);
  uploadDocAndQuiz(data).then(() => console.log('🎉 Done.'));
} else {
  console.error('File not found:', docPath);
}
