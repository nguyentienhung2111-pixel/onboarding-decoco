'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { QuizData, QuizResult } from '@/lib/types';

export default function QuizClient({ docId }: { docId: string }) {
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    setStartTime(Date.now());
    console.log('QuizClient mounted for docId:', docId);
    
    fetch(`/api/quizzes/${docId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => { 
        if (json.success) {
          setQuiz(json.data);
        } else {
          console.error('Quiz data error:', json.error);
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [docId]);

  function selectOption(questionId: string, optionId: string, isMultiple: boolean) {
    setAnswers(prev => {
      if (isMultiple) {
        // Toggle: add if not selected, remove if already selected
        const current = prev[questionId] || [];
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: updated };
      }
      // Single choice / true_false: replace
      return { ...prev, [questionId]: [optionId] };
    });
  }

  async function handleSubmit() {
    if (!quiz || !startTime) return;
    setSubmitting(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const body = {
      answers: (quiz.questions || []).map(q => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      })),
      timeSpentSeconds: timeSpent,
    };

    try {
      const res = await fetch(`/api/quizzes/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    setLoading(true);
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px', color: '#F9FAFB' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #1E2132', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#9CA0B8', fontSize: '14px' }}>Đang tải bộ câu hỏi...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#F9FAFB' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Không thể tải bộ câu hỏi</h2>
        <p style={{ color: '#9CA0B8', marginBottom: '24px' }}>Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
        <Link href={`/documents/${docId}`} style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
          ← Quay lại tài liệu
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];
  
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center', color: '#F9FAFB' }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ fontSize: '20px', margin: '20px 0 8px' }}>Chưa có câu hỏi</h2>
        <p style={{ color: '#9CA0B8', marginBottom: '24px' }}>Tài liệu này hiện chưa có bộ câu hỏi quiz. Vui lòng quay lại sau.</p>
        <Link href={`/documents/${docId}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>← Quay lại đọc tài liệu</Link>
      </div>
    );
  }

  if (!quiz.hasRead) {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center', color: '#F9FAFB' }}>
        <span style={{ fontSize: '48px' }}>📖</span>
        <h2 style={{ fontSize: '20px', margin: '20px 0 8px' }}>Chưa thể làm quiz</h2>
        <p style={{ color: '#9CA0B8', marginBottom: '24px' }}>Bạn cần đọc xong tài liệu và đánh dấu "Đã đọc" trước khi làm quiz.</p>
        <Link href={`/documents/${docId}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>← Quay lại đọc tài liệu</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', color: '#F9FAFB' }}>
        <div style={{ background: '#1E2132', borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '24px', border: '1px solid #2D314D' }}>
          <span style={{ fontSize: '64px' }}>{result.isPassed ? '🏆' : '❌'}</span>
          <h2 style={{ fontSize: '24px', margin: '16px 0 8px' }}>
            {result.isPassed ? 'Chúc mừng! Bạn đã đạt!' : 'Chưa đạt — Cố gắng thêm nhé!'}
          </h2>
          <div style={{ fontSize: '48px', fontWeight: 800, color: result.isPassed ? '#22c55e' : '#ef4444', marginBottom: '8px' }}>
            {result.score}/10
          </div>
          <p style={{ color: '#9CA0B8' }}>Đúng {result.correctCount}/{result.totalQuestions} câu</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            {!result.isPassed && <button onClick={handleRetry} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🔄 Làm lại</button>}
            <Link href="/dashboard" style={{ padding: '10px 24px', background: 'transparent', color: '#F9FAFB', border: '1px solid #2D314D', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Về Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: '#F9FAFB' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href={`/documents/${docId}`} style={{ color: '#9CA0B8', textDecoration: 'none', fontSize: '14px' }}>
          ← Quay lại tài liệu
        </Link>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>{quiz.title}</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6B6D8A' }}>
          <span>Điểm đạt: {quiz.passingScore}/10</span>
          {quiz.bestScore !== null && <span>Điểm cao: {quiz.bestScore}/10</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ flex: 1, height: '8px', background: '#1E2132', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#7c3aed', width: `${((currentQ + 1) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '13px', color: '#9CA0B8' }}>{currentQ + 1}/{questions.length}</span>
      </div>

      <div style={{ background: '#1E2132', border: '1px solid #2D314D', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#6B6D8A', marginBottom: '12px' }}>Câu {currentQ + 1}</p>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.5 }}>{question?.questionText}</h3>
        {question?.questionType === 'multiple_choice' && (
          <p style={{ fontSize: '13px', color: '#a78bfa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '3px', border: '2px solid #a78bfa', fontSize: '10px' }}>✓</span>
            Chọn nhiều đáp án
          </p>
        )}
        {question?.questionType !== 'multiple_choice' && <div style={{ marginBottom: '16px' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {question?.options?.map(opt => {
            const isMultiple = question.questionType === 'multiple_choice';
            const isSelected = answers[question.id]?.includes(opt.id);
            return (
              <div 
                key={opt.id} 
                onClick={() => selectOption(question.id, opt.id, isMultiple)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: isSelected ? 'rgba(124, 58, 237, 0.1)' : '#151723', 
                  border: isSelected ? '2px solid #7c3aed' : '1px solid #2D314D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {isMultiple ? (
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? 'none' : '2px solid #2D314D', background: isSelected ? '#7c3aed' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                  </div>
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #7c3aed' : '2px solid #2D314D', background: isSelected ? 'white' : 'transparent', flexShrink: 0 }} />
                )}
                <span>{opt.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} disabled={currentQ === 0} style={{ padding: '10px 24px', background: 'transparent', color: '#F9FAFB', border: '1px solid #2D314D', borderRadius: '8px', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? 0.5 : 1 }}>← Trước</button>
        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Tiếp theo →</button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !allAnswered} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: (submitting || !allAnswered) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (submitting || !allAnswered) ? 0.5 : 1 }}>
            {submitting ? 'Đang chấm...' : `Nộp bài (${answeredCount}/${questions.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
