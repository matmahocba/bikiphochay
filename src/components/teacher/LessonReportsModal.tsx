/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lesson, Question, Submission } from '../../types';
import { exportSubmissionsToExcel } from '../../services/excelExport';
import {
  X,
  FileSpreadsheet,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Search,
} from 'lucide-react';

interface LessonReportsModalProps {
  isOpen: boolean;
  lesson: Lesson;
  submissions: Submission[];
  questions: Question[];
  onClose: () => void;
}

export const LessonReportsModal: React.FC<LessonReportsModalProps> = ({
  isOpen,
  lesson,
  submissions,
  questions,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  if (!isOpen) return null;

  // Lọc theo tên học sinh hoặc lớp
  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentClass.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Thống kê nhanh
  const totalSubmissions = submissions.length;
  const avgScore =
    totalSubmissions > 0
      ? (submissions.reduce((acc, cur) => acc + cur.score, 0) / totalSubmissions).toFixed(1)
      : '0.0';
  const highestScore =
    totalSubmissions > 0
      ? Math.max(...submissions.map((s) => s.score)).toFixed(1)
      : '0.0';

  // LOGIC XUẤT FILE EXCEL: Kích hoạt tải về bảng thống kê
  const handleExportExcel = () => {
    exportSubmissionsToExcel(submissions, `Bao_Cao_${lesson.subject}_${lesson.title}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                  Môn: {lesson.subject || 'Tin học'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                  Khối {lesson.grade}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-0.5">{lesson.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* NÚT XUẤT EXCEL THEO YÊU CẦU */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={submissions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Tải bảng danh sách lịch sử ôn tập dưới dạng file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thống kê vắn tắt */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Tổng lượt nộp bài</span>
            <span className="text-lg font-extrabold text-slate-900">{totalSubmissions}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Điểm trung bình</span>
            <span className="text-lg font-extrabold text-indigo-600">{avgScore} / 10</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Điểm cao nhất</span>
            <span className="text-lg font-extrabold text-emerald-600">{highestScore} / 10</span>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Hiển thị <strong>{filteredSubmissions.length}</strong> bài nộp
          </div>
        </div>

        {/* Bảng danh sách lịch sử ôn tập (Yêu cầu đề bài) */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-medium">Chưa có lượt nộp bài nào cho bài học này.</p>
              <p className="text-xs text-slate-400 mt-1">
                Khi học sinh làm bài và nộp, bảng thống kê sẽ cập nhật tự động.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-4">Tên học sinh</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3 text-center">Lần thi</th>
                    <th className="py-3 px-3 text-center">Số câu đúng</th>
                    <th className="py-3 px-4 text-center">Điểm số</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
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
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sub.studentName}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{sub.studentClass}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Lần {sub.attemptNumber}/10
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-600">
                          {sub.correctCount}/{sub.totalQuestions}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-0.5 rounded-md ${
                              sub.score >= 8
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.score >= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Xem bài làm
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal chi tiết bài làm của một học sinh nếu giáo viên muốn xem */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Chi tiết bài làm: {selectedSubmission.studentName} ({selectedSubmission.studentClass})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Lần thứ {selectedSubmission.attemptNumber} - Điểm:{' '}
                    <strong className="text-emerald-700">{selectedSubmission.score}/10</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {questions.map((q, idx) => {
                  const ans = selectedSubmission.answers.find((a) => a.questionId === q.id);
                  const isCorrect = ans?.isCorrect;

                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-bold text-slate-900">
                          Câu {idx + 1}: {q.prompt}
                        </span>
                        {isCorrect ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1 flex-shrink-0">
                            <XCircle className="w-3.5 h-3.5" /> Chưa đúng
                          </span>
                        )}
                      </div>

                      {q.type === 'multiple_choice' && (
                        <div className="text-slate-600">
                          Đáp án học sinh chọn:{' '}
                          <strong>
                            {q.options?.find((o) => o.id === ans?.selectedOptionId)?.text || 'Chưa chọn'}
                          </strong>
                        </div>
                      )}

                      {q.type === 'fill_in_the_blank' && (
                        <div className="text-slate-600">
                          Câu trả lời của học sinh:{' '}
                          <span className="font-mono bg-white px-2 py-0.5 rounded border">
                            {ans?.textResponse || '(Để trống)'}
                          </span>
                        </div>
                      )}

                      {q.type === 'drag_and_drop' && (
                        <div className="text-slate-600">
                          Vị trí học sinh đã xếp:{' '}
                          <div className="mt-1 space-y-1">
                            {q.dragDropPairs?.map((pair) => (
                              <div key={pair.id} className="text-[11px] text-slate-500">
                                • {pair.slotLabel} ➔ <strong>{ans?.dragDropMapping?.[pair.id] || '(Chưa điền)'}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'essay' && (
                        <div className="space-y-1">
                          <span className="text-slate-500 block">Bài làm tự luận:</span>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap text-slate-800">
                            {ans?.textResponse || '(Không có câu trả lời)'}
                          </div>
                          {q.essayGuide && (
                            <p className="text-[11px] text-indigo-700 italic mt-1">
                              Gợi ý chấm của GV: {q.essayGuide}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
