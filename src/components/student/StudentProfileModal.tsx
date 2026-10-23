/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, User } from '../../types';
import { updateStudentProfile } from '../../services/storageService';
import {
  User as UserIcon,
  GraduationCap,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: User) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdateSuccess,
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [grade, setGrade] = useState<GradeLevel>((currentUser.grade || 8) as GradeLevel);
  const [className, setClassName] = useState(currentUser.className || '8A1');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Gợi ý danh sách lớp theo khối lớp đang chọn
  const quickClasses = [
    `${grade}A1`,
    `${grade}A2`,
    `${grade}B`,
    `${grade}C`,
    `${grade}/1`,
    `${grade}/2`,
  ];

  const handleGradeChange = (newGrade: GradeLevel) => {
    setGrade(newGrade);
    // Nếu tên lớp cũ bắt đầu bằng chữ số khác, tự đổi tiền tố cho phù hợp
    if (className && /^[6-9]/.test(className)) {
      setClassName(`${newGrade}${className.slice(1)}`);
    } else if (!className) {
      setClassName(`${newGrade}A1`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('Họ và tên học sinh không được để trống!');
      return;
    }
    if (!className.trim()) {
      setError('Thông tin lớp học không được để trống!');
      return;
    }

    setIsSubmitting(true);
    const result = updateStudentProfile(currentUser.id, {
      fullName: fullName.trim(),
      grade: grade,
      className: className.trim().toUpperCase(),
      password: newPassword.trim() ? newPassword.trim() : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.user) {
      setSuccess('Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => {
        onUpdateSuccess(result.user!);
        onClose();
      }, 700);
    } else {
      setError(result.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Thay Đổi Thông Tin Cá Nhân
              </h3>
              <p className="text-xs text-indigo-100">
                Điều chỉnh họ tên, khối lớp và thông tin lớp học nếu có sai sót
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Tài khoản đăng nhập (Không đổi)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-mono font-medium">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>@{currentUser.username}</span>
                <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                  Học sinh
                </span>
              </div>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tên này sẽ hiển thị trên bảng điểm nộp bài gửi Thầy Lê Quang Khánh.
              </p>
            </div>

            {/* Khối lớp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Khối lớp đăng ký <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-indigo-600 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Quyết định nội dung bài ôn tập
                </span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      grade === g
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Học sinh thuộc khối lớp nào thì hệ thống chỉ hiển thị nội dung môn Tin học của khối đó.
                </span>
              </div>
            </div>

            {/* Thông tin lớp học */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value.toUpperCase())}
                placeholder={`Ví dụ: ${grade}A1, ${grade}B, ${grade}/1...`}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold uppercase tracking-wider"
              />
              {/* Chọn nhanh tên lớp */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Gợi ý nhanh:</span>
                {quickClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setClassName(cls)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                      className === cls
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Đổi mật khẩu mới (Tùy chọn) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới (Tùy chọn)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Để trống nếu giữ nguyên mật khẩu hiện tại"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Nút hành động */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
