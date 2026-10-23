/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, Lesson, Question, QuestionType } from '../../types';
import { saveQuestionsBatch } from '../../services/storageService';
import {
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  ListOrdered,
  Plus,
  HelpCircle,
} from 'lucide-react';

interface BatchQuestionsGeneratorModalProps {
  isOpen: boolean;
  lesson: Lesson;
  onClose: () => void;
  onGeneratedSuccess: (count: number) => void;
}

export const BatchQuestionsGeneratorModal: React.FC<BatchQuestionsGeneratorModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onGeneratedSuccess,
}) => {
  const [totalCount, setTotalCount] = useState<number>(5);
  const [strategy, setStrategy] = useState<'balanced' | 'all_mc' | 'custom'>('balanced');

  // Cho phép tùy chỉnh từng dạng
  const [mcCount, setMcCount] = useState<number>(3);
  const [fitbCount, setFitbCount] = useState<number>(1);
  const [ddCount, setDdCount] = useState<number>(1);
  const [essayCount, setEssayCount] = useState<number>(0);

  if (!isOpen) return null;

  // Xử lý tạo câu hỏi theo chủ đề Tin học THCS theo Khối
  const handleGenerate = () => {
    let counts = {
      multiple_choice: 0,
      fill_in_the_blank: 0,
      drag_and_drop: 0,
      essay: 0,
    };

    if (strategy === 'all_mc') {
      counts.multiple_choice = totalCount;
    } else if (strategy === 'balanced') {
      const qTypes: QuestionType[] = [
        'multiple_choice',
        'fill_in_the_blank',
        'drag_and_drop',
        'essay',
      ];
      for (let i = 0; i < totalCount; i++) {
        const type = qTypes[i % qTypes.length];
        counts[type]++;
      }
    } else {
      counts = {
        multiple_choice: mcCount,
        fill_in_the_blank: fitbCount,
        drag_and_drop: ddCount,
        essay: essayCount,
      };
    }

    const newQuestions: Array<Omit<Question, 'id'> & { id?: string }> = [];

    // Danh sách câu hỏi mẫu môn Tin học phù hợp theo khối lớp
    const gradeTopics: Record<GradeLevel, string[]> = {
      6: [
        'Thông tin và thu nhận thông tin trong máy tính',
        'Lưu trữ dữ liệu trong máy tính (Bit, Byte, KB, MB, GB)',
        'Mạng máy tính và các thành phần của mạng',
        'Tìm kiếm và chia sẻ thông tin trên Internet an toàn',
        'Soạn thảo văn bản cơ bản và định dạng trang in',
      ],
      7: [
        'Bảng tính điện tử Excel và các kiểu dữ liệu',
        'Các hàm tính toán SUM, AVERAGE, COUNT, MAX, MIN trong bảng tính',
        'Định dạng và trình bày bảng dữ liệu chuyên nghiệp',
        'Sắp xếp và lọc dữ liệu trong bảng tính',
        'Tạo biểu đồ trực quan hóa dữ liệu',
      ],
      8: [
        'Lịch sử phát triển của máy tính qua các thời kỳ',
        'Thuật toán tuần tự, rẽ nhánh và lặp trong lập trình',
        'Ngôn ngữ lập trình trực quan Scratch / Python cơ bản',
        'Xử lý thông tin và đạo đức trong môi trường số',
        'Ứng dụng phần mềm chỉnh sửa đồ họa và đa phương tiện',
      ],
      9: [
        'Cơ sở dữ liệu và hệ quản trị cơ sở dữ liệu quan hệ',
        'Mạng xã hội và an toàn thông tin trên không gian mạng',
        'Thuật toán tìm kiếm nhị phân và thuật toán sắp xếp',
        'Định hướng nghề nghiệp trong lĩnh vực Công nghệ thông tin',
        'Tác động của trí tuệ nhân tạo (AI) và chuyển đổi số',
      ],
    };

    const topics = gradeTopics[lesson.grade] || gradeTopics[6];

    let questionIdx = 1;

    // 1. Tạo Trắc nghiệm 4 lựa chọn
    for (let i = 0; i < counts.multiple_choice; i++) {
      const topic = topics[i % topics.length];
      newQuestions.push({
        lessonId: lesson.id,
        type: 'multiple_choice',
        prompt: `Câu ${questionIdx}: [Khối ${lesson.grade}] Về chủ đề "${topic}", phát biểu nào sau đây là ĐÚNG nhất?`,
        points: 2.0,
        options: [
          { id: 'opt_a', text: 'Đây là phương án chính xác thể hiện đầy đủ bản chất của vấn đề.' },
          { id: 'opt_b', text: 'Phương án này chưa hoàn toàn chính xác trong mọi tình huống.' },
          { id: 'opt_c', text: 'Phương án này nêu sai khái niệm cơ bản của bài học.' },
          { id: 'opt_d', text: 'Phương án này chỉ đúng với các hệ thống máy tính đời cũ.' },
        ],
        correctOptionId: 'opt_a',
        explanation: `Khái niệm về ${topic} đã được nêu rõ trong sách giáo khoa Tin học ${lesson.grade}.`,
      });
      questionIdx++;
    }

    // 2. Tạo Trả lời ngắn / Điền khuyết
    for (let i = 0; i < counts.fill_in_the_blank; i++) {
      const topic = topics[(i + 1) % topics.length];
      newQuestions.push({
        lessonId: lesson.id,
        type: 'fill_in_the_blank',
        prompt: `Câu ${questionIdx}: [Khối ${lesson.grade}] Em hãy điền thuật ngữ hoặc từ còn thiếu vào chỗ trống: "${topic} là..."`,
        points: 2.0,
        acceptableAnswers: ['dữ liệu', 'thông tin', 'máy tính', 'thuật toán'],
        explanation: 'Học sinh điền từ ngữ chuyên ngành phù hợp với định nghĩa trong bài học.',
      });
      questionIdx++;
    }

    // 3. Tạo Kéo thả ghép nối
    for (let i = 0; i < counts.drag_and_drop; i++) {
      const topic = topics[(i + 2) % topics.length];
      newQuestions.push({
        lessonId: lesson.id,
        type: 'drag_and_drop',
        prompt: `Câu ${questionIdx}: [Khối ${lesson.grade}] Kéo thả các thành phần liên quan đến "${topic}" vào vị trí đích tương ứng:`,
        points: 3.0,
        dragDropPairs: [
          { id: `dd_${Date.now()}_${i}_1`, itemText: `Khái niệm về ${topic} (Thành phần A)`, slotLabel: 'Vị trí phân loại 1' },
          { id: `dd_${Date.now()}_${i}_2`, itemText: `Quy tắc vận hành ${topic} (Thành phần B)`, slotLabel: 'Vị trí phân loại 2' },
          { id: `dd_${Date.now()}_${i}_3`, itemText: `Ứng dụng thực tế ${topic} (Thành phần C)`, slotLabel: 'Vị trí phân loại 3' },
        ],
        explanation: 'Ghép đúng mỗi cặp để nhận điểm số tương ứng.',
      });
      questionIdx++;
    }

    // 4. Tạo Tự luận
    for (let i = 0; i < counts.essay; i++) {
      const topic = topics[(i + 3) % topics.length];
      newQuestions.push({
        lessonId: lesson.id,
        type: 'essay',
        prompt: `Câu ${questionIdx}: [Khối ${lesson.grade}] Em hãy viết đoạn văn ngắn (3 - 5 câu) phân tích vai trò của "${topic}" trong học tập và đời sống hiện đại?`,
        points: 3.0,
        essayGuide:
          'Học sinh nêu được định nghĩa, 2 ví dụ thực tế và rút ra kết luận ngắn gọn, ngôn từ mạch lạc.',
        explanation: 'Giáo viên đánh giá theo tiêu chí lập luận logic và ví dụ minh họa chính xác.',
      });
      questionIdx++;
    }

    saveQuestionsBatch(newQuestions);
    onGeneratedSuccess(newQuestions.length);
    onClose();
  };

  const calculatedTotal =
    strategy === 'custom' ? mcCount + fitbCount + ddCount + essayCount : totalCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Tạo Nhanh Số Lượng Câu Hỏi
              </h3>
              <p className="text-xs text-indigo-100">
                Khởi tạo hàng loạt câu hỏi chuẩn 4 dạng cho: {lesson.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Chọn số lượng câu hỏi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                Chọn tổng số lượng câu hỏi muốn tạo:
              </label>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Không giới hạn số câu
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[5, 10, 15, 20, 25, 30, 40, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setTotalCount(num);
                    if (strategy === 'custom') setStrategy('balanced');
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    totalCount === num && strategy !== 'custom'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>

            {/* Ô nhập số lượng câu hỏi tùy ý */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Hoặc tự nhập số lượng câu hỏi mong muốn:</span>
              <input
                type="number"
                min="1"
                max="999"
                value={totalCount}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setTotalCount(val);
                  if (strategy === 'custom') setStrategy('balanced');
                }}
                className="w-24 px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-bold text-indigo-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400">(Tạo bao nhiêu câu tùy ý)</span>
            </div>
          </div>

          {/* Chiến lược phân bổ dạng câu hỏi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Cơ cấu các dạng câu hỏi:
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  strategy === 'balanced'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'balanced'}
                  onChange={() => setStrategy('balanced')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Phân bổ đều 4 dạng câu hỏi (Khuyên dùng)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Kết hợp Trắc nghiệm 4 lựa chọn, Điền khuyết, Kéo thả và Tự luận theo chuẩn Tin học {lesson.grade}.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  strategy === 'all_mc'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'all_mc'}
                  onChange={() => setStrategy('all_mc')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Toàn bộ là Trắc nghiệm 4 lựa chọn (A, B, C, D)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Thích hợp cho bài kiểm tra nhanh 15 phút hoặc ôn tập trắc nghiệm khách quan.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  strategy === 'custom'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'custom'}
                  onChange={() => setStrategy('custom')}
                  className="mt-0.5 text-indigo-600"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Tùy chỉnh số lượng chi tiết từng dạng
                  </span>
                  {strategy === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-600 font-semibold">Trắc nghiệm:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={mcCount}
                          onChange={(e) => setMcCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full mt-0.5 px-2 py-1 border rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 font-semibold">Điền khuyết:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={fitbCount}
                          onChange={(e) => setFitbCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full mt-0.5 px-2 py-1 border rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 font-semibold">Kéo thả:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={ddCount}
                          onChange={(e) => setDdCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full mt-0.5 px-2 py-1 border rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 font-semibold">Tự luận:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={essayCount}
                          onChange={(e) => setEssayCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full mt-0.5 px-2 py-1 border rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong>{calculatedTotal} câu hỏi</strong> sẽ được tạo.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={calculatedTotal <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tạo {calculatedTotal} Câu Hỏi Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
