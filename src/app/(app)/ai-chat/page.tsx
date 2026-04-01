'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  error?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Giờ làm việc của DECOCO là mấy giờ?',
  'Giá trị cốt lõi của DECOCO là gì?',
  'Chính sách nghỉ phép như thế nào?',
  'Phòng Marketing có mấy team?',
  'Quy trình đóng gói đơn hàng?',
  'Ai là người mình báo cáo trực tiếp?',
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! 👋 Mình là **AI DECOCO** — trợ lý onboarding của bạn.\n\nMình có thể giúp bạn tìm hiểu thông tin về công ty, chính sách, quy trình và các phòng ban. Hãy đặt câu hỏi bằng tiếng Việt nhé!',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Chuẩn bị lịch sử chat (bỏ welcome message và error messages)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome' && !m.error)
        .map(m => ({ role: m.role, content: m.content }));

      // Gọi API thật
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: chatHistory,
        }),
      });

      const json = await response.json();

      if (json.success) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: json.data.content,
          sources: json.data.sources,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // API trả về lỗi
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Xin lỗi, mình gặp sự cố khi xử lý câu hỏi. Bạn thử hỏi lại nhé! 🙏',
          error: true,
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      // Lỗi network
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
        error: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', color: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={24} color="#7c3aed" /> AI DECOCO
        </h1>
        <p style={{ fontSize: '14px', color: '#9CA0B8' }}>
          Trợ lý AI giúp bạn tìm kiếm thông tin từ tài liệu onboarding
        </p>
      </div>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id}>
              <div className={`chat-bubble ${msg.role} ${msg.error ? 'error' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {msg.error ? (
                    <AlertCircle size={16} style={{ opacity: 0.7, color: '#ef4444' }} />
                  ) : msg.role === 'assistant' ? (
                    <Bot size={16} style={{ opacity: 0.7 }} />
                  ) : (
                    <User size={16} style={{ opacity: 0.7 }} />
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7 }}>
                    {msg.role === 'assistant' ? 'AI DECOCO' : 'Bạn'}
                  </span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <BookOpen size={12} style={{ opacity: 0.5, marginTop: '3px' }} />
                    {msg.sources.map(src => (
                      <span key={src} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', color: 'inherit', opacity: 0.6 }}>
                        📄 {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble assistant" style={{ display: 'inline-flex', gap: '4px', padding: '14px 20px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6B6D8A', animation: 'bounce 1.4s infinite', animationDelay: '0s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6B6D8A', animation: 'bounce 1.4s infinite', animationDelay: '0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6B6D8A', animation: 'bounce 1.4s infinite', animationDelay: '0.4s' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="suggested-questions">
            {SUGGESTED_QUESTIONS.map(q => (
              <button key={q} className="suggested-q" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-container">
          <input
            className="chat-input"
            placeholder="Hỏi mình bất cứ điều gì về DECOCO..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
