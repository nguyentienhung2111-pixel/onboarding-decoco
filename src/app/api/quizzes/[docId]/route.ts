import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getQuizByDocumentId, getDocProgress, getUserQuizAttempts, addQuizAttempt, updateProgress } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await params;
    console.log(`[API] Fetching quiz for docId: ${docId}`);

    if (docId === 'undefined' || !docId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_ID', message: 'ID tài liệu không hợp lệ' } }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const quiz = await getQuizByDocumentId(docId);
    if (!quiz) {
      console.warn(`[API] Quiz not found for docId: ${docId}`);
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy quiz cho tài liệu này' } }, { status: 404 });
    }

    // Safety mapping
    const questions = quiz.questions || [];

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        documentId: quiz.documentId,
        title: quiz.title,
        passingScore: quiz.passingScore,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalQuestions: questions.length,
        hasRead: true, // Simplified for debugging
        pastAttempts: 0,
        bestScore: null,
        questions: questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: (q.options || []).map(o => ({ id: o.id, text: o.text })),
        })),
      },
    });
  } catch (error: any) {
    console.error('[API FATAL ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        code: 'SERVER_ERROR', 
        message: `Lỗi hệ thống: ${error.message || 'Unknown'}` 
      } 
    }, { status: 500 });
  }
}



export async function POST(request: Request, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const { docId } = await params;
    console.log(`Starting quiz submission for user ${user.id}, doc ${docId}`);

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
    const questions = quiz.questions || [];
    const gradedAnswers = questions.map(question => {
      const userAnswer = (answers || []).find(a => a.questionId === question.id);
      const correctOptionIds = (question.options || []).filter(o => o.isCorrect).map(o => o.id);
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
        options: question.options || [],
      };
    });

    const score = questions.length > 0 ? (Math.round((correctCount / questions.length) * 10 * 10) / 10) : 0;
    const isPassed = score >= quiz.passingScore;

    // Save attempt
    const attempt = {
      id: `att${Date.now()}`,
      userId: user.id,
      quizId: quiz.id,
      documentId: docId as string,
      score,
      correctCount,
      totalQuestions: questions.length,
      isPassed,
      timeSpentSeconds: timeSpentSeconds || 0,
      submittedAt: new Date().toISOString(),
      answers: gradedAnswers.map(a => ({
        questionId: a.questionId,
        selectedOptionIds: a.selectedOptionIds,
        isCorrect: a.isCorrect,
      })),
    };

    try {
      await addQuizAttempt(attempt);
    } catch (dbError) {
      console.error('Error saving quiz attempt:', dbError);
    }

    // Update progress if passed
    if (isPassed) {
      try {
        await updateProgress(user.id, docId, {
          status: 'quiz_passed',
          quizPassedAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Error updating progress:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        correctCount,
        totalQuestions: questions.length,
        isPassed,
        passingScore: quiz.passingScore,
        results: gradedAnswers,
      },
    });
  } catch (error) {
    console.error('Quiz Submission API Error:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}

