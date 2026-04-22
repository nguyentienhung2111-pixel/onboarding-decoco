import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mwrtvvfpgkivhxohxatz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnR2dmZwZ2tpdmh4b2h4YXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk2MjU4NywiZXhwIjoyMDkwNTM4NTg3fQ.jDDy-wtXSWZRkt0pi6xp2WECx4nuIBN6XJzacomWSnM'
);

const QUIZ_ID = 'quiz-van-hoa';

// 20 questions about DECOCO company culture (doc-van-hoa)
// Using prefix "qvhoa_" to avoid conflict with "qvh_" (used by quiz-phong-van-hanh)
const questions = [
  {
    id: 'qvhoa_1',
    questionText: 'DECOCO sử dụng công cụ giao tiếp nội bộ chính nào?',
    questionType: 'single_choice',
    explanation: 'DECOCO sử dụng Lark làm công cụ giao tiếp nội bộ chính.',
    sortOrder: 1,
    options: [
      { id: 'qvhoa_1_a', text: 'Slack', isCorrect: false },
      { id: 'qvhoa_1_b', text: 'Microsoft Teams', isCorrect: false },
      { id: 'qvhoa_1_c', text: 'Lark', isCorrect: true },
      { id: 'qvhoa_1_d', text: 'Zalo', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_2',
    questionText: 'Mỗi team họp weekly bao lâu?',
    questionType: 'single_choice',
    explanation: 'Mỗi team họp 1 lần/tuần trong 30 phút để review KPI.',
    sortOrder: 2,
    options: [
      { id: 'qvhoa_2_a', text: '15 phút', isCorrect: false },
      { id: 'qvhoa_2_b', text: '30 phút', isCorrect: true },
      { id: 'qvhoa_2_c', text: '1 tiếng', isCorrect: false },
      { id: 'qvhoa_2_d', text: '2 tiếng', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_3',
    questionText: 'Happy Friday diễn ra vào thời điểm nào?',
    questionType: 'single_choice',
    explanation: 'Happy Friday: Mỗi thứ 6 cuối tháng off sớm 1 tiếng.',
    sortOrder: 3,
    options: [
      { id: 'qvhoa_3_a', text: 'Mỗi thứ 6 hàng tuần', isCorrect: false },
      { id: 'qvhoa_3_b', text: 'Mỗi thứ 6 cuối tháng', isCorrect: true },
      { id: 'qvhoa_3_c', text: 'Mỗi thứ 6 đầu tháng', isCorrect: false },
      { id: 'qvhoa_3_d', text: 'Mỗi thứ 7', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_4',
    questionText: 'DECOCO có bao nhiêu lần company trip trong năm?',
    questionType: 'single_choice',
    explanation: 'Company trip 2 lần/năm.',
    sortOrder: 4,
    options: [
      { id: 'qvhoa_4_a', text: '1 lần', isCorrect: false },
      { id: 'qvhoa_4_b', text: '2 lần', isCorrect: true },
      { id: 'qvhoa_4_c', text: '3 lần', isCorrect: false },
      { id: 'qvhoa_4_d', text: '4 lần', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_5',
    questionText: 'DECOCO đánh giá nhân viên dựa trên thời gian ngồi tại chỗ.',
    questionType: 'true_false',
    explanation: 'Sai. DECOCO theo phong cách Result-oriented: Đánh giá dựa trên kết quả, không phải thời gian ngồi tại chỗ.',
    sortOrder: 5,
    options: [
      { id: 'qvhoa_5_a', text: 'Đúng', isCorrect: false },
      { id: 'qvhoa_5_b', text: 'Sai', isCorrect: true },
    ],
  },
  {
    id: 'qvhoa_6',
    questionText: 'Nhân viên DECOCO có thể mặc quần short đi làm.',
    questionType: 'true_false',
    explanation: 'Sai. Dress code là Smart casual - không mặc quần short, dép lê khi đi làm.',
    sortOrder: 6,
    options: [
      { id: 'qvhoa_6_a', text: 'Đúng', isCorrect: false },
      { id: 'qvhoa_6_b', text: 'Sai', isCorrect: true },
    ],
  },
  {
    id: 'qvhoa_7',
    questionText: 'Feedback 1-1 giữa Leader và member diễn ra bao lâu một lần?',
    questionType: 'single_choice',
    explanation: 'Feedback 1-1: Leader và member gặp 1-1 mỗi 2 tuần.',
    sortOrder: 7,
    options: [
      { id: 'qvhoa_7_a', text: 'Mỗi tuần', isCorrect: false },
      { id: 'qvhoa_7_b', text: 'Mỗi 2 tuần', isCorrect: true },
      { id: 'qvhoa_7_c', text: 'Mỗi tháng', isCorrect: false },
      { id: 'qvhoa_7_d', text: 'Mỗi quý', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_8',
    questionText: 'Phong cách làm việc của DECOCO có thể mô tả bằng cụm từ nào?',
    questionType: 'single_choice',
    explanation: 'Văn hoá DECOCO: "Work Hard, Play Hard".',
    sortOrder: 8,
    options: [
      { id: 'qvhoa_8_a', text: 'Slow and Steady', isCorrect: false },
      { id: 'qvhoa_8_b', text: 'Work Hard, Play Hard', isCorrect: true },
      { id: 'qvhoa_8_c', text: 'Move Fast, Break Things', isCorrect: false },
      { id: 'qvhoa_8_d', text: 'Think Different', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_9',
    questionText: 'Dress code tại DECOCO là gì?',
    questionType: 'single_choice',
    explanation: 'Dress code DECOCO: Smart casual — gọn gàng, lịch sự nhưng không quá formal.',
    sortOrder: 9,
    options: [
      { id: 'qvhoa_9_a', text: 'Formal (vest, sơ mi)', isCorrect: false },
      { id: 'qvhoa_9_b', text: 'Smart casual', isCorrect: true },
      { id: 'qvhoa_9_c', text: 'Tự do hoàn toàn', isCorrect: false },
      { id: 'qvhoa_9_d', text: 'Đồng phục công ty', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_10',
    questionText: 'Khi gặp bất đồng ý kiến với đồng nghiệp, cách xử lý phù hợp theo văn hoá DECOCO là gì?',
    questionType: 'single_choice',
    explanation: 'DECOCO khuyến khích trao đổi thẳng thắn, tôn trọng — feedback trực tiếp, không nói sau lưng.',
    sortOrder: 10,
    options: [
      { id: 'qvhoa_10_a', text: 'Im lặng chịu đựng', isCorrect: false },
      { id: 'qvhoa_10_b', text: 'Nói sau lưng với đồng nghiệp khác', isCorrect: false },
      { id: 'qvhoa_10_c', text: 'Trao đổi thẳng thắn, tôn trọng', isCorrect: true },
      { id: 'qvhoa_10_d', text: 'Báo cáo ngay lên Ban Giám đốc', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_11',
    questionText: 'DECOCO khuyến khích nhân viên chủ động đề xuất ý tưởng mới.',
    questionType: 'true_false',
    explanation: 'Đúng. Văn hoá DECOCO khuyến khích sáng tạo và chủ động — nhân viên có thể đề xuất ý tưởng bất cứ lúc nào.',
    sortOrder: 11,
    options: [
      { id: 'qvhoa_11_a', text: 'Đúng', isCorrect: true },
      { id: 'qvhoa_11_b', text: 'Sai', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_12',
    questionText: 'Cuộc họp All-hands toàn công ty diễn ra bao lâu một lần?',
    questionType: 'single_choice',
    explanation: 'Họp All-hands toàn công ty mỗi tháng 1 lần để review kết quả kinh doanh và chia sẻ chiến lược.',
    sortOrder: 12,
    options: [
      { id: 'qvhoa_12_a', text: 'Mỗi tuần', isCorrect: false },
      { id: 'qvhoa_12_b', text: 'Mỗi tháng', isCorrect: true },
      { id: 'qvhoa_12_c', text: 'Mỗi quý', isCorrect: false },
      { id: 'qvhoa_12_d', text: 'Mỗi năm', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_13',
    questionText: 'Nhân viên DECOCO được khuyến khích sử dụng trang phục thoải mái vào ngày nào?',
    questionType: 'single_choice',
    explanation: 'Casual Friday — Mỗi thứ 6, nhân viên có thể mặc thoải mái hơn bình thường (vẫn lịch sự).',
    sortOrder: 13,
    options: [
      { id: 'qvhoa_13_a', text: 'Thứ 2', isCorrect: false },
      { id: 'qvhoa_13_b', text: 'Thứ 4', isCorrect: false },
      { id: 'qvhoa_13_c', text: 'Thứ 6', isCorrect: true },
      { id: 'qvhoa_13_d', text: 'Không có ngày nào', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_14',
    questionText: 'DECOCO tổ chức sinh nhật cho nhân viên mỗi tháng.',
    questionType: 'true_false',
    explanation: 'Đúng. DECOCO tổ chức sinh nhật hàng tháng cho các nhân viên có sinh nhật trong tháng đó.',
    sortOrder: 14,
    options: [
      { id: 'qvhoa_14_a', text: 'Đúng', isCorrect: true },
      { id: 'qvhoa_14_b', text: 'Sai', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_15',
    questionText: 'Trong văn hoá DECOCO, "Data-driven" có nghĩa là gì?',
    questionType: 'single_choice',
    explanation: 'Data-driven: Mọi quyết định đều dựa trên dữ liệu và số liệu cụ thể, không phải cảm tính.',
    sortOrder: 15,
    options: [
      { id: 'qvhoa_15_a', text: 'Lái xe theo dữ liệu GPS', isCorrect: false },
      { id: 'qvhoa_15_b', text: 'Quyết định dựa trên dữ liệu, không cảm tính', isCorrect: true },
      { id: 'qvhoa_15_c', text: 'Thu thập dữ liệu khách hàng', isCorrect: false },
      { id: 'qvhoa_15_d', text: 'Sao lưu dữ liệu hàng ngày', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_16',
    questionText: 'Nhân viên mới tại DECOCO được giao buddy/mentor hỗ trợ trong thời gian đầu.',
    questionType: 'true_false',
    explanation: 'Đúng. Mỗi nhân viên mới đều được assign 1 buddy (người hướng dẫn) để hỗ trợ trong 2 tuần đầu.',
    sortOrder: 16,
    options: [
      { id: 'qvhoa_16_a', text: 'Đúng', isCorrect: true },
      { id: 'qvhoa_16_b', text: 'Sai', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_17',
    questionText: 'Quy tắc "No Blame" trong văn hoá DECOCO có ý nghĩa gì?',
    questionType: 'single_choice',
    explanation: 'No Blame: Khi có sai sót, tập trung vào giải pháp và rút kinh nghiệm, không đổ lỗi cá nhân.',
    sortOrder: 17,
    options: [
      { id: 'qvhoa_17_a', text: 'Không ai phải chịu trách nhiệm', isCorrect: false },
      { id: 'qvhoa_17_b', text: 'Tập trung giải pháp, không đổ lỗi', isCorrect: true },
      { id: 'qvhoa_17_c', text: 'Không được phàn nàn', isCorrect: false },
      { id: 'qvhoa_17_d', text: 'Không cần báo cáo lỗi', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_18',
    questionText: 'Khi cần nghỉ phép, nhân viên phải báo trước bao lâu?',
    questionType: 'single_choice',
    explanation: 'Nghỉ phép phải báo trước ít nhất 3 ngày để team sắp xếp công việc thay thế.',
    sortOrder: 18,
    options: [
      { id: 'qvhoa_18_a', text: '1 ngày', isCorrect: false },
      { id: 'qvhoa_18_b', text: '3 ngày', isCorrect: true },
      { id: 'qvhoa_18_c', text: '1 tuần', isCorrect: false },
      { id: 'qvhoa_18_d', text: '2 tuần', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_19',
    questionText: 'DECOCO có hệ thống thưởng theo hiệu suất (performance bonus).',
    questionType: 'true_false',
    explanation: 'Đúng. DECOCO áp dụng thưởng theo hiệu suất, đánh giá hàng quý dựa trên KPI cá nhân và team.',
    sortOrder: 19,
    options: [
      { id: 'qvhoa_19_a', text: 'Đúng', isCorrect: true },
      { id: 'qvhoa_19_b', text: 'Sai', isCorrect: false },
    ],
  },
  {
    id: 'qvhoa_20',
    questionText: 'Giá trị "Ownership" tại DECOCO có nghĩa nhân viên phải mua cổ phần công ty.',
    questionType: 'true_false',
    explanation: 'Sai. "Ownership" ở đây là tinh thần làm chủ công việc — nhận trách nhiệm và chủ động hoàn thành, không phải mua cổ phần.',
    sortOrder: 20,
    options: [
      { id: 'qvhoa_20_a', text: 'Đúng', isCorrect: false },
      { id: 'qvhoa_20_b', text: 'Sai', isCorrect: true },
    ],
  },
];

async function main() {
  console.log('Seeding quiz questions for quiz-van-hoa...\n');

  // Clean up any existing questions for this quiz
  const { data: existingQ } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', QUIZ_ID);
  
  if (existingQ && existingQ.length > 0) {
    const existingIds = existingQ.map(q => q.id);
    await supabase.from('quiz_options').delete().in('question_id', existingIds);
    await supabase.from('quiz_questions').delete().eq('quiz_id', QUIZ_ID);
    console.log(`Cleaned up ${existingQ.length} existing questions`);
  }

  // Insert questions
  const questionRows = questions.map(q => ({
    id: q.id,
    quiz_id: QUIZ_ID,
    question_text: q.questionText,
    question_type: q.questionType,
    explanation: q.explanation,
    sort_order: q.sortOrder,
  }));

  const { error: insertQErr } = await supabase.from('quiz_questions').insert(questionRows);
  if (insertQErr) {
    console.error('ERROR inserting questions:', insertQErr);
    return;
  }
  console.log(`✅ Inserted ${questionRows.length} questions`);

  // Insert options
  const optionRows = [];
  for (const q of questions) {
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      optionRows.push({
        id: opt.id,
        question_id: q.id,
        text: opt.text,
        is_correct: opt.isCorrect,
        sort_order: i + 1,
      });
    }
  }

  const { error: insertOErr } = await supabase.from('quiz_options').insert(optionRows);
  if (insertOErr) {
    console.error('ERROR inserting options:', insertOErr);
    return;
  }
  console.log(`✅ Inserted ${optionRows.length} options`);

  // Verify
  const { count } = await supabase
    .from('quiz_questions')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', QUIZ_ID);
  console.log(`\n✅ Verification: quiz-van-hoa now has ${count} questions`);
}

main().catch(console.error);
