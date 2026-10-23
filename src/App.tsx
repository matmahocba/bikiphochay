/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, User } from './types';
import {
  getCurrentUser,
  initializeStorage,
  setCurrentUser,
} from './services/storageService';
import { HARDCODED_TEACHER, INITIAL_STUDENTS } from './data/seedData';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfileModal } from './components/student/StudentProfileModal';
import { FirebaseGuideModal } from './components/common/FirebaseGuideModal';
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
  const [authInitialRole, setAuthInitialRole] = useState<'teacher' | 'student'>('student');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authInitialGrade, setAuthInitialGrade] = useState<GradeLevel>(8);
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
          /* Giao diện chính hiển thị Danh mục lớp học 6, 7, 8, 9 ở trung tâm */
          <LoginScreen
            onLoginSuccess={handleAuthSuccess}
            onOpenAuth={(grade) => {
              if (grade) setAuthInitialGrade(grade);
              setAuthInitialRole('student');
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            initialRole={authInitialRole}
            initialMode={authInitialMode}
          />
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
        initialGrade={authInitialGrade}
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
