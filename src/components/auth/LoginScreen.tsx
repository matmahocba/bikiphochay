/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, User } from '../../types';
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
  Layers,
  BookOpen,
  Check,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  initialRole?: 'teacher' | 'student';
  initialMode?: 'login' | 'register';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialRole = 'student',
  initialMode = 'login',
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
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý nộp biểu mẫu Đăng nhập
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng nhập Tên đăng nhập / Tên tài khoản!');
      return;
    }

    setIsLoading(true);
    const res = loginUser(username, password);
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 350);
    } else {
      setError(res.message);
    }
  };

  // Xử lý nộp biểu mẫu Đăng ký Học sinh
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    setIsLoading(true);
    const res = registerStudent({
      fullName: fullName.trim(),
      grade: selectedGrade,
      className: className.trim().toUpperCase(),
      username: username.trim(),
      password: password.trim(),
    });
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển vào ứng dụng...');
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 500);
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

  // Điền nhanh tài khoản mẫu học sinh
  const fillStudentDemo = () => {
    setRole('student');
    setMode('login');
    setUsername('nhatminh');
    setPassword('123');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Tiêu đề chính trang chủ */}
      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-indigo-50 border border-indigo-200/80 text-indigo-700 shadow-2xs">
          <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Hệ thống Ôn tập Tin học THCS Khối 6, 7, 8, 9</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent block">
            Mật mã học bá - Bí kíp học hay
          </span>
          <span className="block text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-800 mt-2 sm:mt-3 tracking-normal">
            Cẩm nang ôn tập kiến thức Tin học 6789
          </span>
          <span className="inline-block text-xs sm:text-sm font-bold text-indigo-700 bg-white border border-indigo-200/90 px-4 py-1 rounded-full mt-2 shadow-2xs">
            By Lê Quang Khánh
          </span>
        </h1>
      </div>

      {/* KHUNG ĐĂNG NHẬP / ĐĂNG KÝ TRỰC DIỆN TRANG CHỦ */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Banner đầu khung */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-5 sm:p-6 text-white text-center relative shadow-sm">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Đăng Nhập Vào Ứng Dụng
          </h2>
          <p className="text-xs text-indigo-100 mt-1 font-medium">
            Dành cho Học sinh làm bài ôn tập & Giáo viên quản trị
          </p>

          {/* Quick Demo Fillers: Chỉ giữ tài khoản mẫu học sinh */}
          <div className="mt-3.5 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-white/80 text-[11px] flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Thử nhanh:
            </span>
            <button
              type="button"
              onClick={fillStudentDemo}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Học sinh mẫu (Lớp 8)
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
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
              setRole('student');
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Ký Học Sinh
          </button>
        </div>

        {/* Nội dung Form */}
        <div className="p-5 sm:p-7">
          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* --- FORM ĐĂNG NHẬP --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Chọn vai trò đăng nhập */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Bạn là:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài khoản / Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'teacher' ? 'Tên đăng nhập Giáo viên' : 'Ví dụ: nhatminh, nam8a1...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium pl-10"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium pl-10"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Nút Đăng nhập */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Vào Ứng Dụng'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Gợi ý chuyển sang Đăng ký */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản học sinh?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRole('student');
                      setError(null);
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Đăng ký ngay tại đây
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* --- FORM ĐĂNG KÝ HỌC SINH --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

              {/* Khối lớp & Lớp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGradeSelect(g)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          selectedGrade === g
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: 8A1, 6B..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold uppercase text-center"
                  />
                </div>
              </div>

              {/* Tên tài khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài khoản / Đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Ví dụ: vanan8a1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium font-mono"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu bảo vệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tạo mật khẩu (ví dụ: 123456)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

              {/* Nút Đăng ký */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký & Vào Học Ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Chuyển sang Đăng nhập */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Đăng nhập tại đây
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Danh mục các Khối lớp Tin học 6, 7, 8, 9 bên dưới để học sinh nắm lộ trình */}
      <div className="space-y-3 pt-2 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Chương trình ôn tập môn Tin học THCS:</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-left">
          {[
            {
              grade: 6,
              title: 'Tin học 6',
              theme: 'border-sky-200 bg-gradient-to-br from-white via-sky-50/40 to-sky-50/80 shadow-sky-100',
              badgeBg: 'bg-sky-100 text-sky-800',
              desc: '4 bài ôn tập',
            },
            {
              grade: 7,
              title: 'Tin học 7',
              theme: 'border-teal-200 bg-gradient-to-br from-white via-teal-50/40 to-teal-50/80 shadow-teal-100',
              badgeBg: 'bg-teal-100 text-teal-800',
              desc: '4 bài ôn tập',
            },
            {
              grade: 8,
              title: 'Tin học 8',
              theme: 'border-indigo-200 bg-gradient-to-br from-white via-indigo-50/40 to-indigo-50/80 shadow-indigo-100',
              badgeBg: 'bg-indigo-100 text-indigo-800',
              desc: '4 bài ôn tập',
            },
            {
              grade: 9,
              title: 'Tin học 9',
              theme: 'border-amber-200 bg-gradient-to-br from-white via-amber-50/40 to-amber-50/80 shadow-amber-100',
              badgeBg: 'bg-amber-100 text-amber-800',
              desc: '4 bài ôn tập',
            },
          ].map((item) => (
            <div
              key={item.grade}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 shadow-xs ${item.theme}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center ${item.badgeBg}`}>
                  {item.grade}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {item.desc}
                </span>
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-slate-900">
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
