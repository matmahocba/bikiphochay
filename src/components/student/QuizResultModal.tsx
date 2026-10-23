/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Lesson, Question, Submission } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  Clock,
  Sparkles,
  HelpCircle,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface QuizResultModalProps {
  isOpen: boolean;
  submission: Submission;
  lesson: Lesson;
  questions: Question[];
  onRetry: () => void;
  onGoHome: () => void;
  canRetry: boolean;
  remainingAttempts: number;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({
  isOpen,
  submission,
  lesson,
  questions,
  onRetry,
  onGoHome,
  canRetry,
  remainingAttempts,
}) => {
  useEffect(() => {
    if (isOpen && lesson.allowReviewResults && submission.score >= 8) {
      // Bắn pháo hoa ăn mừng khi học sinh đạt điểm cao (>= 8.0)
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.warn('Confetti error', err);
      }
    }
  }, [isOpen, lesson.allowReviewResults, submission.score]);

  if (!isOpen) return null;

  const minutes = Math.floor((submission.timeSpentSeconds || 0) / 60);
  const seconds = (submission.timeSpentSeconds || 0) % 60;
  const timeSpentFormatted = `${minutes}m ${seconds}s`;

  // Trường hợp 1: Giáo viên TẮT quyền xem thống kê kết quả (YÊU CẦU ĐỀ BÀI)
  if (!lesson.allowReviewResults) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Đã nộp bài thành công!</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Hệ thống đã ghi nhận bài ôn tập của em cho bài học{' '}
              <strong>"{lesson.title}"</strong> (Lần nộp thứ {submission.attemptNumber}/10).
            </p>
          </div>

          {/* Hộp giải thích cài đặt của giáo viên */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Quy định từ Giáo viên:</span>
              Giáo viên đã tắt tính năng xem chi tiết kết quả cho bài học này. Kết quả ôn tập đã được lưu trữ an toàn để Giáo viên tổng hợp và đánh giá.
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onGoHome}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Quay về Danh sách bài</span>
            </button>

            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại (Còn {remainingAttempts} lượt)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp 2: Giáo viên BẬT quyền xem thống kê kết quả (YÊU CẦU ĐỀ BÀI)
  const isHigh = submission.score >= 8;
  const isPass = submission.score >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Banner điểm số */}
        <div
          className={`p-6 sm:p-8 text-white text-center relative overflow-hidden ${
            isHigh
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
              : isPass
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700'
              : 'bg-gradient-to-br from-rose-600 to-pink-700'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
            <Trophy className="w-9 h-9 text-amber-300" />
          </div>

          <span className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Kết Quả Ôn Tập - Lần {submission.attemptNumber}/10
          </span>

          <div className="mt-3 text-5xl sm:text-6xl font-black tracking-tight">
            {submission.score.toFixed(1)}
            <span className="text-2xl font-semibold opacity-80"> / 10</span>
          </div>

          <p className="mt-2 text-sm text-white/90 font-medium">
            {isHigh
              ? '🎉 Xuất sắc! Em đã nắm rất vững kiến thức bài học.'
              : isPass
              ? '👍 Khá tốt! Hãy xem lại các câu chưa chính xác để hoàn thiện hơn nhé.'
              : '💪 Cần cố gắng thêm! Hãy xem kỹ lời giải thích và thử lại.'}
          </p>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-center gap-6 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              Đúng: {submission.correctCount}/{submission.totalQuestions} câu
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-white/70" />
              Thời gian: {timeSpentFormatted}
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-white/70" />
              Còn lại: {remainingAttempts} lượt
            </span>
          </div>
        </div>

        {/* Phân tích chi tiết từng câu hỏi */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Phân tích đáp án chi tiết:
            </h4>
            <span className="text-xs text-slate-400">
              {submission.totalQuestions} câu hỏi
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const studentAns = submission.answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAns?.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                        {q.prompt}
                      </h5>
                    </div>

                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng (+{q.points}đ)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5" /> Sai (0đ)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết theo dạng câu hỏi */}
                  <div className="pl-7 text-xs space-y-1.5">
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-1">
                        <div className="text-slate-600">
                          Đáp án của em:{' '}
                          <span
                            className={
                              isCorrect ? 'font-bold text-emerald-700' : 'font-bold text-rose-600'
                            }
                          >
                            {q.options?.find((o) => o.id === studentAns?.selectedOptionId)?.text ||
                              '(Chưa chọn)'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="text-emerald-700 font-medium">
                            Đáp án chính xác:{' '}
                            <strong>
                              {q.options?.find((o) => o.id === q.correctOptionId)?.text}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'fill_in_the_blank' && (
                      <div className="space-y-1">
                        <div className="text-slate-600">
                          Câu trả lời của em:{' '}
                          <span
                            className={`font-mono px-1.5 py-0.5 rounded ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {studentAns?.textResponse || '(Để trống)'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="text-emerald-700 font-medium">
                            Đáp án chấp nhận:{' '}
                            <strong>{q.acceptableAnswers?.join(' hoặc ')}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'drag_and_drop' && (
                      <div className="space-y-1 bg-white/70 p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[11px]">
                          Vị trí xếp ghép:
                        </span>
                        {q.dragDropPairs?.map((pair) => {
                          const userPlaced = studentAns?.dragDropMapping?.[pair.id];
                          const pairMatch = userPlaced === pair.itemText;

                          return (
                            <div
                              key={pair.id}
                              className={`text-[11px] flex items-center justify-between py-0.5 ${
                                pairMatch ? 'text-emerald-800' : 'text-rose-700 font-medium'
                              }`}
                            >
                              <span>• {pair.slotLabel}</span>
                              <span>
                                {pairMatch ? (
                                  `✓ ${userPlaced}`
                                ) : (
                                  <>
                                    <span className="line-through">{userPlaced || '(trống)'}</span>{' '}
                                    ➔ <strong>{pair.itemText}</strong>
                                  </>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className="space-y-1">
                        <span className="text-slate-500 block">Bài làm tự luận của em:</span>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap">
                          {studentAns?.textResponse || '(Chưa làm)'}
                        </div>
                        {q.essayGuide && (
                          <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-md">
                            💡 <strong>Gợi ý đáp án:</strong> {q.essayGuide}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Giải thích câu hỏi */}
                    {q.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-600 flex items-start gap-1.5 italic text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer hành động */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {canRetry ? (
              <span>
                Em còn <strong>{remainingAttempts}</strong> lượt làm lại cho bài này.
              </span>
            ) : (
              <span className="text-rose-600 font-bold">
                ⚠️ Đã hết 10/10 lượt làm bài cho nội dung này.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onGoHome}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </button>

            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm Lại Lần {submission.attemptNumber + 1}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
