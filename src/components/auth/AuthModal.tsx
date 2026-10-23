/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, User } from '../../types';
import { HARDCODED_TEACHER } from '../../data/seedData';
import { loginUser, registerStudent } from '../../services/storageService';
import {
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Play,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'teacher' | 'student';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  initialMode = 'login',
  initialRole = 'student',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'teacher' | 'student'>(initialRole);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(8);
  const [className, setClassName] = useState('8A1');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Xử lý nộp biểu mẫu Đăng nhập
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng nhập Tên đăng nhập / Tên tài khoản!');
      return;
    }

    const res = loginUser(username, password);
    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess(res.user!);
      }, 400);
    } else {
      setError(res.message);
    }
  };

  // Xử lý nộp biểu mẫu Đăng ký Học sinh
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra bắt buộc: Tên tài khoản, Mật khẩu, Họ và tên và Thông tin lớp học
    if (!username.trim()) {
      setError('Vui lòng nhập Tên tài khoản / Tên đăng nhập!');
      return;
    }
    if (!password || !password.trim()) {
      setError('Vui lòng nhập Mật khẩu bảo vệ tài khoản!');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên học sinh!');
      return;
    }
    if (!className.trim()) {
      setError('Vui lòng nhập hoặc chọn Thông tin lớp học!');
      return;
    }

    const res = registerStudent({
      fullName: fullName.trim(),
      grade: selectedGrade,
      className: className.trim().toUpperCase(),
      username: username.trim(),
      password: password.trim(),
    });

    if (res.success && res.user) {
      setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
      setTimeout(() => {
        onSuccess(res.user!);
      }, 600);
    } else {
      setError(res.message);
    }
  };

  const handleGradeSelect = (g: GradeLevel) => {
    setSelectedGrade(g);
    if (className && /^[6-9]/.test(className)) {
      setClassName(`${g}${className.slice(1)}`);
    } else if (!className) {
      setClassName(`${g}A1`);
    }
  };

  // Nhanh chóng điền tài khoản mẫu học sinh để trải nghiệm tiện lợi
  const fillStudentDemo = () => {
    setRole('student');
    setMode('login');
    setUsername('nhatminh');
    setPassword('123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Banner tiêu đề */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-4 sm:p-6 text-white text-center relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Mật mã học bá - Bí kíp học hay</h2>
          <p className="text-xs text-indigo-100 mt-0.5">
            Cẩm nang ôn tập kiến thức Tin học 6789
          </p>

          {/* Quick Demo Fillers: Chỉ giữ tài khoản mẫu học sinh */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/15 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-white/80 text-[11px] flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Thử nhanh:
            </span>
            <button
              type="button"
              onClick={fillStudentDemo}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Học sinh mẫu (Lớp 8)
            </button>
          </div>
        </div>

        {/* Tab chuyển Đăng nhập / Đăng ký */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors text-center border-b-2 ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRole('student'); // Giáo viên đã có tài khoản cố định
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors text-center border-b-2 ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Ký Học Sinh
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* --- FORM ĐĂNG NHẬP --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Chọn vai trò đăng nhập */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Bạn là:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('student');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === 'student'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Học sinh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('teacher');
                      if (username === 'nhatminh') setUsername('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === 'teacher'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Giáo viên (Admin)</span>
                  </button>
                </div>
              </div>

              {/* Tên đăng nhập */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'teacher' ? 'Nhập tên tài khoản giáo viên...' : 'Ví dụ: nhatminh'}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* --- FORM ĐĂNG KÝ HỌC SINH --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Nam"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Khối lớp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Khối lớp học <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-indigo-600 font-medium">Chỉ xem bài môn Tin học khối này</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeSelect(g)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                        selectedGrade === g
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Khối {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thông tin lớp học */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thông tin lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value.toUpperCase())}
                  placeholder={`Ví dụ: ${selectedGrade}A1, ${selectedGrade}B, ${selectedGrade}/1...`}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold uppercase tracking-wider"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {[`${selectedGrade}A1`, `${selectedGrade}A2`, `${selectedGrade}B`, `${selectedGrade}C`].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassName(cls)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        className === cls ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tên đăng nhập / Tài khoản */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên tài khoản (Tên đăng nhập) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: vannam2012"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Lưu ý hỗ trợ chỉnh sửa thông tin */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] text-blue-800 leading-relaxed">
                💡 <strong>Lưu ý:</strong> Khi thông tin có sai sót, học sinh sau khi đăng nhập thành công có thể <strong>thay đổi thông tin cá nhân</strong> (bao gồm họ tên và lớp học) ngay trên hệ thống.
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tạo Tài Khoản & Bắt Đầu Học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {onClose && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Đóng cửa sổ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
