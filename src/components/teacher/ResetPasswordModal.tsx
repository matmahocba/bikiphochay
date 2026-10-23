/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { resetStudentPassword } from '../../services/storageService';
import { KeyRound, X, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  student: User | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleGenerateRandom = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới cần cấp lại!');
      return;
    }

    const res = resetStudentPassword(student.id, newPassword.trim());
    if (res.success) {
      onSuccess(`Đã cấp lại mật khẩu mới cho học sinh ${student.fullName} thành công! Mật khẩu mới: ${newPassword.trim()}`);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấp Lại Mật Khẩu Học Sinh</h3>
              <p className="text-xs text-amber-100">
                Dành cho học sinh quên mật khẩu đăng nhập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* Thông tin học sinh */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lớp:</span>
              <span className="font-semibold text-slate-800">
                {student.className || 'Chưa rõ'} (Khối {student.grade || 8})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tài khoản đăng nhập:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {student.username}
              </span>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mật khẩu mới cấp lại <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tạo ngẫu nhiên</span>
              </button>
            </div>

            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Gợi ý chọn nhanh */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
              {['123', '123456', 'HocSinh@26', 'tin2026'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewPassword(preset)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    newPassword === preset
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            * Sau khi cấp lại, học sinh có thể sử dụng ngay tài khoản <strong>{student.username}</strong> và mật khẩu mới này để đăng nhập vào ứng dụng.
          </p>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Xác Nhận Cấp Lại</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
