/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GradeLevel, Lesson, Submission } from '../../types';
import { getLessons, getSubmissions } from '../../services/storageService';
import { exportSubmissionsToExcel } from '../../services/excelExport';
import {
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  GraduationCap,
  Sparkles,
  BarChart3,
  Award,
  Layers,
  X,
  BookOpen,
} from 'lucide-react';

interface StudentInteractionTrackerProps {
  onRefresh?: () => void;
}

export const StudentInteractionTracker: React.FC<StudentInteractionTrackerProps> = ({
  onRefresh,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [searchName, setSearchName] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const submissions = getSubmissions();
  const allLessons = getLessons();

  // Danh sách các lớp học duy nhất có trong dữ liệu bài nộp
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    submissions.forEach((s) => {
      if (s.studentClass && s.studentClass !== 'Chưa rõ') {
        classSet.add(s.studentClass.trim().toUpperCase());
      }
    });
    return Array.from(classSet).sort();
  }, [submissions]);

  // Lọc danh sách bài nộp / tương tác
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // 1. Lọc theo Khối
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) {
        return false;
      }
      // 2. Lọc theo Lớp
      if (
        selectedClass !== 'all' &&
        s.studentClass.trim().toUpperCase() !== selectedClass.trim().toUpperCase()
      ) {
        return false;
      }
      // 3. Lọc theo Bài học
      if (selectedLessonId !== 'all' && s.lessonId !== selectedLessonId) {
        return false;
      }
      // 4. Tìm kiếm theo tên học sinh
      if (
        searchName.trim() &&
        !s.studentName.toLowerCase().includes(searchName.trim().toLowerCase()) &&
        !s.studentClass.toLowerCase().includes(searchName.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [submissions, selectedGrade, selectedClass, selectedLessonId, searchName]);

  // Thống kê nhanh
  const totalSubmissions = filteredSubmissions.length;
  const uniqueStudents = useMemo(() => {
    const studentKeys = new Set<string>();
    filteredSubmissions.forEach((s) => {
      studentKeys.add(`${s.studentName.toLowerCase()}_${s.studentClass.toLowerCase()}`);
    });
    return studentKeys.size;
  }, [filteredSubmissions]);

  const avgScore = useMemo(() => {
    if (totalSubmissions === 0) return '0.0';
    const sum = filteredSubmissions.reduce((acc, cur) => acc + cur.score, 0);
    return (sum / totalSubmissions).toFixed(1);
  }, [filteredSubmissions, totalSubmissions]);

  const excellentCount = useMemo(() => {
    return filteredSubmissions.filter((s) => s.score >= 8.0).length;
  }, [filteredSubmissions]);

  // Xuất Excel toàn bộ danh sách đã lọc
  const handleExportExcel = () => {
    const fileName =
      selectedGrade === 'all'
        ? 'Danh_Sach_Hoc_Sinh_Tuong_Tac_Tin_Hoc'
        : `Danh_Sach_Hoc_Sinh_Tin_Hoc_Khoi_${selectedGrade}`;
    exportSubmissionsToExcel(filteredSubmissions, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Học sinh tham gia</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {uniqueStudents}{' '}
              <span className="text-xs font-bold text-slate-400">em</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng lượt tương tác/nộp</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalSubmissions}{' '}
              <span className="text-xs font-bold text-slate-400">lượt</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Điểm trung bình</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {avgScore}{' '}
              <span className="text-xs font-bold text-slate-400">/ 10</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Đạt điểm Giỏi (≥ 8.0)</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {excellentCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                ({totalSubmissions > 0 ? Math.round((excellentCount / totalSubmissions) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Điều Khiển & Bộ Lọc Nâng Cao */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Danh Sách Học Sinh Tham Gia Ôn Tập & Tương Tác</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết họ tên, lớp, bài học tham gia, số lần làm bài và điểm số của từng học sinh
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút Xuất Excel toàn bộ danh sách */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredSubmissions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Xuất bảng danh sách học sinh tham gia ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Xuất Danh Sách Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Các bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* 1. Tìm kiếm theo tên */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* 2. Lọc theo Khối */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) =>
                setSelectedGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">Tất cả Khối lớp (Khối 6 - 9)</option>
              <option value="6">Khối 6 (Tin học 6)</option>
              <option value="7">Khối 7 (Tin học 7)</option>
              <option value="8">Khối 8 (Tin học 8)</option>
              <option value="9">Khối 9 (Tin học 9)</option>
            </select>
          </div>

          {/* 3. Lọc theo Lớp */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">Tất cả Lớp học</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Lọc theo Bài học */}
          <div>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 line-clamp-1"
            >
              <option value="all">Tất cả Bài học</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.grade}] {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Học Sinh Tương Tác */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Hiển thị <strong>{filteredSubmissions.length}</strong> lượt tương tác của{' '}
            <strong>{uniqueStudents}</strong> học sinh
          </div>
          {(selectedGrade !== 'all' ||
            selectedClass !== 'all' ||
            selectedLessonId !== 'all' ||
            searchName) && (
            <button
              type="button"
              onClick={() => {
                setSelectedGrade('all');
                setSelectedClass('all');
                setSelectedLessonId('all');
                setSearchName('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">
              Không tìm thấy học sinh nào theo điều kiện lọc hiện tại.
            </p>
            <p className="text-xs text-slate-400">
              Khi học sinh điền họ tên, lớp và làm bài ôn tập, dữ liệu sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div>
            {/* Giao diện Thẻ trên Điện thoại di động */}
            <div className="block sm:hidden space-y-3">
              {filteredSubmissions.map((sub, idx) => {
                const submitDate = new Date(sub.submittedAt);
                const formattedDate = !isNaN(submitDate.getTime())
                  ? submitDate.toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : sub.submittedAt;

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {sub.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-sm text-slate-900 leading-snug">
                            {sub.studentName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">
                              Lớp {sub.studentClass}
                            </span>
                            <span>•</span>
                            <span>Khối {sub.grade}</span>
                            <span>•</span>
                            <span>Lần {sub.attemptNumber}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                          sub.score >= 8
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.score >= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sub.score.toFixed(1)} / 10
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-xs text-slate-700">
                      <div className="font-bold text-slate-800 line-clamp-1">{sub.lessonTitle}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Đúng: <strong>{sub.correctCount}/{sub.totalQuestions} câu</strong></span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(sub)}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chi tiết bài làm</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bảng dữ liệu trên Máy tính & Tablet */}
            <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 text-center">STT</th>
                    <th className="py-3 px-4">Họ và tên học sinh</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3">Khối</th>
                    <th className="py-3 px-4">Tên bài học</th>
                    <th className="py-3 px-3 text-center">Lần làm bài</th>
                    <th className="py-3 px-3 text-center">Số câu đúng</th>
                    <th className="py-3 px-4 text-center">Điểm số</th>
                    <th className="py-3 px-4">Thời gian nộp bài</th>
                    <th className="py-3 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub, idx) => {
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
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* Họ và tên */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {sub.studentName.charAt(0)}
                            </div>
                            <span className="line-clamp-1">{sub.studentName}</span>
                          </div>
                        </td>

                        {/* Lớp */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {sub.studentClass}
                          </span>
                        </td>

                        {/* Khối */}
                        <td className="py-3 px-3">
                          <span className="text-slate-600 font-semibold">
                            Khối {sub.grade}
                          </span>
                        </td>

                        {/* Tên bài học */}
                        <td className="py-3 px-4 font-medium text-slate-800 max-w-[220px]">
                          <div className="line-clamp-1" title={sub.lessonTitle}>
                            {sub.lessonTitle}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            Môn: {sub.subject}
                          </span>
                        </td>

                        {/* Lần làm bài */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Lần {sub.attemptNumber}/10
                          </span>
                        </td>

                        {/* Số câu đúng */}
                        <td className="py-3 px-3 text-center font-medium text-slate-600">
                          {sub.correctCount}/{sub.totalQuestions}
                        </td>

                        {/* Điểm số */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-md ${
                              sub.score >= 8
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.score >= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.score.toFixed(1)} / 10
                          </span>
                        </td>

                        {/* Thời gian */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Thao tác xem chi tiết */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi tiết bài làm của một học sinh */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                    Khối {selectedSubmission.grade}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                    Lớp {selectedSubmission.studentClass}
                  </span>
                </div>
                <h4 className="font-extrabold text-base">
                  Bài làm của: {selectedSubmission.studentName}
                </h4>
                <p className="text-xs text-indigo-100">
                  {selectedSubmission.lessonTitle} • Lần thứ {selectedSubmission.attemptNumber}/10
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-indigo-200">Điểm số</div>
                  <div className="text-2xl font-black text-amber-300">
                    {selectedSubmission.score} / 10
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chi tiết từng câu trả lời */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Chi tiết kết quả từng câu ({selectedSubmission.answers.length} câu)
              </div>

              {selectedSubmission.answers.map((ans, idx) => (
                <div
                  key={ans.questionId || idx}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    ans.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>Câu {idx + 1} ({ans.type === 'multiple_choice' ? 'Trắc nghiệm' : ans.type === 'fill_in_the_blank' ? 'Điền khuyết' : ans.type === 'drag_and_drop' ? 'Kéo thả' : 'Tự luận'})</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-extrabold ${
                        ans.isCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                      }`}
                    >
                      {ans.isCorrect ? `+${ans.scoreAwarded || 1} điểm` : '0 điểm'}
                    </span>
                  </div>

                  {/* Nội dung câu trả lời */}
                  <div className="pl-6 space-y-1 text-slate-700">
                    {ans.textResponse && (
                      <div>
                        <span className="font-semibold text-slate-500">Học sinh trả lời: </span>
                        <strong className="text-slate-900">{ans.textResponse}</strong>
                      </div>
                    )}
                    {ans.selectedOptionId && (
                      <div>
                        <span className="font-semibold text-slate-500">Lựa chọn: </span>
                        <strong className="text-slate-900">{ans.selectedOptionId}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
