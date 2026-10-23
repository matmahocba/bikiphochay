/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, User } from '../../types';
import {
  GraduationCap,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: (user: User) => void;
  onOpenAuth?: (grade?: GradeLevel) => void;
  initialRole?: 'teacher' | 'student';
  initialMode?: 'login' | 'register';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onOpenAuth,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(8);

  const handleChooseGrade = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    if (onOpenAuth) {
      onOpenAuth(grade);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10 animate-in fade-in duration-300">
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

      {/* DANH MỤC LỚP HỌC 6, 7, 8, 9 Ở TRUNG TÂM GIAO DIỆN CHÍNH */}
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-4 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Danh Mục Lớp Học Tin Học THCS</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Chọn khối lớp 6, 7, 8 hoặc 9 để vào tham gia các bài kiểm tra & ôn tập trọng tâm
          </p>
        </div>

        {/* 4 Khối Lớp Trọng Tâm Ở Trung Tâm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              grade: 6 as GradeLevel,
              title: 'Tin học 6',
              accent: 'from-sky-500/10 via-white to-sky-50/70 border-sky-300 hover:border-sky-500 hover:shadow-sky-100',
              badgeBg: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white',
              btnTheme: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25',
              desc: '4 bài ôn tập trọng tâm',
            },
            {
              grade: 7 as GradeLevel,
              title: 'Tin học 7',
              accent: 'from-emerald-500/10 via-white to-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:shadow-emerald-100',
              badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
              btnTheme: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
              desc: '4 bài ôn tập trọng tâm',
            },
            {
              grade: 8 as GradeLevel,
              title: 'Tin học 8',
              accent: 'from-indigo-500/10 via-white to-indigo-50/70 border-indigo-300 hover:border-indigo-500 hover:shadow-indigo-100',
              badgeBg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white',
              btnTheme: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25',
              desc: '4 bài ôn tập trọng tâm',
            },
            {
              grade: 9 as GradeLevel,
              title: 'Tin học 9',
              accent: 'from-purple-500/10 via-white to-purple-50/70 border-purple-300 hover:border-purple-500 hover:shadow-purple-100',
              badgeBg: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
              btnTheme: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25',
              desc: '4 bài ôn tập trọng tâm',
            },
          ].map((item) => {
            const isSelected = selectedGrade === item.grade;
            return (
              <div
                key={item.grade}
                onClick={() => handleChooseGrade(item.grade)}
                className={`p-5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between gap-4 shadow-md hover:shadow-xl cursor-pointer bg-gradient-to-br ${
                  item.accent
                } ${isSelected ? 'ring-3 ring-indigo-500/40 border-indigo-600' : 'hover:-translate-y-1'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-xl font-black text-xs shadow-xs ${item.badgeBg}`}>
                      Khối {item.grade}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {item.desc}
                    </span>
                  </div>

                  <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                    Bao gồm 4 dạng bài tập: Trắc nghiệm, Điền khuyết, Ghép nối và Tự luận.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    Môn Tin học {item.grade}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChooseGrade(item.grade);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer ${item.btnTheme}`}
                  >
                    <span>Vào ôn tập</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
