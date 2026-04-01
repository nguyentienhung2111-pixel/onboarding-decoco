// scripts/migrate-data.mjs
// Chạy bằng: node scripts/migrate-data.mjs

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ĐỔI 2 GIÁ TRI NÀY
const SUPABASE_URL = 'https://mwrtvvfpgkivhxohxatz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrate() {
  console.log('🚀 Bắt đầu migrate toàn bộ dữ liệu...\n');

  // 1. Departments, Teams, Positions
  const orgData = JSON.parse(readFileSync('src/data/departments.json', 'utf-8'));
  
  console.log('🏢 Đang nhập Departments...');
  for (const dept of orgData.departments) {
    const { error } = await supabase.from('departments').upsert({
      id: dept.id,
      name: dept.name,
      sort_order: dept.sortOrder
    });
    if (error) console.error(`  ❌ ${dept.name}:`, error.message);
  }

  console.log('👥 Đang nhập Teams...');
  for (const team of orgData.teams) {
    const { error } = await supabase.from('teams').upsert({
      id: team.id,
      name: team.name,
      department_id: team.departmentId,
      sort_order: team.sortOrder
    });
    if (error) console.error(`  ❌ ${team.name}:`, error.message);
  }

  console.log('📍 Đang nhập Positions...');
  for (const pos of orgData.positions) {
    const { error } = await supabase.from('positions').upsert({
      id: pos.id,
      name: pos.name,
      department_id: pos.departmentId,
      team_id: pos.teamId,
      employment_type: pos.employmentType,
      sort_order: pos.sortOrder
    });
    if (error) console.error(`  ❌ ${pos.name}:`, error.message);
  }

  // 2. Users
  const users = JSON.parse(readFileSync('src/data/users.json', 'utf-8'));
  console.log(`\n👤 Đang nhập ${users.length} người dùng...`);
  for (const user of users) {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      password_hash: user.password, // Plaintext initially as per guide
      full_name: user.fullName,
      role: user.role,
      department_id: user.departmentId,
      team_id: user.teamId,
      position_id: user.positionId,
      employment_type: user.employmentType,
      status: user.status,
      avatar_url: user.avatarUrl,
      onboarding_start_date: user.onboardingStartDate,
      onboarding_complete_date: user.onboardingCompleteDate,
      created_at: user.createdAt
    });
    if (error) console.error(`  ❌ ${user.email}:`, error.message);
    else console.log(`  ✅ ${user.email}`);
  }

  // 3. Documents
  const docs = JSON.parse(readFileSync('src/data/documents.json', 'utf-8'));
  console.log(`\n📄 Đang nhập ${docs.length} tài liệu...`);
  for (const doc of docs) {
    const { error } = await supabase.from('documents').upsert({
      id: doc.id,
      title: doc.title,
      doc_type: doc.docType,
      status: doc.status,
      sort_order: doc.sortOrder,
      estimated_read_minutes: doc.estimatedReadMinutes,
      thumbnail: doc.thumbnail,
      summary: doc.summary,
      content_html: doc.contentHtml,
      is_general: doc.assignedTo?.isGeneral || false,
      assigned_department_id: doc.assignedTo?.departmentId || null,
      assigned_team_id: doc.assignedTo?.teamId || null,
      assigned_position_id: doc.assignedTo?.positionId || null,
      created_at: doc.createdAt,
    });
    if (error) console.error(`  ❌ ${doc.title}:`, error.message);
    else console.log(`  ✅ ${doc.title}`);
  }

  // 4. Quizzes + Questions + Options
  const quizzes = JSON.parse(readFileSync('src/data/quizzes.json', 'utf-8'));
  console.log(`\n📝 Đang nhập ${quizzes.length} bài quiz...`);
  for (const quiz of quizzes) {
    const { error: qErr } = await supabase.from('quizzes').upsert({
      id: quiz.id,
      document_id: quiz.documentId,
      title: quiz.title,
      passing_score: quiz.passingScore,
      time_limit_minutes: quiz.timeLimitMinutes,
      is_active: quiz.isActive,
    });
    if (qErr) { console.error(`  ❌ Quiz ${quiz.title}:`, qErr.message); continue; }
    console.log(`  ✅ ${quiz.title}`);

    for (let qi = 0; qi < quiz.questions.length; qi++) {
      const q = quiz.questions[qi];
      const { error: questErr } = await supabase.from('quiz_questions').upsert({
        id: q.id,
        quiz_id: quiz.id,
        question_text: q.questionText,
        question_type: q.questionType,
        explanation: q.explanation,
        sort_order: qi,
      });
      if (questErr) { console.error(`    ❌ Câu ${q.id}:`, questErr.message); continue; }

      const options = q.options.map((o, oi) => ({
        id: o.id,
        question_id: q.id,
        text: o.text,
        is_correct: o.isCorrect,
        sort_order: oi,
      }));
      const { error: optErr } = await supabase.from('quiz_options').upsert(options);
      if (optErr) console.error(`    ❌ Options ${q.id}:`, optErr.message);
    }
  }

  // 5. Progress
  const progress = JSON.parse(readFileSync('src/data/progress.json', 'utf-8'));
  console.log(`\n📊 Đang nhập ${progress.length} bản ghi tiến độ...`);
  for (const p of progress) {
    const { error } = await supabase.from('user_progress').upsert({
      id: p.id,
      user_id: p.userId,
      document_id: p.documentId,
      status: p.status,
      read_percentage: p.readPercentage,
      marked_as_read: p.markedAsRead,
      started_at: p.startedAt,
      read_at: p.readAt,
      quiz_passed_at: p.quizPassedAt,
    });
    if (error) console.error(`  ❌ ${p.id}:`, error.message);
    else console.log(`  ✅ ${p.userId} → ${p.documentId}`);
  }

  console.log('\n🎉 Migrate hoàn tất!');
}

migrate().catch(console.error);
