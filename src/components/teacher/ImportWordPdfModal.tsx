/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Lesson, Question } from '../../types';
import {
  extractTextFromFile,
  parseQuestionsFromText,
  ParsedQuestion,
  downloadSampleWordTemplate,
  SAMPLE_QUESTIONS_WORD_TEXT,
} from '../../services/questionParser';
import { saveQuestionsBatch } from '../../services/storageService';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Edit2,
  BookOpen,
} from 'lucide-react';

interface ImportWordPdfModalProps {
  isOpen: boolean;
  lesson: Lesson;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const ImportWordPdfModal: React.FC<ImportWordPdfModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý khi chọn file từ máy tính
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      const extractedText = await extractTextFromFile(file);
      if (!extractedText.trim()) {
        throw new Error('Tệp không chứa văn bản hoặc không thể trích xuất nội dung.');
      }

      const questions = parseQuestionsFromText(extractedText, lesson.id);
      if (questions.length === 0) {
        setError(
          'Không tìm thấy câu hỏi nào theo định dạng chuẩn. Bạn có thể mở mục "Xem hướng dẫn định dạng" để kiểm tra cấu trúc câu hỏi, hoặc chuyển sang tab "Dán nội dung từ văn bản".'
        );
      } else {
        setParsedQuestions(questions);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Có lỗi xảy ra khi đọc tệp. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý khi phân tích từ văn bản dán
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setError('Vui lòng dán nội dung văn bản đề thi vào khung bên dưới!');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const questions = parseQuestionsFromText(pastedText, lesson.id);
      if (questions.length === 0) {
        setError(
          'Không nhận diện được câu hỏi nào. Hãy chắc chắn các câu có tiền tố như: "Câu 1:", "Câu 2:" và các phương án A, B, C, D.'
        );
      } else {
        setParsedQuestions(questions);
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi phân tích cú pháp câu hỏi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Nạp dữ liệu mẫu để giáo viên thử nghiệm ngay
  const handleLoadSample = () => {
    setPastedText(SAMPLE_QUESTIONS_WORD_TEXT);
    const questions = parseQuestionsFromText(SAMPLE_QUESTIONS_WORD_TEXT, lesson.id);
    setParsedQuestions(questions);
    setError(null);
  };

  // Xóa câu hỏi khỏi danh sách xem trước
  const handleRemoveQuestion = (index: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Thay đổi đáp án đúng của câu trắc nghiệm trong danh sách xem trước
  const handleChangeCorrectOption = (qIndex: number, optId: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctOptionId: optId };
      return copy;
    });
  };

  // Xác nhận nhập vào bài học
  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) {
      setError('Chưa có câu hỏi nào để nhập vào bài học!');
      return;
    }

    // Chuyển đổi ParsedQuestion sang Omit<Question, 'id'> & { id?: string }
    const questionsToSave: Array<Omit<Question, 'id'> & { id?: string }> = parsedQuestions.map(
      (pq) => ({
        lessonId: lesson.id,
        type: pq.type,
        prompt: pq.prompt,
        points: pq.points || 2.5,
        explanation: pq.explanation,
        options: pq.options,
        correctOptionId: pq.correctOptionId,
        acceptableAnswers: pq.acceptableAnswers,
        dragDropPairs: pq.dragDropPairs,
        essayGuide: pq.essayGuide,
      })
    );

    saveQuestionsBatch(questionsToSave);
    onImportSuccess(questionsToSave.length);
    onClose();
  };

  // Thống kê các dạng câu hỏi
  const countsByType = {
    multiple_choice: parsedQuestions.filter((q) => q.type === 'multiple_choice').length,
    fill_in_the_blank: parsedQuestions.filter((q) => q.type === 'fill_in_the_blank').length,
    drag_and_drop: parsedQuestions.filter((q) => q.type === 'drag_and_drop').length,
    essay: parsedQuestions.filter((q) => q.type === 'essay').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Thêm Danh Sách Câu Hỏi từ Tệp Word / PDF</span>
                <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Khối {lesson.grade} - {lesson.title}
                </span>
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Hỗ trợ tải lên tệp Word (.docx), PDF (.pdf) hoặc dán trực tiếp nội dung đề thi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs & Subheader */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải tệp Word / PDF (.docx, .pdf)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dán văn bản từ Word / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleWordTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Tải file mẫu đề thi chuẩn định dạng"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file đề mẫu (.txt)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Ẩn hướng dẫn' : 'Xem cấu trúc định dạng'}</span>
            </button>
          </div>
        </div>

        {/* Hướng dẫn cấu trúc nếu bấm xem */}
        {showGuide && (
          <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Quy ước định dạng nhận diện 4 dạng câu hỏi trong file Word / PDF:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900 block mb-1">
                  1. Trắc nghiệm 4 lựa chọn (A, B, C, D):
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-slate-700 text-[10px] font-mono whitespace-pre">
                  {`Câu 1: Thiết bị nào là thiết bị vào?
A. Chuột
B. Màn hình
C. Máy in
D. Loa
Đáp án: A`}
                </code>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                <span className="font-bold text-blue-900 block mb-1">
                  2. Trả lời ngắn / Điền khuyết:
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-slate-700 text-[10px] font-mono whitespace-pre">
                  {`Câu 2: [Điền khuyết] 1 Byte gồm có mấy bit?
Đáp án: 8, 8 bit
Giải thích: 1 byte = 8 bit.`}
                </code>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                <span className="font-bold text-purple-900 block mb-1">
                  3. Kéo thả / Ghép nối thẻ:
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-slate-700 text-[10px] font-mono whitespace-pre">
                  {`Câu 3: [Kéo thả] Ghép các bộ nhớ:
- RAM -> Bộ nhớ tạm thời
- ROM -> Bộ nhớ chỉ đọc`}
                </code>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                <span className="font-bold text-amber-900 block mb-1">
                  4. Tự luận (Học sinh gõ trả lời):
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-slate-700 text-[10px] font-mono whitespace-pre">
                  {`Câu 4: [Tự luận] Nêu lợi ích của mạng Internet?
Hướng dẫn chấm: Cho phép chia sẻ dữ liệu...`}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Nội dung chính Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Thông báo phân tích tệp:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Tải tệp lên */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Kéo & thả hoặc bấm vào đây để chọn tệp Word (.docx) hoặc PDF (.pdf)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hệ thống sẽ tự động quét, trích xuất nội dung và phân loại 4 dạng câu hỏi
                  </p>
                </div>
                {selectedFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 shadow-2xs">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 p-4 text-indigo-700 text-xs font-bold">
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang đọc và phân tích cấu trúc đề thi từ tệp...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Dán văn bản */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Dán nội dung đề thi từ tệp Word hoặc PDF vào đây:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dán nội dung mẫu Tin học</span>
                </button>
              </div>

              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Ví dụ:&#10;Câu 1: Thiết bị nào là thiết bị vào?&#10;A. Chuột&#10;B. Màn hình&#10;C. Máy in&#10;D. Loa&#10;Đáp án: A&#10;Giải thích: Chuột dùng để nhập lệnh..."
                className="w-full p-3.5 text-xs font-mono rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim() || isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân tích câu hỏi từ văn bản</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* KẾT QUẢ PHÂN TÍCH: BẢNG PREVIEW VÀ CHỈNH SỬA NHANH */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã nhận diện thành công: {parsedQuestions.length} câu hỏi</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Trắc nghiệm: {countsByType.multiple_choice}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                      Điền khuyết: {countsByType.fill_in_the_blank}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                      Kéo thả: {countsByType.drag_and_drop}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                      Tự luận: {countsByType.essay}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Giáo viên có thể kiểm tra và chọn lại đáp án đúng trước khi nhập
                </div>
              </div>

              {/* Danh sách các câu hỏi Preview */}
              <div className="space-y-3">
                {parsedQuestions.map((q, qIndex) => {
                  return (
                    <div
                      key={q.id || qIndex}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {qIndex + 1}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              q.type === 'multiple_choice'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.type === 'fill_in_the_blank'
                                ? 'bg-blue-100 text-blue-800'
                                : q.type === 'drag_and_drop'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {q.type === 'multiple_choice'
                              ? 'Trắc nghiệm 4 lựa chọn'
                              : q.type === 'fill_in_the_blank'
                              ? 'Trả lời ngắn / Điền khuyết'
                              : q.type === 'drag_and_drop'
                              ? 'Kéo thả ghép nối'
                              : 'Tự luận'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            • Điểm: {q.points}đ
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Loại bỏ câu này khỏi danh sách nhập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Đề bài câu hỏi */}
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">{q.prompt}</p>

                      {/* Chi tiết theo dạng */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt) => {
                            const isCorrect = q.correctOptionId === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleChangeCorrectOption(qIndex, opt.id)}
                                className={`text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span className="line-clamp-2">
                                  <strong>{opt.id.replace('opt_', '').toUpperCase()}.</strong>{' '}
                                  {opt.text}
                                </span>
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                    <Check className="w-3 h-3" /> Đúng
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'fill_in_the_blank' && (
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
                          <span className="font-bold">Đáp án được chấp nhận:</span>{' '}
                          {q.acceptableAnswers?.join(' | ') || '(Chưa có)'}
                        </div>
                      )}

                      {q.type === 'drag_and_drop' && q.dragDropPairs && (
                        <div className="space-y-1.5 text-xs">
                          <span className="font-bold text-slate-700">Các cặp kéo thả:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.dragDropPairs.map((pair, pIdx) => (
                              <div
                                key={pair.id || pIdx}
                                className="p-2 rounded-xl bg-purple-50/60 border border-purple-200 text-purple-950 flex items-center justify-between gap-2"
                              >
                                <span className="font-bold bg-white px-2 py-0.5 rounded shadow-2xs">
                                  {pair.itemText}
                                </span>
                                <span className="text-[10px] text-purple-600">ghép vào ➔</span>
                                <span className="text-slate-700 bg-purple-100/60 px-2 py-0.5 rounded">
                                  {pair.slotLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'essay' && (
                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                          <span className="font-bold">Hướng dẫn chấm:</span>{' '}
                          {q.essayGuide || '(Chưa có hướng dẫn)'}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                          💡 <strong>Lời giải / Giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedQuestions.length > 0 ? (
              <span>
                Sẵn sàng thêm <strong>{parsedQuestions.length}</strong> câu hỏi vào bài học.
              </span>
            ) : (
              <span>Vui lòng tải tệp hoặc dán nội dung để nhận diện câu hỏi.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedQuestions.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Nhập ({parsedQuestions.length}) Câu Hỏi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
