import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getQuizByDocumentId, getDocProgress, getUserQuizAttempts, addQuizAttempt, updateProgress } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const { docId } = await params;
    const quiz = await getQuizByDocumentId(docId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy quiz' } }, { status: 404 });
    }

    // Check if user has read the document
    const progress = await getDocProgress(user.id, docId);
    const hasRead = progress && (progress.status === 'read' || progress.status === 'quiz_passed');

    // Get past attempts
    const attempts = await getUserQuizAttempts(user.id, docId);

    // Shuffle questions and options
    const shuffledQuestions = [...quiz.questions]
      .sort(() => Math.random() - 0.5)
      .map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        documentId: quiz.documentId,
        title: quiz.title,
        passingScore: quiz.passingScore,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalQuestions: shuffledQuestions.length,
        hasRead,
        pastAttempts: attempts.length,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null,
        questions: shuffledQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options.map(o => ({ id: o.id, text: o.text })), // Hide isCorrect
        })),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const { docId } = await params;
    const quiz = await getQuizByDocumentId(docId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy quiz' } }, { status: 404 });
    }

    const body = await request.json();
    const { answers, timeSpentSeconds } = body as {
      answers: { questionId: string; selectedOptionIds: string[] }[];
      timeSpentSeconds: number;
    };

    // Grade the quiz
    let correctCount = 0;
    const gradedAnswers = quiz.questions.map(question => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
      const selected = userAnswer?.selectedOptionIds || [];

      const isCorrect =
        selected.length === correctOptionIds.length &&
        selected.every(id => correctOptionIds.includes(id));

      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        selectedOptionIds: selected,
        correctOptionIds,
        isCorrect,
        explanation: question.explanation,
        options: question.options,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 10 * 10) / 10;
    const isPassed = score >= quiz.passingScore;

    // Save attempt
    const attempt = {
      id: `att${Date.now()}`,
      userId: user.id,
      quizId: quiz.id,
      documentId: docId,
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      isPassed,
      timeSpentSeconds: timeSpentSeconds || 0,
      submittedAt: new Date().toISOString(),
      answers: gradedAnswers.map(a => ({
        questionId: a.questionId,
        selectedOptionIds: a.selectedOptionIds,
        isCorrect: a.isCorrect,
      })),
    };

    await addQuizAttempt(attempt);

    // Update progress if passed
    if (isPassed) {
      await updateProgress(user.id, docId, {
        status: 'quiz_passed',
        quizPassedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        isPassed,
        passingScore: quiz.passingScore,
        results: gradedAnswers,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
