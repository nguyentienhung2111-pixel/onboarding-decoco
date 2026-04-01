import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentsForUser } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm strip HTML tags, giữ lại text thuần
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Hàm tìm tài liệu liên quan đến câu hỏi (simple keyword search)
function findRelevantDocs(
  question: string,
  docs: { title: string; content: string }[]
): { title: string; content: string }[] {
  const questionLower = question.toLowerCase();
  const words = questionLower
    .split(/\s+/)
    .filter(w => w.length > 2)
    // Loại bỏ stop words tiếng Việt
    .filter(w => !['của', 'là', 'và', 'các', 'cho', 'với', 'trong',
      'này', 'đó', 'được', 'có', 'không', 'những', 'một',
      'như', 'thế', 'nào', 'gì', 'khi', 'thì', 'mà'].includes(w));

  // Tính điểm relevance cho mỗi tài liệu
  const scored = docs.map(doc => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (titleLower.includes(word)) score += 3; // Title match quan trọng hơn
      if (contentLower.includes(word)) score += 1;
    }

    return { ...doc, score };
  });

  // Lấy top 3 tài liệu có điểm cao nhất (và > 0)
  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export async function POST(request: Request) {
  try {
    // 1. Kiểm tra auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } },
        { status: 401 }
      );
    }

    // 2. Lấy câu hỏi từ request
    const { message, history } = await request.json() as {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Tin nhắn không được để trống' } },
        { status: 400 }
      );
    }

    // 3. Lấy tất cả tài liệu user có quyền truy cập
    const docs = await getDocumentsForUser(user);
    const docsWithContent = docs.map(doc => ({
      title: doc.title,
      content: stripHtml(doc.contentHtml || ''),
    }));

    // 4. Tìm tài liệu liên quan (RAG - Retrieval)
    const relevantDocs = findRelevantDocs(message, docsWithContent);

    // 5. Xây dựng context từ tài liệu
    let context = '';
    const sources: string[] = [];

    if (relevantDocs.length > 0) {
      context = relevantDocs
        .map(doc => {
          sources.push(doc.title);
          // Giới hạn mỗi tài liệu tối đa 2000 ký tự để tránh vượt token limit
          const truncated = doc.content.length > 2000
            ? doc.content.substring(0, 2000) + '...'
            : doc.content;
          return `=== TÀI LIỆU: ${doc.title} ===\n${truncated}`;
        })
        .join('\n\n');
    }

    // 6. Tạo system prompt
    const systemPrompt = `Bạn là AI DECOCO — trợ lý onboarding thân thiện của công ty DECOCO.

QUY TẮC BẮT BUỘC:
- Chỉ trả lời dựa trên nội dung tài liệu được cung cấp bên dưới. KHÔNG bịa thông tin.
- Nếu câu hỏi nằm ngoài phạm vi tài liệu, trả lời: "Mình chưa có thông tin về vấn đề này trong tài liệu onboarding. Bạn có thể liên hệ quản lý trực tiếp hoặc HR để được hỗ trợ nhé!"
- Trả lời bằng tiếng Việt, giọng văn thân thiện, dễ hiểu, ngắn gọn.
- Dùng emoji phù hợp để câu trả lời sinh động hơn.
- Khi trích dẫn thông tin, ghi rõ nguồn (tên tài liệu).
- Trả lời ngắn gọn, đi thẳng vào vấn đề. Không lặp lại câu hỏi.

${context ? `TÀI LIỆU THAM KHẢO:\n${context}` : 'Không tìm thấy tài liệu liên quan.'}`;

    // 7. Xây dựng messages cho OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Thêm lịch sử chat (tối đa 6 tin gần nhất)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    // Thêm câu hỏi hiện tại
    messages.push({ role: 'user', content: message });

    // 8. Gọi OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3, // Thấp = ít sáng tạo, bám sát tài liệu
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Xin lỗi, mình không thể trả lời lúc này.';

    // 9. Trả kết quả
    return NextResponse.json({
      success: true,
      data: {
        content: aiResponse,
        sources: sources.length > 0 ? sources : undefined,
      },
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: 'Lỗi khi xử lý câu hỏi' } },
      { status: 500 }
    );
  }
}
