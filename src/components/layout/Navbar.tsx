/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import {
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Flame,
  UserCog,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../services/firebase';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onSwitchUser: (user: User) => void;
  onOpenFirebaseGuide: () => void;
  onOpenStudentProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenAuth,
  onSwitchUser,
  onOpenFirebaseGuide,
  onOpenStudentProfile,
}) => {
  const [hasFirebase, setHasFirebase] = useState(false);

  useEffect(() => {
    setHasFirebase(isFirebaseConfigured());

    const updateStatus = () => {
      setHasFirebase(isFirebaseConfigured());
    };

    window.addEventListener('thcs_firebase_config_changed', updateStatus);
    return () => {
      window.removeEventListener('thcs_firebase_config_changed', updateStatus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform flex-shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight line-clamp-1">
                Mật mã học bá
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                Tin học 6-9
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">
              Cẩm nang ôn tập kiến thức Tin học 6789
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Hướng dẫn Firebase */}
          <button
            type="button"
            onClick={onOpenFirebaseGuide}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              hasFirebase
                ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200/80'
            }`}
            title={
              hasFirebase
                ? 'Đã kết nối Firebase Cloud - Bấm để quản lý hoặc xem hướng dẫn Netlify'
                : 'Cấu hình Firebase để lưu trữ dữ liệu trực tuyến khi đưa lên Netlify'
            }
          >
            <Flame className={`w-4 h-4 ${hasFirebase ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="hidden sm:inline">
              {hasFirebase ? 'Firebase Cloud' : 'Cấu hình Firebase'}
            </span>
            {hasFirebase && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Thông tin người dùng hiện tại */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                    currentUser.role === 'teacher'
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                  }`}
                >
                  {currentUser.role === 'teacher' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    currentUser.fullName.charAt(0)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    {currentUser.role === 'teacher' ? (
                      <span className="text-amber-700 font-bold">Giáo viên (Admin)</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        Học sinh - {currentUser.className || `Khối ${currentUser.grade}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút sửa thông tin cá nhân cho học sinh */}
              {currentUser.role === 'student' && onOpenStudentProfile && (
                <button
                  type="button"
                  onClick={onOpenStudentProfile}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Thay đổi thông tin cá nhân (họ tên, lớp học)"
                >
                  <UserCog className="w-4 h-4 text-indigo-600" />
                </button>
              )}

              {/* Đăng xuất */}
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Nút Đăng nhập bố cục ở góc phải phía trên */}
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 active:from-indigo-800 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer ring-2 ring-indigo-400/40"
                title="Đăng nhập tài khoản Học sinh hoặc Giáo viên"
              >
                <UserIcon className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
