/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lesson, Question, StudentAnswer, Submission, User } from '../../types';
import {
  canStudentAttempt,
  MAX_ATTEMPTS,
  recordSubmission,
} from '../../services/storageService';
import { DragDropQuestion } from '../common/DragDropQuestion';
import { QuizResultModal } from './QuizResultModal';
import {
  ArrowLeft,
  Clock,
  Send,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

interface QuizRunnerProps {
  lesson: Lesson;
  questions: Question[];
  student: User;
  onExit: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  lesson,
  questions,
  student,
  onExit,
}) => {
  // Trạng thái các câu trả lời của học sinh: questionId -> StudentAnswer
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});

  // Chỉ số câu hỏi hiện tại đang xem (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Bộ đếm thời gian làm bài (tính bằng giây)
  const [secondsSpent, setSecondsSpent] = useState(0);

  // Kết quả sau khi nộp
  const [latestSubmission, setLatestSubmission] = useState<Submission | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Kiểm tra lượt làm bài còn lại theo cấu hình của giáo viên
  const attemptInfo = canStudentAttempt(student.id, lesson.id, student.fullName, student.className);

  const hasTimeLimit = Boolean(lesson.timeLimitMinutes && lesson.timeLimitMinutes > 0);
  const totalAllowedSeconds = hasTimeLimit ? (lesson.timeLimitMinutes as number) * 60 : 0;
  const remainingSeconds = hasTimeLimit ? Math.max(0, totalAllowedSeconds - secondsSpent) : 0;

  // Bắt đầu đếm thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tự động nộp bài khi hết giờ (nếu bài học có cài đặt thời gian)
  useEffect(() => {
    if (hasTimeLimit && remainingSeconds === 0 && secondsSpent > 0 && !latestSubmission && !isResultModalOpen) {
      doSubmitQuiz();
    }
  }, [hasTimeLimit, remainingSeconds, secondsSpent, latestSubmission, isResultModalOpen]);

  // Format thời gian: MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  // Helper cập nhật câu trả lời
  const updateAnswer = (qId: string, partial: Partial<StudentAnswer>) => {
    setAnswers((prev) => {
      const existing = prev[qId] || {
        questionId: qId,
        type: currentQuestion.type,
      };
      return {
        ...prev,
        [qId]: { ...existing, ...partial },
      };
    });
  };

  // Kiểm tra câu hỏi đã được làm chưa
  const isQuestionAnswered = (q: Question): boolean => {
    const ans = answers[q.id];
    if (!ans) return false;

    if (q.type === 'multiple_choice') {
      return Boolean(ans.selectedOptionId);
    }
    if (q.type === 'fill_in_the_blank') {
      return Boolean(ans.textResponse && ans.textResponse.trim().length > 0);
    }
    if (q.type === 'drag_and_drop') {
      const mapping = ans.dragDropMapping || {};
      const requiredCount = q.dragDropPairs?.length || 0;
      return Object.keys(mapping).length >= requiredCount && requiredCount > 0;
    }
    if (q.type === 'essay') {
      return Boolean(ans.textResponse && ans.textResponse.trim().length > 0);
    }
    return false;
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // Hàm nộp bài thực tế
  const doSubmitQuiz = () => {
    const studentAnswersList: StudentAnswer[] = questions.map((q) => {
      return (
        answers[q.id] || {
          questionId: q.id,
          type: q.type,
        }
      );
    });

    const res = recordSubmission({
      lesson,
      student,
      questions,
      studentAnswers: studentAnswersList,
      timeSpentSeconds: secondsSpent,
    });

    if (res.success && res.submission) {
      setLatestSubmission(res.submission);
      setIsResultModalOpen(true);
    } else {
      setSubmissionError(res.message);
    }
  };

  // Xử lý nộp bài từ người dùng
  const handleSubmitQuiz = (isAutoSubmit?: boolean | React.MouseEvent) => {
    const isAuto = typeof isAutoSubmit === 'boolean' ? isAutoSubmit : false;
    const unAnsweredCount = questions.length - answeredCount;
    if (!isAuto && unAnsweredCount > 0) {
      setIsConfirmSubmitOpen(true);
      return;
    }
    doSubmitQuiz();
  };

  // Làm lại bài
  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSecondsSpent(0);
    setIsResultModalOpen(false);
    setLatestSubmission(null);
  };

  if (!attemptInfo.allowed) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
        <h3 className="text-lg font-bold text-slate-800">Đã đạt giới hạn số lượt ôn tập</h3>
        <p className="text-sm text-slate-600">
          Em đã hoàn thành bài học này <strong>{attemptInfo.count}/{attemptInfo.maxAttempts}</strong> lượt theo quy định của Giáo viên.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          Quay lại danh sách bài học
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <HelpCircle className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="text-lg font-bold text-slate-800">Bài học này chưa có câu hỏi</h3>
        <p className="text-sm text-slate-500">Giáo viên đang hoàn thiện nội dung. Vui lòng quay lại sau.</p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header thanh làm bài */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Thoát khỏi bài làm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Môn {lesson.subject || 'Tin học'} (Khối {lesson.grade})
                </span>
                {attemptInfo.isUnlimited ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>Lần thứ {attemptInfo.count + 1}</span>
                    <span className="text-[10px] text-slate-500">(Không giới hạn lượt)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Lần thứ {attemptInfo.count + 1}/{attemptInfo.maxAttempts}
                  </span>
                )}
                {student.fullName && (
                  <span className="text-[11px] font-bold text-slate-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Học sinh: {student.fullName} {student.className ? `(${student.className})` : ''}</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Đồng hồ: Đếm ngược nếu có thời gian, hoặc đếm tiến nếu tự do */}
            {hasTimeLimit ? (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs transition-colors ${
                  remainingSeconds <= 60
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : remainingSeconds <= 180
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                title={`Thời gian còn lại (Quy định: ${lesson.timeLimitMinutes} phút)`}
              >
                <Clock className={`w-4 h-4 ${remainingSeconds <= 60 ? 'text-rose-600' : 'text-indigo-600'}`} />
                <span>{formatTime(remainingSeconds)}</span>
                {remainingSeconds <= 60 && (
                  <span className="text-[10px] text-rose-600 font-bold uppercase ml-0.5">Sắp hết giờ!</span>
                )}
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 font-mono font-bold text-slate-700 text-xs border border-slate-200"
                title="Thời gian đã làm (Không giới hạn)"
              >
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{formatTime(secondsSpent)}</span>
                <span className="text-[10px] text-slate-400 font-medium ml-0.5">(Tự do)</span>
              </div>
            )}

            {/* Nút Nộp Bài */}
            <button
              type="button"
              onClick={() => handleSubmitQuiz(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>
              Tiến độ làm bài:{' '}
              <strong className="text-indigo-600">
                {answeredCount}/{questions.length} câu
              </strong>
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Dải nút chuyển nhanh giữa các câu hỏi */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q);
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-xs'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={`Câu ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung nội dung câu hỏi hiện tại */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-xs space-y-4 sm:space-y-6">
          {/* Header câu hỏi */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Câu {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Trọng số: {currentQuestion.points} điểm
            </span>
          </div>

          {/* Đề bài */}
          <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.prompt}
          </div>

          {/* KHUNG TƯƠNG TÁC ĐÁP ÁN (THEO ĐÚNG 4 DẠNG GIÁO VIÊN CÀI ĐẶT) */}
          <div className="pt-2">
            {/* 1. TRẮC NGHIỆM 4 LỰA CHỌN */}
            {currentQuestion.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((opt, idx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isSelected = answers[currentQuestion.id]?.selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateAnswer(currentQuestion.id, {
                          selectedOptionId: opt.id,
                        })
                      }
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 sm:gap-3.5 cursor-pointer active:scale-[0.99] touch-manipulation min-h-[48px] ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-300'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {letters[idx]}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-800 pt-0.5 leading-snug">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. TRẮC NGHIỆM TRẢ LỜI NGẮN (ĐIỀN KHUYẾT) */}
            {currentQuestion.type === 'fill_in_the_blank' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Gõ câu trả lời của em vào ô bên dưới:
                </label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={answers[currentQuestion.id]?.textResponse || ''}
                    onChange={(e) =>
                      updateAnswer(currentQuestion.id, {
                        textResponse: e.target.value,
                      })
                    }
                    placeholder="Nhập từ, cụm từ hoặc số..."
                    className="w-full px-4 py-3 text-base rounded-xl border-2 border-indigo-200 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition min-h-[48px]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">
                    * Hệ thống không phân biệt chữ in hoa và chữ thường.
                  </p>
                </div>
              </div>
            )}

            {/* 3. CÂU HỎI KÉO THẢ (DRAG & DROP) */}
            {currentQuestion.type === 'drag_and_drop' && currentQuestion.dragDropPairs && (
              <DragDropQuestion
                pairs={currentQuestion.dragDropPairs}
                currentMapping={answers[currentQuestion.id]?.dragDropMapping || {}}
                onChange={(mapping) =>
                  updateAnswer(currentQuestion.id, {
                    dragDropMapping: mapping,
                  })
                }
              />
            )}

            {/* 4. TỰ LUẬN (ESSAY) */}
            {currentQuestion.type === 'essay' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Viết câu trả lời tự luận:
                </label>
                <textarea
                  rows={5}
                  value={answers[currentQuestion.id]?.textResponse || ''}
                  onChange={(e) =>
                    updateAnswer(currentQuestion.id, {
                      textResponse: e.target.value,
                    })
                  }
                  placeholder="Gõ nội dung giải thích, lập luận chi tiết tại đây..."
                  className="w-full p-4 text-sm rounded-2xl border-2 border-indigo-200 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            )}
          </div>

          {/* Nút điều hướng trước / sau */}
          <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between gap-2.5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[42px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors cursor-pointer min-h-[42px]"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[42px]"
              >
                <span>Nộp bài ngay</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal kết quả bài thi sau khi nộp */}
      {latestSubmission && (
        <QuizResultModal
          isOpen={isResultModalOpen}
          submission={latestSubmission}
          lesson={lesson}
          questions={questions}
          canRetry={attemptInfo.allowed}
          remainingAttempts={attemptInfo.remaining}
          onRetry={handleRetry}
          onGoHome={onExit}
        />
      )}

      {/* Modal xác nhận nộp bài khi chưa làm xong hết câu hỏi */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Xác nhận nộp bài</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Em còn <strong>{questions.length - answeredCount} câu hỏi</strong> chưa hoàn thành. Em có chắc chắn muốn nộp bài ngay bây giờ không?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmSubmitOpen(false);
                  doSubmitQuiz();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông báo lỗi khi không thể nộp bài */}
      {submissionError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Thông báo từ hệ thống</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{submissionError}</p>
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSubmissionError(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
