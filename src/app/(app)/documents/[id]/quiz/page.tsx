'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight, Clock, AlertCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: { id: string; text: string }[];
}

interface QuizData {
  quizId: string;
  documentId: string;
  title: string;
  passingScore: number;
  totalQuestions: number;
  hasRead: boolean;
  pastAttempts: number;
  bestScore: number | null;
  questions: QuizQuestion[];
}

interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  results: {
    questionId: string;
    questionText: string;
    questionType: string;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    explanation: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    fetch(`/api/quizzes/${docId}`)
      .then(res => res.json())
      .then((json: { success: boolean; data: QuizData }) => { if (json.success) setQuiz(json.data); })
      .finally(() => setLoading(false));
  }, [docId]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [optionId],
    }));
  }

  async function handleSubmit() {
    if (!quiz) return;
    setSubmitting(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const body = {
      answers: quiz.questions.map(q => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      })),
      timeSpentSeconds: timeSpent,
    };

    const res = await fetch(`/api/quizzes/${docId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.success) {
      setResult(json.data);
    }
    setSubmitting(false);
  }

  function handleRetry() {
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    setLoading(true);
    fetch(`/api/quizzes/${docId}`)
      .then(res => res.json())
      .then((json: { success: boolean; data: QuizData }) => { if (json.success) setQuiz(json.data); })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!quiz) return <div>Không tìm thấy quiz.</div>;

  // If user hasn't read the document yet
  if (!quiz.hasRead) {
    return (
      <div className="animate-fade-in-up" style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <AlertCircle size={40} color="#d97706" />
        </div>
        <h2 style={{ fontSize: '20px', color: '#F9FAFB', marginBottom: '8px' }}>Chưa thể làm quiz</h2>
        <p style={{ color: '#9CA0B8', marginBottom: '24px' }}>
          Bạn cần đọc xong tài liệu và đánh dấu &quot;Đã đọc&quot; trước khi làm quiz.
        </p>
        <Link href={`/documents/${docId}`} className="btn btn-primary">
          <ArrowLeft size={16} /> Quay lại đọc tài liệu
        </Link>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="animate-fade-in-up">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Score card */}
          <div className="card" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: result.isPassed ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
              boxShadow: result.isPassed ? '0 8px 24px rgba(34,197,94,0.3)' : '0 8px 24px rgba(239,68,68,0.3)',
            }}>
              {result.isPassed ? <Trophy size={48} color="white" /> : <XCircle size={48} color="white" />}
            </div>

            <h2 style={{ fontSize: '24px', color: '#F9FAFB', marginBottom: '8px' }}>
              {result.isPassed ? '🎉 Chúc mừng! Bạn đã đạt!' : '😥 Chưa đạt — Cố gắng thêm nhé!'}
            </h2>

            <div style={{ fontSize: '48px', fontWeight: 800, color: result.isPassed ? '#16a34a' : '#dc2626', fontFamily: 'var(--font-plus-jakarta)', marginBottom: '8px' }}>
              {result.score}/10
            </div>

            <p style={{ color: '#9CA0B8', marginBottom: '4px' }}>
              Đúng {result.correctCount}/{result.totalQuestions} câu • Điểm đạt: {result.passingScore}/10
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              {!result.isPassed && (
                <button onClick={handleRetry} className="btn btn-primary">
                  <RotateCcw size={16} /> Làm lại
                </button>
              )}
              <Link href="/dashboard" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Về Dashboard
              </Link>
            </div>
          </div>

          {/* Detailed results */}
          <h3 style={{ fontSize: '18px', color: '#F9FAFB', marginBottom: '16px' }}>Chi tiết kết quả</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.results.map((r, i) => (
              <div key={r.questionId} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: r.isCorrect ? '#dcfce7' : '#fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {r.isCorrect ? <CheckCircle size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#F9FAFB', fontSize: '14px' }}>Câu {i + 1}: {r.questionText}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingLeft: '40px' }}>
                  {r.options.map(opt => {
                    const isSelected = r.selectedOptionIds.includes(opt.id);
                    const isCorrectOpt = r.correctOptionIds.includes(opt.id);
                    let className = 'quiz-option';
                    if (isCorrectOpt) className += ' correct';
                    else if (isSelected && !isCorrectOpt) className += ' incorrect';

                    return (
                      <div key={opt.id} className={className} style={{ cursor: 'default', padding: '10px 14px' }}>
                        <span style={{ fontSize: '13px' }}>{opt.text}</span>
                        {isCorrectOpt && <CheckCircle size={14} color="#16a34a" style={{ marginLeft: 'auto' }} />}
                        {isSelected && !isCorrectOpt && <XCircle size={14} color="#dc2626" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  paddingLeft: '40px', padding: '12px 16px 12px 40px',
                  background: '#f0fdfa', borderRadius: '8px',
                  fontSize: '13px', color: '#4c1d95', lineHeight: 1.5,
                }}>
                  💡 {r.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz player
  const question = quiz.questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.totalQuestions;

  return (
    <div className="animate-fade-in-up">
      {/* Back */}
      <div style={{ marginBottom: '20px' }}>
        <Link href={`/documents/${docId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9CA0B8', textDecoration: 'none', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Quay lại tài liệu
        </Link>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Quiz header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', color: '#F9FAFB', marginBottom: '8px' }}>{quiz.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6B6D8A' }}>
            <span>Điểm đạt: {quiz.passingScore}/10</span>
            {quiz.pastAttempts > 0 && <span>Đã làm: {quiz.pastAttempts} lần</span>}
            {quiz.bestScore !== null && <span>Điểm cao nhất: {quiz.bestScore}/10</span>}
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div className="progress-bar-container" style={{ flex: 1, height: '8px' }}>
            <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / quiz.totalQuestions) * 100}%` }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA0B8', whiteSpace: 'nowrap' }}>
            {currentQ + 1}/{quiz.totalQuestions}
          </span>
        </div>

        {/* Question card */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }} key={question.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="badge badge-reading">
              {question.questionType === 'true_false' ? 'Đúng/Sai' : 'Trắc nghiệm'}
            </span>
            <span style={{ fontSize: '13px', color: '#6B6D8A' }}>Câu {currentQ + 1}</span>
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F9FAFB', marginBottom: '20px', lineHeight: 1.5 }}>
            {question.questionText}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.options.map(opt => {
              const isSelected = answers[question.id]?.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectOption(question.id, opt.id)}
                >
                  <div className="quiz-option-radio" />
                  <span>{opt.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} /> Câu trước
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {quiz.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: i === currentQ ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                  background: answers[q.id] ? '#ccfbf1' : 'white',
                  color: i === currentQ ? '#6d28d9' : '#9CA0B8',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < quiz.totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQ(prev => Math.min(quiz.totalQuestions - 1, prev + 1))}
              className="btn btn-primary"
            >
              Câu sau <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="btn btn-primary"
            >
              {submitting ? 'Đang chấm...' : (
                <>
                  <CheckCircle size={16} />
                  Nộp bài ({answeredCount}/{quiz.totalQuestions})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
