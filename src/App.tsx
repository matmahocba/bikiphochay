/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, User } from './types';
import {
  getCurrentUser,
  initializeStorage,
  resetToSeedData,
  setCurrentUser,
} from './services/storageService';
import { HARDCODED_TEACHER, INITIAL_STUDENTS } from './data/seedData';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfileModal } from './components/student/StudentProfileModal';
import { FirebaseGuideModal } from './components/common/FirebaseGuideModal';
import { ConfirmDeleteModal } from './components/common/ConfirmDeleteModal';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Play,
  Layers,
} from 'lucide-react';

export default function App() {
  const [currentUser, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);
  const [isFirebaseGuideOpen, setIsFirebaseGuideOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'teacher' | 'student'>('student');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Khởi tạo LocalStorage & lắng nghe đồng bộ khi ứng dụng khởi chạy
  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    setUser(user);

    const handleSync = () => {
      const refreshedUser = getCurrentUser();
      setUser(refreshedUser);
    };

    window.addEventListener('thcs_data_synced', handleSync);
    window.addEventListener('thcs_firebase_config_changed', handleSync);

    return () => {
      window.removeEventListener('thcs_data_synced', handleSync);
      window.removeEventListener('thcs_firebase_config_changed', handleSync);
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setIsAuthModalOpen(false);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    setUser(user);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleExecuteResetData = () => {
    resetToSeedData();
    setUser(getCurrentUser());
    showToast('Đã khôi phục toàn bộ dữ liệu mẫu môn Tin học thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Thanh điều hướng Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthInitialRole('student');
          setAuthInitialMode('login');
          setIsAuthModalOpen(true);
        }}
        onSwitchUser={handleSwitchUser}
        onOpenFirebaseGuide={() => setIsFirebaseGuideOpen(true)}
        onResetData={handleResetData}
        onOpenStudentProfile={() => setIsStudentProfileModalOpen(true)}
      />

      {/* Nội dung chính ứng dụng: Chỉ học sinh có tài khoản đăng nhập mới vào ôn tập */}
      <main className="flex-1 pb-16">
        {currentUser ? (
          currentUser.role === 'teacher' ? (
            <TeacherDashboard
              currentUser={currentUser}
              onOpenFirebaseModal={() => setIsFirebaseGuideOpen(true)}
            />
          ) : (
            <StudentDashboard
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
            />
          )
        ) : (
          /* Màn hình trang chủ tươi sáng, tối ưu bố cục và thân thiện trên điện thoại */
          <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 text-center space-y-6 sm:space-y-8">
            {/* Tiêu đề chính trang chủ */}
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent block">
                  Mật mã học bá - Bí kíp học hay
                </span>
                <span className="block text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-800 mt-2 sm:mt-3 tracking-normal">
                  Cẩm nang ôn tập kiến thức Tin học 6789
                </span>
                <span className="inline-block text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full mt-2 shadow-2xs">
                  By Lê Quang Khánh
                </span>
              </h1>
            </div>

            {/* Chọn nhanh Khối lớp với màu sắc tươi sáng, thẻ trực quan tối ưu chạm trên điện thoại */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Chọn Khối lớp để bắt đầu ôn tập:</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-left">
                {[
                  {
                    grade: 6,
                    title: 'Tin học 6',
                    theme: 'border-sky-200 hover:border-sky-500 bg-gradient-to-br from-white via-sky-50/40 to-sky-50/80 shadow-sky-100',
                    badgeBg: 'bg-sky-100 text-sky-800 group-hover:bg-sky-600 group-hover:text-white',
                    btnText: 'text-sky-600',
                  },
                  {
                    grade: 7,
                    title: 'Tin học 7',
                    theme: 'border-teal-200 hover:border-teal-500 bg-gradient-to-br from-white via-teal-50/40 to-teal-50/80 shadow-teal-100',
                    badgeBg: 'bg-teal-100 text-teal-800 group-hover:bg-teal-600 group-hover:text-white',
                    btnText: 'text-teal-600',
                  },
                  {
                    grade: 8,
                    title: 'Tin học 8',
                    theme: 'border-indigo-200 hover:border-indigo-500 bg-gradient-to-br from-white via-indigo-50/40 to-indigo-50/80 shadow-indigo-100',
                    badgeBg: 'bg-indigo-100 text-indigo-800 group-hover:bg-indigo-600 group-hover:text-white',
                    btnText: 'text-indigo-600',
                  },
                  {
                    grade: 9,
                    title: 'Tin học 9',
                    theme: 'border-amber-200 hover:border-amber-500 bg-gradient-to-br from-white via-amber-50/40 to-amber-50/80 shadow-amber-100',
                    badgeBg: 'bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white',
                    btnText: 'text-amber-600',
                  },
                ].map((item) => (
                  <button
                    key={item.grade}
                    type="button"
                    onClick={() => {
                      setAuthInitialRole('student');
                      setAuthInitialMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className={`p-3.5 sm:p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-3 sm:gap-4 group cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] ${item.theme}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-base flex items-center justify-center transition-colors ${item.badgeBg}`}>
                        {item.grade}
                      </span>
                      <span className={`text-[11px] sm:text-sm font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${item.btnText}`}>
                        <span className="hidden sm:inline">Đăng nhập</span> ➔
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="pt-2 sm:pt-2.5 border-t border-slate-200/80 text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between font-semibold">
                      <span className="truncate">4 bài ôn tập</span>
                      <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-[9px] sm:text-[10px] flex-shrink-0">
                        Vào ôn ➔
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 sm:py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-center gap-2 font-medium">
            <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Mật mã học bá - Bí kíp học hay • Cẩm nang ôn tập kiến thức Tin học 6789 • By Lê Quang Khánh</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <span>Giáo viên quản trị: <strong className="text-slate-600">Lê Quang Khánh</strong></span>
            <span>•</span>
            <button
              onClick={() => setIsFirebaseGuideOpen(true)}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Lưu trữ Firebase & Netlify
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authInitialMode}
        initialRole={authInitialRole}
        onSuccess={handleAuthSuccess}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Student Profile Edit Modal */}
      {currentUser && currentUser.role === 'student' && (
        <StudentProfileModal
          isOpen={isStudentProfileModalOpen}
          currentUser={currentUser}
          onClose={() => setIsStudentProfileModalOpen(false)}
          onUpdateSuccess={handleUpdateUser}
        />
      )}

      {/* Firebase Integration Guide Modal */}
      <FirebaseGuideModal
        isOpen={isFirebaseGuideOpen}
        onClose={() => setIsFirebaseGuideOpen(false)}
      />

      {/* Modal xác nhận khôi phục dữ liệu ban đầu an toàn */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        title="Xác nhận khôi phục dữ liệu gốc"
        message="Hệ thống sẽ đặt lại toàn bộ bài học, danh sách câu hỏi và bài làm của môn Tin học Khối 6-9 về trạng thái mẫu ban đầu."
        confirmLabel="Khôi phục ngay"
        cancelLabel="Hủy"
        onConfirm={handleExecuteResetData}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Toast thông báo toàn cục */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700/80 backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
