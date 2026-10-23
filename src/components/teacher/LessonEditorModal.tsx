/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, Lesson } from '../../types';
import {
  X,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  FileSpreadsheet,
  Clock,
  RotateCcw,
  CheckCircle2,
  Infinity as InfinityIcon,
  Trash2,
} from 'lucide-react';

export interface LessonCreationQuestionOption {
  action: 'manual' | 'generate_sample' | 'open_import_word_pdf';
  sampleCount: number;
}

interface LessonEditorModalProps {
  isOpen: boolean;
  grade: GradeLevel;
  initialLesson?: Lesson | null;
  onClose: () => void;
  onSave: (
    lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    questionOption?: LessonCreationQuestionOption
  ) => void;
  onDelete?: (lesson: Lesson) => void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  grade,
  initialLesson,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(initialLesson?.title || '');
  const [description, setDescription] = useState(initialLesson?.description || '');
  const [allowReviewResults, setAllowReviewResults] = useState(
    initialLesson !== undefined && initialLesson !== null
      ? initialLesson.allowReviewResults
      : true
  );

  // Cấu hình thời gian làm bài (phút): 0 = Không giới hạn
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(
    initialLesson?.timeLimitMinutes !== undefined ? initialLesson.timeLimitMinutes : 15
  );

  // Cấu hình số lượt làm bài tối đa: 0 = Không giới hạn
  const [maxAttempts, setMaxAttempts] = useState<number>(
    initialLesson?.maxAttempts !== undefined ? initialLesson.maxAttempts : 10
  );

  // Tuỳ chọn khởi tạo câu hỏi khi thêm bài học mới
  const [questionAction, setQuestionAction] = useState<
    'manual' | 'generate_sample' | 'open_import_word_pdf'
  >('manual');
  const [sampleCount, setSampleCount] = useState<number>(5);
  const [customSampleCountInput, setCustomSampleCountInput] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên bài học!');
      return;
    }

    const effectiveTimeLimit = Math.max(0, Number(timeLimitMinutes) || 0);
    const effectiveMaxAttempts = Math.max(0, Number(maxAttempts) || 0);

    const effectiveSampleCount =
      customSampleCountInput && Number(customSampleCountInput) > 0
        ? Number(customSampleCountInput)
        : sampleCount || 5;

    onSave(
      {
        id: initialLesson?.id,
        grade,
        title: title.trim(),
        subject: 'Tin học',
        description: description.trim(),
        allowReviewResults,
        timeLimitMinutes: effectiveTimeLimit,
        maxAttempts: effectiveMaxAttempts,
      },
      !initialLesson
        ? {
            action: questionAction,
            sampleCount: effectiveSampleCount,
          }
        : undefined
    );
    onClose();
  };

  const timePresets = [
    { value: 0, label: 'Không giới hạn' },
    { value: 5, label: '5 phút' },
    { value: 10, label: '10 phút' },
    { value: 15, label: '15 phút' },
    { value: 20, label: '20 phút' },
    { value: 30, label: '30 phút' },
    { value: 45, label: '45 phút (1 tiết)' },
    { value: 60, label: '60 phút' },
  ];

  const attemptPresets = [
    { value: 0, label: 'Không giới hạn' },
    { value: 1, label: '1 lượt (Kiểm tra)' },
    { value: 2, label: '2 lượt' },
    { value: 3, label: '3 lượt' },
    { value: 5, label: '5 lượt' },
    { value: 10, label: '10 lượt' },
  ];

  const questionQuantityPresets = [5, 10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialLesson ? 'Chỉnh Sửa Bài Học' : `Thêm Bài Học Mới (Khối ${grade})`}
            </h3>
            <p className="text-xs text-slate-500">
              Cấu hình thời gian làm bài, số lượt ôn tập và cách thức tạo câu hỏi
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

          {/* Môn học: Cố định cho Tin học */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Môn học áp dụng
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-sm font-bold text-indigo-950">Tin học</span>
                <span className="text-[10px] font-semibold bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-md">
                  Môn học áp dụng duy nhất
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Khối {grade}</span>
            </div>
          </div>

          {/* Tên bài học */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên bài học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Bài 2: Biểu diễn thuật toán và cấu trúc rẽ nhánh"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mô tả ngắn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả nội dung / Mục tiêu bài học
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt kiến thức trọng tâm hoặc lưu ý cho học sinh..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 1. CẤU HÌNH THỜI GIAN LÀM BÀI */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Cấu hình thời gian làm bài của học sinh:</span>
              </label>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                {timeLimitMinutes === 0 ? 'Không giới hạn thời gian' : `${timeLimitMinutes} phút`}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {timePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTimeLimitMinutes(preset.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    timeLimitMinutes === preset.value
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Hoặc nhập số phút tùy chỉnh */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span>Hoặc nhập số phút tùy chỉnh:</span>
              <input
                type="number"
                min="0"
                max="300"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
              <span className="text-[11px] text-slate-400">(0 = Tự do)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              * Nếu chọn <strong>0 phút (Không giới hạn)</strong>, học sinh sẽ làm bài tự do mà không bị đếm ngược áp lực.
            </p>
          </div>

          {/* 2. CẤU HÌNH SỐ LƯỢT ÔN TẬP */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Cấu hình số lượt học sinh được tham gia ôn tập:</span>
              </label>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {maxAttempts === 0 ? 'Không giới hạn số lượt' : `Tối đa ${maxAttempts} lượt`}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {attemptPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setMaxAttempts(preset.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    maxAttempts === preset.value
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Hoặc nhập số lượt tùy chỉnh */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span>Hoặc nhập số lượt tối đa:</span>
              <input
                type="number"
                min="0"
                max="999"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
              />
              <span className="text-[11px] text-slate-400">(0 = Không giới hạn)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              * Giáo viên có thể đặt <strong>1 lượt</strong> cho bài kiểm tra 15 phút / 1 tiết, hoặc <strong>Không giới hạn</strong> để học sinh tự do luyện thi nhiều lần.
            </p>
          </div>

          {/* Cài đặt bài học: Tuỳ chọn xem thống kê kết quả */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReviewResults}
                onChange={(e) => setAllowReviewResults(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  {allowReviewResults ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Cho phép học sinh xem thống kê kết quả sau khi làm xong</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {allowReviewResults
                    ? 'Học sinh sẽ thấy điểm số, số câu đúng/sai và phân tích đáp án chi tiết ngay khi nộp bài.'
                    : 'Học sinh chỉ nhận thông báo "Đã nộp bài thành công" mà không xem được điểm và đáp án chi tiết.'}
                </p>
              </div>
            </label>
          </div>

          {/* 3. ĐẶC BIỆT KHI THÊM MỚI: CHỦ ĐỘNG TẠO SỐ LƯỢNG CÂU HỎI (KHÔNG GIỚI HẠN) HOẶC TỪ FILE WORD / PDF */}
          {!initialLesson && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Chủ động tạo / thêm câu hỏi cho bài học mới:</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Không giới hạn số câu
                </span>
              </div>

              <div className="space-y-2">
                {/* Cách 1: Tự tạo thủ công từng câu */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    questionAction === 'manual'
                      ? 'bg-white border-indigo-500 shadow-2xs ring-1 ring-indigo-400'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="questionAction"
                    checked={questionAction === 'manual'}
                    onChange={() => setQuestionAction('manual')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Tạo bài học trống, sau đó tự thêm từng câu hỏi (Không giới hạn)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Chủ động soạn thảo các dạng: Trắc nghiệm 4 lựa chọn, Điền khuyết, Kéo thả, Tự luận sau khi bài được tạo.
                    </span>
                  </div>
                </label>

                {/* Cách 2: Khởi tạo sẵn số lượng câu hỏi */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    questionAction === 'generate_sample'
                      ? 'bg-white border-indigo-500 shadow-2xs ring-1 ring-indigo-400'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="questionAction"
                    checked={questionAction === 'generate_sample'}
                    onChange={() => setQuestionAction('generate_sample')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Khởi tạo nhanh danh sách câu hỏi 4 dạng (Khuyên dùng)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tự động tạo số lượng câu hỏi tùy ý với 4 dạng bài tập theo chương trình Tin học {grade}.
                    </span>

                    {questionAction === 'generate_sample' && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Chọn số lượng câu hỏi muốn tạo:</span>
                          <span className="text-[10px] font-bold text-indigo-600">Không giới hạn</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {questionQuantityPresets.map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setSampleCount(num);
                                setCustomSampleCountInput('');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                sampleCount === num && !customSampleCountInput
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {num} câu
                            </button>
                          ))}
                        </div>

                        {/* Ô nhập số lượng câu hỏi tùy ý */}
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                          <span>Hoặc nhập số câu tùy ý:</span>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            placeholder="Ví dụ: 35"
                            value={customSampleCountInput}
                            onChange={(e) => {
                              setCustomSampleCountInput(e.target.value);
                              if (Number(e.target.value) > 0) {
                                setSampleCount(Number(e.target.value));
                              }
                            }}
                            className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                          />
                          <span className="text-[11px] text-indigo-600 font-semibold">câu hỏi</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Cách 3: Nhập từ tệp Word / PDF */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    questionAction === 'open_import_word_pdf'
                      ? 'bg-white border-indigo-500 shadow-2xs ring-1 ring-indigo-400'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="questionAction"
                    checked={questionAction === 'open_import_word_pdf'}
                    onChange={() => setQuestionAction('open_import_word_pdf')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nhập danh sách câu hỏi từ tệp Word (.docx) hoặc PDF (.pdf)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Bóc tách toàn bộ câu hỏi trong tệp văn bản Word hoặc PDF của thầy cô (nhận diện không giới hạn số lượng câu hỏi).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              {initialLesson && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialLesson);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Xóa bài học này</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialLesson ? 'Lưu Cấu Hình Bài Học' : 'Tạo Bài Học Mới'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
