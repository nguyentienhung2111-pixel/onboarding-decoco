import { createServerClient } from './supabase';
import type {
  User, Document, Quiz, QuizQuestion, QuizOption,
  UserProgress, QuizAttempt, OrgData, Department, Team, Position
} from './types';

function supabase() {
  return createServerClient();
}

// ============ USERS ============

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase()
    .from('users')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data.map(mapUser);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabase()
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return mapUser(data);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabase()
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error || !data) return undefined;
  return mapUser(data);
}

// Map database snake_case → code camelCase
function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    password: row.password_hash as string,
    fullName: row.full_name as string,
    role: row.role as User['role'],
    departmentId: row.department_id as string | null,
    teamId: row.team_id as string | null,
    positionId: row.position_id as string | null,
    employmentType: row.employment_type as User['employmentType'],
    status: row.status as User['status'],
    avatarUrl: row.avatar_url as string | null,
    onboardingStartDate: row.onboarding_start_date as string,
    onboardingCompleteDate: row.onboarding_complete_date as string | null,
    createdAt: row.created_at as string,
  };
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const { error } = await supabase()
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', userId);
  if (error) throw error;
}

// ============ ORG ============

export async function getOrgData(): Promise<OrgData> {
  const [deptRes, teamRes, posRes] = await Promise.all([
    supabase().from('departments').select('*').order('sort_order'),
    supabase().from('teams').select('*').order('sort_order'),
    supabase().from('positions').select('*').order('sort_order'),
  ]);
  return {
    departments: (deptRes.data || []).map((d): Department => ({
      id: d.id, name: d.name, sortOrder: d.sort_order,
    })),
    teams: (teamRes.data || []).map((t): Team => ({
      id: t.id, name: t.name, departmentId: t.department_id, sortOrder: t.sort_order,
    })),
    positions: (posRes.data || []).map((p): Position => ({
      id: p.id, name: p.name, departmentId: p.department_id,
      teamId: p.team_id, employmentType: p.employment_type, sortOrder: p.sort_order,
    })),
  };
}

// ============ DOCUMENTS ============

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data || []).map(mapDocument);
}

export async function getDocumentById(id: string): Promise<Document | undefined> {
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return mapDocument(data);
}

export async function getDocumentsForUser(user: {
  departmentId: string | null;
  teamId: string | null;
  positionId: string | null;
}): Promise<Document[]> {
  // Lấy tất cả published documents, filter logic ở JS (giống prototype)
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .eq('status', 'published')
    .order('sort_order');
  if (error) throw error;

  return (data || [])
    .filter(doc => {
      if (doc.is_general) return true;
      if (doc.assigned_department_id && doc.assigned_department_id === user.departmentId) return true;
      if (doc.assigned_team_id && doc.assigned_team_id === user.teamId) return true;
      if (doc.assigned_position_id && doc.assigned_position_id === user.positionId) return true;
      return false;
    })
    .map(mapDocument);
}

function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    title: row.title as string,
    docType: row.doc_type as Document['docType'],
    status: row.status as Document['status'],
    sortOrder: row.sort_order as number,
    estimatedReadMinutes: row.estimated_read_minutes as number,
    thumbnail: row.thumbnail as string,
    summary: row.summary as string,
    contentHtml: row.content_html as string,
    assignedTo: {
      isGeneral: row.is_general as boolean,
      departmentId: row.assigned_department_id as string | undefined,
      teamId: row.assigned_team_id as string | undefined,
      positionId: row.assigned_position_id as string | undefined,
    },
    createdAt: row.created_at as string,
  };
}

// ============ QUIZZES ============

export async function getQuizzes(): Promise<Quiz[]> {
  const { data: quizRows, error } = await supabase()
    .from('quizzes')
    .select('*');
  if (error) throw error;

  const quizzes: Quiz[] = [];
  for (const q of quizRows || []) {
    const questions = await getQuizQuestions(q.id);
    quizzes.push({
      id: q.id,
      documentId: q.document_id,
      title: q.title,
      passingScore: q.passing_score,
      timeLimitMinutes: q.time_limit_minutes,
      isActive: q.is_active,
      questions,
    });
  }
  return quizzes;
}

export async function getQuizByDocumentId(docId: string): Promise<Quiz | undefined> {
  const { data, error } = await supabase()
    .from('quizzes')
    .select('*')
    .eq('document_id', docId)
    .single();
  if (error || !data) return undefined;

  const questions = await getQuizQuestions(data.id);
  return {
    id: data.id,
    documentId: data.document_id,
    title: data.title,
    passingScore: data.passing_score,
    timeLimitMinutes: data.time_limit_minutes,
    isActive: data.is_active,
    questions,
  };
}

async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data: qRows } = await supabase()
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order');

  const questions: QuizQuestion[] = [];
  for (const q of qRows || []) {
    const { data: optRows } = await supabase()
      .from('quiz_options')
      .select('*')
      .eq('question_id', q.id)
      .order('sort_order');

    questions.push({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      explanation: q.explanation,
      options: (optRows || []).map((o): QuizOption => ({
        id: o.id, text: o.text, isCorrect: o.is_correct,
      })),
    });
  }
  return questions;
}

// ============ PROGRESS ============

export async function getProgress(): Promise<UserProgress[]> {
  const { data, error } = await supabase()
    .from('user_progress')
    .select('*');
  if (error) throw error;
  return (data || []).map(mapProgress);
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapProgress);
}

export async function getDocProgress(userId: string, documentId: string): Promise<UserProgress | undefined> {
  const { data, error } = await supabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .single();
  if (error || !data) return undefined;
  return mapProgress(data);
}

export async function updateProgress(
  userId: string,
  documentId: string,
  updates: Partial<UserProgress>
): Promise<UserProgress> {
  // Map camelCase updates to snake_case
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.readPercentage !== undefined) dbUpdates.read_percentage = updates.readPercentage;
  if (updates.markedAsRead !== undefined) dbUpdates.marked_as_read = updates.markedAsRead;
  if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
  if (updates.readAt !== undefined) dbUpdates.read_at = updates.readAt;
  if (updates.quizPassedAt !== undefined) dbUpdates.quiz_passed_at = updates.quizPassedAt;

  // Upsert: insert nếu chưa có, update nếu đã tồn tại
  const { data, error } = await supabase()
    .from('user_progress')
    .upsert({
      user_id: userId,
      document_id: documentId,
      status: 'reading',
      read_percentage: 0,
      marked_as_read: false,
      started_at: new Date().toISOString(),
      ...dbUpdates,
    }, {
      onConflict: 'user_id,document_id',
    })
    .select()
    .single();

  if (error) throw error;
  return mapProgress(data);
}

function mapProgress(row: Record<string, unknown>): UserProgress {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    documentId: row.document_id as string,
    status: row.status as UserProgress['status'],
    readPercentage: row.read_percentage as number,
    markedAsRead: row.marked_as_read as boolean,
    startedAt: row.started_at as string | null,
    readAt: row.read_at as string | null,
    quizPassedAt: row.quiz_passed_at as string | null,
  };
}

// ============ QUIZ ATTEMPTS ============

export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  const { data, error } = await supabase()
    .from('quiz_attempts')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAttempt);
}

export async function getUserQuizAttempts(userId: string, documentId?: string): Promise<QuizAttempt[]> {
  let query = supabase()
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId);

  if (documentId) {
    query = query.eq('document_id', documentId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAttempt);
}

export async function addQuizAttempt(attempt: QuizAttempt): Promise<void> {
  // Insert attempt
  const { error: attemptError } = await supabase()
    .from('quiz_attempts')
    .insert({
      id: attempt.id,
      user_id: attempt.userId,
      quiz_id: attempt.quizId,
      document_id: attempt.documentId,
      score: attempt.score,
      correct_count: attempt.correctCount,
      total_questions: attempt.totalQuestions,
      is_passed: attempt.isPassed,
      time_spent_seconds: attempt.timeSpentSeconds,
      submitted_at: attempt.submittedAt,
    });
  if (attemptError) throw attemptError;

  // Insert answers
  if (attempt.answers && attempt.answers.length > 0) {
    const answerRows = attempt.answers.map(a => ({
      attempt_id: attempt.id,
      question_id: a.questionId,
      selected_option_ids: a.selectedOptionIds,
      is_correct: a.isCorrect,
    }));

    const { error: answerError } = await supabase()
      .from('quiz_attempt_answers')
      .insert(answerRows);
    if (answerError) throw answerError;
  }
}

function mapAttempt(row: Record<string, unknown>): QuizAttempt {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    quizId: row.quiz_id as string,
    documentId: row.document_id as string,
    score: row.score as number,
    correctCount: row.correct_count as number,
    totalQuestions: row.total_questions as number,
    isPassed: row.is_passed as boolean,
    timeSpentSeconds: row.time_spent_seconds as number,
    submittedAt: row.submitted_at as string,
    answers: [], // Answers loaded separately if needed
  };
}
