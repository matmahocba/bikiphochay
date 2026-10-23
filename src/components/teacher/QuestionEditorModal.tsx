/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DragDropPair, Option, Question, QuestionType } from '../../types';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  GripVertical,
  Save,
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  lessonId: string;
  initialQuestion?: Question | null;
  onClose: () => void;
  onSave: (question: Omit<Question, 'id'> & { id?: string }) => void;
  onDelete?: (question: Question) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  lessonId,
  initialQuestion,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'multiple_choice');
  const [prompt, setPrompt] = useState(initialQuestion?.prompt || '');
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '');
  const [points, setPoints] = useState(initialQuestion?.points || 2.5);

  // 1. Trắc nghiệm 4 lựa chọn
  const [options, setOptions] = useState<Option[]>(
    initialQuestion?.options && initialQuestion.options.length === 4
      ? initialQuestion.options
      : [
          { id: 'opt_a', text: '' },
          { id: 'opt_b', text: '' },
          { id: 'opt_c', text: '' },
          { id: 'opt_d', text: '' },
        ]
  );
  const [correctOptionId, setCorrectOptionId] = useState<string>(
    initialQuestion?.correctOptionId || 'opt_a'
  );

  // 2. Điền khuyết / Trả lời ngắn
  const [acceptableAnswersText, setAcceptableAnswersText] = useState<string>(
    initialQuestion?.acceptableAnswers?.join(', ') || ''
  );

  // 3. Kéo thả (Drag & Drop pairs)
  const [dragDropPairs, setDragDropPairs] = useState<DragDropPair[]>(
    initialQuestion?.dragDropPairs && initialQuestion.dragDropPairs.length > 0
      ? initialQuestion.dragDropPairs
      : [
          { id: 'dd_1', itemText: 'Thẻ đáp án 1', slotLabel: 'Vị trí đích 1' },
          { id: 'dd_2', itemText: 'Thẻ đáp án 2', slotLabel: 'Vị trí đích 2' },
        ]
  );

  // 4. Tự luận
  const [essayGuide, setEssayGuide] = useState<string>(initialQuestion?.essayGuide || '');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], text };
    setOptions(updated);
  };

  const handleAddPair = () => {
    setDragDropPairs([
      ...dragDropPairs,
      {
        id: `dd_${Date.now()}`,
        itemText: `Thẻ đáp án ${dragDropPairs.length + 1}`,
        slotLabel: `Vị trí đích ${dragDropPairs.length + 1}`,
      },
    ]);
  };

  const handleRemovePair = (index: number) => {
    if (dragDropPairs.length <= 1) {
      alert('Cần có ít nhất 1 cặp kéo thả!');
      return;
    }
    setDragDropPairs(dragDropPairs.filter((_, i) => i !== index));
  };

  const handlePairChange = (index: number, field: 'itemText' | 'slotLabel', value: string) => {
    const updated = [...dragDropPairs];
    updated[index] = { ...updated[index], [field]: value };
    setDragDropPairs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const payload: Omit<Question, 'id'> & { id?: string } = {
      id: initialQuestion?.id,
      lessonId,
      type,
      prompt: prompt.trim(),
      explanation: explanation.trim() || undefined,
      points: Number(points) || 1,
    };

    if (type === 'multiple_choice') {
      const hasEmpty = options.some((opt) => !opt.text.trim());
      if (hasEmpty) {
        setError('Vui lòng nhập đầy đủ nội dung cho cả 4 lựa chọn A, B, C, D!');
        return;
      }
      payload.options = options;
      payload.correctOptionId = correctOptionId;
    } else if (type === 'fill_in_the_blank') {
      const answers = acceptableAnswersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (answers.length === 0) {
        setError('Vui lòng nhập ít nhất 1 đáp án được chấp nhận (ngăn cách bằng dấu phẩy)!');
        return;
      }
      payload.acceptableAnswers = answers;
    } else if (type === 'drag_and_drop') {
      const hasEmpty = dragDropPairs.some((p) => !p.itemText.trim() || !p.slotLabel.trim());
      if (hasEmpty) {
        setError('Vui lòng điền đầy đủ cả "Thẻ đáp án" và "Vị trí đích" cho từng cặp kéo thả!');
        return;
      }
      payload.dragDropPairs = dragDropPairs;
    } else if (type === 'essay') {
      payload.essayGuide = essayGuide.trim() || undefined;
    }

    onSave(payload);
    onClose();
  };

  const typeLabels: Record<QuestionType, { title: string; desc: string }> = {
    multiple_choice: {
      title: 'Trắc nghiệm 4 lựa chọn',
      desc: 'Học sinh chọn 1 trong 4 đáp án A, B, C, D',
    },
    fill_in_the_blank: {
      title: 'Trả lời ngắn (Điền khuyết)',
      desc: 'Học sinh gõ từ/cụm từ hoặc số vào ô trống',
    },
    drag_and_drop: {
      title: 'Kéo thả (Ghép nối ô trống)',
      desc: 'Học sinh kéo thả thẻ đáp án vào các ô đích',
    },
    essay: {
      title: 'Tự luận',
      desc: 'Học sinh viết đoạn văn bản dài trả lời',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Chọn dạng câu hỏi và thiết lập đáp án chấm điểm tự động
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Chọn dạng câu hỏi (4 loại theo yêu cầu) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Dạng câu hỏi (Chọn 1 trong 4 dạng):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(typeLabels) as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === t
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{typeLabels[t].title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{typeLabels[t].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung câu hỏi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Nội dung câu hỏi (Đề bài) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập đề bài hoặc yêu cầu câu hỏi..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Cấu hình chi tiết theo từng loại câu hỏi */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            {/* DẠNG 1: TRẮC NGHIỆM 4 LỰA CHỌN */}
            {type === 'multiple_choice' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  3. Bốn lựa chọn (Nhấp vào hình tròn để chọn đáp án đúng):
                </label>
                <div className="space-y-2.5">
                  {options.map((opt, idx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isCorrect = correctOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCorrectOptionId(opt.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title="Chọn làm đáp án đúng"
                        >
                          {letters[idx]}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Nội dung đáp án ${letters[idx]}...`}
                          className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 text-slate-800"
                        />
                        {isCorrect && (
                          <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DẠNG 2: ĐIỀN KHUYẾT / TRẢ LỜI NGẮN */}
            {type === 'fill_in_the_blank' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. Danh sách đáp án chính xác được chấp nhận:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Hệ thống không phân biệt chữ hoa, chữ thường và khoảng trắng thừa. Nhập nhiều đáp án đồng nghĩa bằng dấu phẩy (ví dụ: <code className="bg-white px-1 border rounded">hình thoi, thoi, hinh thoi</code>).
                </p>
                <input
                  type="text"
                  required
                  value={acceptableAnswersText}
                  onChange={(e) => setAcceptableAnswersText(e.target.value)}
                  placeholder="Ví dụ: hình thoi, thoi"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* DẠNG 3: CÂU HỎI KÉO THẢ */}
            {type === 'drag_and_drop' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      3. Các cặp Kéo thả (Thẻ đáp án ➔ Ô đích tương ứng):
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Học sinh sẽ kéo thẻ vào đúng ô đích tương ứng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPair}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm cặp
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {dragDropPairs.map((pair, idx) => (
                    <div
                      key={pair.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2"
                    >
                      <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Thẻ kéo (Nội dung đáp án):
                          </span>
                          <input
                            type="text"
                            required
                            value={pair.itemText}
                            onChange={(e) => handlePairChange(idx, 'itemText', e.target.value)}
                            placeholder="Ví dụ: Hình thoi"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Vị trí đích (Nhãn ô trống):
                          </span>
                          <input
                            type="text"
                            required
                            value={pair.slotLabel}
                            onChange={(e) => handlePairChange(idx, 'slotLabel', e.target.value)}
                            placeholder="Ví dụ: Kiểm tra điều kiện"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePair(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Xoá cặp này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DẠNG 4: TỰ LUẬN */}
            {type === 'essay' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. Hướng dẫn chấm / Đáp án gợi ý của Giáo viên:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Dành cho giáo viên xem lại hoặc đối chiếu khi học sinh nộp bài tự luận dài.
                </p>
                <textarea
                  rows={3}
                  value={essayGuide}
                  onChange={(e) => setEssayGuide(e.target.value)}
                  placeholder="Gợi ý các ý chính cần đạt được để chấm điểm..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Lời giải thích / Hướng dẫn giải sau khi xem kết quả */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. Lời giải thích chi tiết (Hiển thị khi học sinh xem kết quả):</span>
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích lý do tại sao đáp án này đúng..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Điểm số */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Trọng số điểm:</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-20 px-2.5 py-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-500">điểm</span>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              {initialQuestion && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialQuestion);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Xóa câu hỏi này</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{initialQuestion ? 'Cập Nhật Câu Hỏi' : 'Lưu Câu Hỏi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
