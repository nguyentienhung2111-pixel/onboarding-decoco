// src/app/(app)/documents/[id]/quiz/page.tsx
import QuizClient from './QuizClient';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <QuizClient docId={id} />;
}
