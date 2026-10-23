/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, Lesson, User } from '../../types';
import {
  canStudentAttempt,
  getGuestStudentSession,
  saveGuestStudentSession,
  MAX_ATTEMPTS,
} from '../../services/storageService';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  X,
  Play,
  Clock,
  Layers,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface StudentPracticeInfoModalProps {
  isOpen: boolean;
  lesson: Lesson | null;
  currentStudent: User | null;
  onStartPractice: (student: User) => void;
  onClose: () => void;
}

export const StudentPracticeInfoModal: React.FC<StudentPracticeInfoModalProps> = ({
  isOpen,
  lesson,
  currentStudent,
  onStartPractice,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(8);
  const [className, setClassName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo thông tin từ currentStudent hoặc guest session đã lưu
  useEffect(() => {
    if (isOpen) {
      setError(null);
      const guestSession = getGuestStudentSession();

      const initialName = currentStudent?.fullName || guestSession?.fullName || '';
      const initialGrade = (lesson?.grade || currentStudent?.grade || guestSession?.grade || 8) as GradeLevel;
      const initialClass = currentStudent?.className || guestSession?.className || '';

      setFullName(initialName);
      setGrade(initialGrade);
      setClassName(initialClass);
    }
  }, [isOpen, lesson, currentStudent]);

  if (!isOpen || !lesson) return null;

  // Gợi ý nhanh danh sách lớp phổ biến theo khối đang chọn
  const quickClasses = [
    `${grade}A1`,
    `${grade}A2`,
    `${grade}A3`,
    `${grade}B1`,
    `${grade}B2`,
    `${grade}C`,
  ];

  // Kiểm tra số lần học sinh này đã làm bài học này theo cấu hình bài học
  const tempStudentId = currentStudent?.id || `hs_${encodeURIComponent(fullName.trim().toLowerCase())}_${encodeURIComponent(className.trim().toLowerCase())}`;
  const attemptInfo = canStudentAttempt(tempStudentId, lesson.id, fullName, className);
  const remainingAttempts = attemptInfo.isUnlimited ? 999999 : Math.max(0, attemptInfo.maxAttempts - attemptInfo.count);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanClass = className.trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      setError('Vui lòng nhập đầy đủ Họ và tên học sinh (tối thiểu 2 ký tự)!');
      return;
    }

    if (!cleanClass || cleanClass.length < 2) {
      setError('Vui lòng nhập tên Lớp học (ví dụ: 6A1, 7A2, 8B, 9C)!');
      return;
    }

    if (!attemptInfo.allowed) {
      setError(`Em đã hoàn thành bài học này ${attemptInfo.count}/${attemptInfo.maxAttempts} lần (đã đạt giới hạn tối đa do Giáo viên quy định). Em hãy xem lại lịch sử hoặc chọn bài học khác nhé!`);
      return;
    }

    // Lưu thông tin học sinh vào session để lần sau làm bài không phải gõ lại
    const studentUser = saveGuestStudentSession({
      fullName: cleanName,
      className: cleanClass,
      grade,
    });

    onStartPractice(studentUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header modal */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/20 backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Tin học • Khối {lesson.grade}
                </span>
                <span className="text-[11px] sm:text-xs text-indigo-100 font-semibold line-clamp-1">
                  Mật mã học bá - Bí kíp học hay
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Thông tin học sinh vào làm bài
              </h3>
              <p className="text-xs text-indigo-100 line-clamp-1">
                Bài học: <strong className="text-white">{lesson.title}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo mục đích thu thập thông tin để giáo viên theo dõi */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900">
          <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            Học sinh <strong>không cần tạo tài khoản mật khẩu</strong>. Thông tin Họ tên và Lớp sẽ giúp <strong>Thầy Lê Quang Khánh</strong> theo dõi danh sách ôn tập và ghi nhận điểm số.
          </span>
        </div>

        {/* Form điền thông tin */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Họ và tên học sinh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Họ và tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn Nam"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* 2. Khối lớp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Khối lớp <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGrade(g);
                    // Nếu lớp hiện tại bắt đầu bằng khối cũ thì cập nhật tiền tố
                    if (className && /^[6-9]/.test(className)) {
                      setClassName(`${g}${className.slice(1)}`);
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    grade === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Lớp học */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lớp học của em <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Chọn nhanh hoặc tự nhập</span>
            </div>

            {/* Chips gợi ý nhanh theo khối */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickClasses.map((qc) => (
                <button
                  key={qc}
                  type="button"
                  onClick={() => setClassName(qc)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                    className.toUpperCase() === qc
                      ? 'bg-amber-400 text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {qc}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder={`Nhập tên lớp của em (ví dụ: ${grade}A1, ${grade}A2, ${grade}/1...)`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Thẻ thông tin bài học & số lượt thi */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Thời gian làm bài:
              </span>
              <span className="font-bold text-slate-800">
                {lesson.timeLimitMinutes && lesson.timeLimitMinutes > 0
                  ? `${lesson.timeLimitMinutes} phút`
                  : 'Không giới hạn thời gian (Tự do)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Số lượt làm tối đa:
              </span>
              <span className="font-bold text-slate-800">
                {attemptInfo.isUnlimited
                  ? 'Không giới hạn số lượt'
                  : `${attemptInfo.maxAttempts} lần / học sinh`}
              </span>
            </div>

            {fullName.trim() && className.trim() && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-700">
                <span>Trạng thái của em:</span>
                <span className="font-bold text-indigo-700">
                  {attemptInfo.count > 0 ? (
                    attemptInfo.isUnlimited ? (
                      `Đã làm ${attemptInfo.count} lần (Không giới hạn lượt)`
                    ) : (
                      `Đã làm ${attemptInfo.count}/${attemptInfo.maxAttempts} lần (Còn ${remainingAttempts} lượt)`
                    )
                  ) : (
                    'Lần làm bài đầu tiên'
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center order-2 sm:order-1"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!attemptInfo.allowed}
              className="px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:from-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] order-1 sm:order-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt Đầu Làm Bài Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
