// Type definitions for DECOCO Onboarding

export type Role = 'user' | 'manager' | 'admin';
export type EmploymentType = 'full_time' | 'part_time';
export type UserStatus = 'active' | 'inactive' | 'onboarding' | 'completed';
export type DocType = 'general' | 'department' | 'team' | 'position';
export type DocStatus = 'draft' | 'published' | 'archived';
export type ProgressStatus = 'not_started' | 'reading' | 'read' | 'quiz_passed';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  teamId: string | null;
  positionId: string | null;
  employmentType: EmploymentType;
  status: UserStatus;
  avatarUrl: string | null;
  onboardingStartDate: string;
  onboardingCompleteDate: string | null;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  sortOrder: number;
}

export interface Position {
  id: string;
  name: string;
  departmentId: string;
  teamId: string | null;
  employmentType: EmploymentType;
  sortOrder: number;
}

export interface OrgData {
  departments: Department[];
  teams: Team[];
  positions: Position[];
}

export interface DocumentAssignment {
  isGeneral?: boolean;
  departmentId?: string;
  teamId?: string;
  positionId?: string;
}

export interface Document {
  id: string;
  title: string;
  docType: DocType;
  status: DocStatus;
  sortOrder: number;
  estimatedReadMinutes: number;
  thumbnail: string;
  summary: string;
  contentHtml: string;
  assignedTo: DocumentAssignment;
  createdAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  explanation: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  documentId: string;
  title: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  isActive: boolean;
  questions: QuizQuestion[];
}

export interface UserProgress {
  id: string;
  userId: string;
  documentId: string;
  status: ProgressStatus;
  readPercentage: number;
  markedAsRead: boolean;
  startedAt: string | null;
  readAt: string | null;
  quizPassedAt: string | null;
}

// Client-side types used by QuizClient component
export interface QuizData {
  quizId: string;
  documentId: string;
  title: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  totalQuestions: number;
  hasRead: boolean;
  pastAttempts: number;
  bestScore: number | null;
  questions: {
    id: string;
    questionText: string;
    questionType: QuestionType;
    options: { id: string; text: string }[];
  }[];
}

export interface QuizResult {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  results: {
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    explanation: string;
    options: QuizOption[];
  }[];
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  documentId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: QuizAttemptAnswer[];
}

// Session / Auth types
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  teamId: string | null;
  positionId: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Dashboard types
export interface UserDashboardData {
  user: SessionUser;
  totalDocuments: number;
  completedDocuments: number;
  overallProgress: number;
  documents: DocumentWithProgress[];
}

export interface DocumentWithProgress {
  document: Document;
  progress: ProgressStatus;
  readPercentage: number;
  quizScore: number | null;
  quizPassed: boolean;
}

export interface AdminStatsData {
  totalUsers: number;
  onboardingUsers: number;
  completedUsers: number;
  totalDocuments: number;
  averageQuizScore: number;
  averageCompletion: number;
  users: AdminUserRow[];
}

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  department: string;
  team: string;
  position: string;
  status: UserStatus;
  progress: number;
  documentsCompleted: number;
  totalDocuments: number;
  onboardingStartDate: string;
}
