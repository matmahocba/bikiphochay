/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { GradeLevel, Lesson, User } from '../../types';
import {
  canStudentAttempt,
  getLessonsByGrade,
  getQuestionsByLesson,
  getStudentAttemptCount,
  getStudentSubmissions,
  MAX_ATTEMPTS,
} from '../../services/storageService';
import { QuizRunner } from './QuizRunner';
import {
  BookOpen,
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  History,
  Lock,
  Trophy,
  UserCog,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { StudentProfileModal } from './StudentProfileModal';

interface StudentDashboardProps {
  currentUser: User;
  initialGrade?: GradeLevel;
  onUpdateUser?: (user: User) => void;
  onBackToHome?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  initialGrade,
  onUpdateUser,
  onBackToHome,
}) => {
  const [version, setVersion] = useState(0);

  // Tự động cập nhật bài học và kết quả khi đồng bộ từ Cloud
  useEffect(() => {
    const handleDataSynced = () => setVersion((v) => v + 1);
    window.addEventListener('thcs_data_synced', handleDataSynced);
    return () => {
      window.removeEventListener('thcs_data_synced', handleDataSynced);
    };
  }, []);

  // Khối lớp đang hiển thị ôn tập: mặc định lấy theo khối của tài khoản học sinh
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    (initialGrade || currentUser.grade || 8) as GradeLevel
  );

  const activeGrade: GradeLevel = selectedGrade;

  // Bài học đang làm (nếu có thì chuyển sang màn hình QuizRunner)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Modal xem toàn bộ lịch sử ôn tập của học sinh
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Modal chỉnh sửa thông tin cá nhân học sinh khi có sai sót
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Lấy danh sách bài học theo khối đang chọn
  const lessons = getLessonsByGrade(activeGrade);

  // Tất cả bài nộp của học sinh này
  const studentAllSubmissions = useMemo(() => {
    return getStudentSubmissions(
      currentUser.id,
      undefined,
      currentUser.fullName,
      currentUser.className || undefined
    ).filter((sub) => sub.grade === activeGrade);
  }, [currentUser, activeGrade, version]);

  // Nếu đang trong quá trình làm bài: hiển thị QuizRunner
  if (activeLesson) {
    const questions = getQuestionsByLesson(activeLesson.id);

    return (
      <QuizRunner
        lesson={activeLesson}
        questions={questions}
        student={currentUser}
        onExit={() => {
          setActiveLesson(null);
          setVersion((v) => v + 1);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Banner Chào mừng Học sinh */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-950 text-white p-4 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Học sinh: {currentUser.fullName}</span>
              {currentUser.className && (
                <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black text-[10px] ml-1">
                  {currentUser.className}
                </span>
              )}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              <span>Môn học: Tin học</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
              <span>Khối {activeGrade}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xs leading-snug">
            Mật mã học bá - Bí kíp học hay
            <span className="block text-indigo-200 text-base sm:text-xl lg:text-2xl font-bold mt-1 tracking-normal">
              Cẩm nang ôn tập kiến thức Tin học 6789
            </span>
            <span className="inline-block text-xs sm:text-sm font-semibold text-indigo-200 mt-1">
              By Lê Quang Khánh
            </span>
          </h1>

          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl leading-relaxed font-medium">
            Chào mừng em <strong>{currentUser.fullName}</strong> {currentUser.className ? `(Lớp ${currentUser.className})` : `(Khối ${currentUser.grade || activeGrade})`}! Hãy chọn bài học bên dưới để bắt đầu ôn tập và rèn luyện kiến thức Tin học nhé.
          </p>
        </div>

        {/* Nút Xem lịch sử bài làm & Đổi thông tin cá nhân */}
        <div className="z-10 flex flex-wrap items-center gap-2.5 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer min-h-[40px]"
            title="Đổi họ tên hoặc thông tin lớp học nếu có sai sót"
          >
            <UserCog className="w-4 h-4 text-slate-900" />
            <span>Sửa thông tin của em</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-white/30 backdrop-blur-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer min-h-[40px]"
          >
            <History className="w-4 h-4 text-amber-300" />
            <span>Lịch sử ôn tập ({studentAllSubmissions.length} bài)</span>
          </button>
        </div>
      </div>

      {/* LỰA CHỌN KHỐI LỚP TIN HỌC (Khối 6, 7, 8, 9) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:hidden">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Khối Ôn Tập:</span>
          </div>
          <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2">
            {([6, 7, 8, 9] as GradeLevel[]).map((g) => {
              const isSelected = activeGrade === g;
              const count = getLessonsByGrade(g).length;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 min-h-[42px] ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Tin {g}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count} bài
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span>
            Đang xem: <strong>{lessons.length}</strong> bài học môn <strong>Tin học {activeGrade}</strong>
          </span>
          {currentUser.className && (
            <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
              Lớp {currentUser.className}
            </span>
          )}
        </div>
      </div>

      {/* Danh sách các bài học của Khối */}
      {lessons.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="text-base font-semibold text-slate-600">
            Môn Tin học {activeGrade} hiện chưa có bài học nào.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng thông báo cho Thầy giáo Lê Quang Khánh cập nhật thêm bài học cho Khối {activeGrade} nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {lessons.map((lesson) => {
            const questions = getQuestionsByLesson(lesson.id);
            const attemptCount = getStudentAttemptCount(
              currentUser.id,
              lesson.id,
              currentUser.fullName,
              currentUser.className || undefined
            );
            const attemptInfo = canStudentAttempt(
              currentUser.id,
              lesson.id,
              currentUser.fullName,
              currentUser.className || undefined
            );
            const allowed = attemptInfo.allowed;
            const maxAttempts = attemptInfo.maxAttempts;
            const isUnlimited = attemptInfo.isUnlimited;
            const remaining = attemptInfo.remaining;

            // Lấy điểm cao nhất của học sinh này ở bài này
            const pastSubs = getStudentSubmissions(
              currentUser.id,
              lesson.id,
              currentUser.fullName,
              currentUser.className || undefined
            );
            const highestScore =
              pastSubs.length > 0
                ? Math.max(...pastSubs.map((s) => s.score)).toFixed(1)
                : null;

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Header thẻ bài học */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Môn {lesson.subject || 'Tin học'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        Khối {lesson.grade}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {lesson.timeLimitMinutes && lesson.timeLimitMinutes > 0
                        ? `${lesson.timeLimitMinutes} phút`
                        : 'Tự do'}
                    </span>
                  </div>

                  {/* Tiêu đề & mô tả */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug line-clamp-2">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {lesson.description || 'Bài học ôn tập kiến thức trọng tâm.'}
                    </p>
                  </div>

                  {/* Thông tin câu hỏi & điểm cao nhất */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">
                      Số câu hỏi: <strong>{questions.length}</strong> câu
                    </span>
                    {highestScore !== null && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        Cao nhất: {highestScore}/10
                      </span>
                    )}
                  </div>

                  {/* Tiến trình giới hạn lượt làm bài theo cấu hình giáo viên */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Lượt ôn tập:</span>
                      {isUnlimited ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Đã làm {attemptCount} lần (Không giới hạn)
                        </span>
                      ) : (
                        <span
                          className={`font-bold ${
                            allowed ? 'text-indigo-700' : 'text-rose-600'
                          }`}
                        >
                          {attemptCount} / {maxAttempts} lượt
                        </span>
                      )}
                    </div>

                    {!isUnlimited && (
                      <>
                        {/* Progress bar số lượt */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              attemptCount >= maxAttempts
                                ? 'bg-rose-500'
                                : attemptCount > maxAttempts * 0.7
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{
                              width: `${Math.min(100, (attemptCount / maxAttempts) * 100)}%`,
                            }}
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 text-right">
                          {allowed ? (
                            <span>Còn lại {remaining} lượt thử</span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center justify-end gap-1">
                              <Lock className="w-3 h-3" /> Đã dùng hết {maxAttempts} lượt
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* NÚT VÀO LÀM BÀI: VÀO THẲNG BÀI LÀM VỚI TÀI KHOẢN ĐÃ ĐĂNG NHẬP */}
                <div className="pt-2">
                  {allowed ? (
                    <button
                      type="button"
                      disabled={questions.length === 0}
                      onClick={() => setActiveLesson(lesson)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:from-indigo-800 active:to-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {attemptCount === 0 ? (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Vào Làm Bài</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Làm Lại Bài (Lần {attemptCount + 1})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                      title="Em đã hoàn thành tối đa số lượt ôn tập cho bài học này"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Đã hết lượt ôn tập</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lịch sử bài làm của học sinh */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Lịch Sử Ôn Tập Của Em</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {studentAllSubmissions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">Em chưa làm bài ôn tập nào.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hãy chọn một bài học ở trên và bấm "Vào làm bài" nhé!
                  </p>
                </div>
              ) : (
                studentAllSubmissions.map((sub) => {
                  const submitDate = new Date(sub.submittedAt);
                  const formattedDate = !isNaN(submitDate.getTime())
                    ? submitDate.toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : sub.submittedAt;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            Môn {sub.subject || 'Tin học'}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Khối {sub.grade}
                          </span>
                          <span className="text-xs text-slate-400">
                            Lần thứ {sub.attemptNumber}/10
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">
                          {sub.lessonTitle}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Thời gian: {formattedDate} • Đúng {sub.correctCount}/{sub.totalQuestions} câu
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-600">
                          {sub.score.toFixed(1)}
                          <span className="text-xs font-normal text-slate-400"> /10</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa thông tin cá nhân học sinh khi có sai sót */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateSuccess={(updatedUser) => {
          onUpdateUser?.(updatedUser);
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
};
