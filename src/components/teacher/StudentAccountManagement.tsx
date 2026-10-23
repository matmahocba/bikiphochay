/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GradeLevel, User } from '../../types';
import {
  deleteStudentUser,
  getAllUsers,
  getStudents,
  resetStudentPassword,
  saveStudentUser,
  setBatchStudentPassword,
} from '../../services/storageService';
import {
  downloadStudentTemplateExcel,
  exportStudentListToExcel,
} from '../../services/excelExport';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  KeyRound,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Lock,
  RotateCcw,
  Plus,
  ShieldCheck,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';

interface StudentAccountManagementProps {
  onRefresh?: () => void;
  initialGrade?: GradeLevel | 'all';
  lockGrade?: boolean;
}

export const StudentAccountManagement: React.FC<StudentAccountManagementProps> = ({
  onRefresh,
  initialGrade = 'all',
  lockGrade = false,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>(initialGrade);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Đồng bộ khi initialGrade thay đổi
  React.useEffect(() => {
    setSelectedGrade(initialGrade);
  }, [initialGrade]);

  // Modals
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isBatchPasswordModalOpen, setIsBatchPasswordModalOpen] = useState(false);
  const [batchPasswordInput, setBatchPasswordInput] = useState('123456');

  // Multi-select for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);

  // Delete confirm modal (an toàn trong iframe preview)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    student?: User;
    isBatch?: boolean;
  }>({ isOpen: false });

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State version for re-render
  const [version, setVersion] = useState(0);
  const triggerUpdate = () => {
    setVersion((v) => v + 1);
    onRefresh?.();
  };

  // Lấy toàn bộ danh sách học sinh
  const allStudents = useMemo(() => {
    return getStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // Danh sách các lớp học duy nhất
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    allStudents.forEach((s) => {
      if (s.className) classSet.add(s.className.trim().toUpperCase());
    });
    return Array.from(classSet).sort();
  }, [allStudents]);

  // Lọc học sinh theo khối, lớp, từ khóa
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (selectedGrade !== 'all' && Number(s.grade) !== Number(selectedGrade)) {
        return false;
      }
      if (
        selectedClass !== 'all' &&
        s.className?.trim().toUpperCase() !== selectedClass.trim().toUpperCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(query);
        const matchUser = s.username.toLowerCase().includes(query);
        const matchClass = s.className?.toLowerCase().includes(query);
        if (!matchName && !matchUser && !matchClass) return false;
      }
      return true;
    });
  }, [allStudents, selectedGrade, selectedClass, searchQuery]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = allStudents.length;
    const g6 = allStudents.filter((s) => Number(s.grade) === 6).length;
    const g7 = allStudents.filter((s) => Number(s.grade) === 7).length;
    const g8 = allStudents.filter((s) => Number(s.grade) === 8).length;
    const g9 = allStudents.filter((s) => Number(s.grade) === 9).length;
    return { total, g6, g7, g8, g9 };
  }, [allStudents]);

  // Xử lý chọn tất cả / bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Thực thi đặt mật khẩu chung đồng loạt
  const handleExecuteBatchPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = batchPasswordInput.trim() || '123456';
    const targetIds =
      selectedStudentIds.length > 0
        ? selectedStudentIds
        : filteredStudents.map((s) => s.id);

    if (targetIds.length === 0) {
      showToast('Chưa chọn học sinh nào để đặt mật khẩu chung!');
      return;
    }

    const res = setBatchStudentPassword(targetIds, cleanPass);
    setIsBatchPasswordModalOpen(false);
    triggerUpdate();
    showToast(res.message);
  };

  // Thực thi xóa học sinh
  const handleExecuteDelete = () => {
    if (deleteConfirm.isBatch) {
      let count = 0;
      selectedStudentIds.forEach((id) => {
        deleteStudentUser(id);
        count++;
      });
      setSelectedStudentIds([]);
      triggerUpdate();
      showToast(`Đã xóa thành công ${count} tài khoản học sinh!`);
    } else if (deleteConfirm.student) {
      const name = deleteConfirm.student.fullName;
      deleteStudentUser(deleteConfirm.student.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== deleteConfirm.student!.id));
      triggerUpdate();
      showToast(`Đã xóa thành công tài khoản học sinh "${name}"!`);
    }
  };

  // Xuất danh sách Excel
  const handleExportList = () => {
    const listToExport =
      selectedStudentIds.length > 0
        ? allStudents.filter((s) => selectedStudentIds.includes(s.id))
        : filteredStudents;

    const prefix =
      selectedGrade === 'all'
        ? 'Danh_Sach_Tai_Khoan_Hoc_Sinh_Tin_Hoc'
        : `Danh_Sach_Tai_Khoan_Hoc_Sinh_Khoi_${selectedGrade}`;

    exportStudentListToExcel(listToExport, prefix);
    showToast(`Đã xuất ${listToExport.length} tài khoản học sinh ra file Excel!`);
  };

  return (
    <div className="space-y-6">
      {/* Thẻ Thống Kê Tài Khoản Học Sinh Theo Khối Lớp */}
      {lockGrade ? (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-indigo-50/50 to-emerald-50/40 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-sm flex-shrink-0">
              K{selectedGrade}
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Danh Sách Học Sinh Khối {selectedGrade}</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {filteredStudents.length} học sinh
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấp lại mật khẩu khi quên, chỉnh sửa thông tin, thêm hoặc xóa học sinh Khối {selectedGrade}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setIsEditModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm vào Khối {selectedGrade}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExcelImportOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Nhập Excel</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Tổng tài khoản</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {stats.total} <span className="text-xs font-semibold text-slate-400">em</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedGrade(6)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedGrade === 6
                ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 font-bold text-xs">
              K6
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Khối 6 (Tin học 6)</div>
              <div className="text-xl font-black text-blue-700 mt-0.5">
                {stats.g6} <span className="text-xs font-semibold text-slate-400">em</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedGrade(7)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedGrade === 7
                ? 'bg-teal-50/70 border-teal-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 font-bold text-xs">
              K7
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Khối 7 (Tin học 7)</div>
              <div className="text-xl font-black text-teal-700 mt-0.5">
                {stats.g7} <span className="text-xs font-semibold text-slate-400">em</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedGrade(8)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedGrade === 8
                ? 'bg-purple-50/70 border-purple-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 font-bold text-xs">
              K8
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Khối 8 (Tin học 8)</div>
              <div className="text-xl font-black text-purple-700 mt-0.5">
                {stats.g8} <span className="text-xs font-semibold text-slate-400">em</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedGrade(9)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 col-span-2 sm:col-span-1 ${
              selectedGrade === 9
                ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 font-bold text-xs">
              K9
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Khối 9 (Tin học 9)</div>
              <div className="text-xl font-black text-amber-700 mt-0.5">
                {stats.g9} <span className="text-xs font-semibold text-slate-400">em</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thanh Hành Động Chính Của Giáo Viên */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Quản Lý Danh Sách & Tài Khoản Học Sinh</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thêm học sinh từ tệp Excel, đặt mật khẩu chung đồng loạt và cấp lại mật khẩu cho học sinh quên
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* 1. Nút Thêm từ tệp Excel */}
            <button
              type="button"
              onClick={() => setIsExcelImportOpen(true)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[42px]"
              title="Thêm danh sách học sinh từ file Excel gồm: Họ và tên, Lớp, Tài khoản"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100 flex-shrink-0" />
              <span>thêm HS từ tệp</span>
            </button>

            {/* 2. Nút Đặt mật khẩu chung đồng loạt */}
            <button
              type="button"
              onClick={() => {
                setBatchPasswordInput('123456');
                setIsBatchPasswordModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer min-h-[42px]"
              title="Đặt mật khẩu chung đồng loạt cho danh sách đang chọn hoặc tất cả học sinh"
            >
              <KeyRound className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Đặt MK Chung</span>
            </button>

            {/* 3. Nút Thêm học sinh */}
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[42px]"
            >
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              <span>Thêm học sinh</span>
            </button>

            {/* 4. Nút Tải file mẫu */}
            <button
              type="button"
              onClick={downloadStudentTemplateExcel}
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[42px]"
              title="Tải về file Excel mẫu 3 cột: Họ và tên, Lớp, Tài khoản"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Mẫu Excel</span>
            </button>

            {/* 5. Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportList}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[42px]"
              title="Xuất bảng tài khoản học sinh ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Xuất DS</span>
            </button>
          </div>
        </div>

        {/* Thanh Bộ Lọc & Tìm Kiếm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, tài khoản, lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Lọc theo Khối */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) =>
                setSelectedGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">Tất cả Khối lớp (Khối 6, 7, 8, 9)</option>
              <option value="6">Khối 6 (Tin học 6)</option>
              <option value="7">Khối 7 (Tin học 7)</option>
              <option value="8">Khối 8 (Tin học 8)</option>
              <option value="9">Khối 9 (Tin học 9)</option>
            </select>
          </div>

          {/* Lọc theo Lớp */}
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

          {/* Toggle hiện/ẩn mật khẩu */}
          <div className="flex items-center justify-between sm:justify-end gap-2 px-1">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
            >
              {showPasswords ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ẩn mật khẩu</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xem mật khẩu ({filteredStudents.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thanh Thao Tác Hàng Loạt Khi Có Chọn Checkbox */}
        {selectedStudentIds.length > 0 && (
          <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Đã chọn {selectedStudentIds.length} học sinh</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBatchPasswordInput('123456');
                  setIsBatchPasswordModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đặt mật khẩu chung cho {selectedStudentIds.length} em</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: true,
                    isBatch: true,
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa {selectedStudentIds.length} tài khoản</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Bỏ chọn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bảng Danh Sách Học Sinh */}
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">Chưa tìm thấy học sinh nào</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thầy/Cô có thể nhấp <strong>"thêm HS từ tệp"</strong> để thêm đồng loạt danh sách lớp, hoặc nhấp <strong>"Thêm học sinh"</strong>.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsExcelImportOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                thêm HS từ tệp ngay
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* GIAO DIỆN DI ĐỘNG: Danh sách thẻ học sinh trực quan, dễ thao tác chạm bằng ngón tay */}
            <div className="block sm:hidden space-y-3">
              {/* Nút chọn tất cả trên di động */}
              <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 font-bold cursor-pointer"
                >
                  {selectedStudentIds.length === filteredStudents.length &&
                  filteredStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Chọn tất cả ({filteredStudents.length} học sinh)</span>
                </button>
                <span className="text-[11px] font-semibold text-slate-400">
                  Đã chọn: {selectedStudentIds.length}
                </span>
              </div>

              {filteredStudents.map((student, idx) => {
                const isChecked = selectedStudentIds.includes(student.id);

                return (
                  <div
                    key={student.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-3 bg-white shadow-2xs ${
                      isChecked
                        ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(student.id)}
                          className="pt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer flex-shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 leading-snug">
                              {student.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                              Lớp {student.className || 'Chưa rõ'}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              (Khối {student.grade || 8})
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-auto">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt động</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin tài khoản & mật khẩu trên điện thoại */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                          Tài khoản:
                        </span>
                        <span className="font-mono font-bold text-indigo-700 text-xs break-all">
                          {student.username}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                          Mật khẩu:
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {showPasswords ? (
                            <span className="text-amber-700 font-bold">
                              {student.password || '123'}
                            </span>
                          ) : (
                            <span className="text-slate-400 tracking-wider">••••••</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Cụm nút thao tác di động: Nút to, dễ bấm bằng ngón tay */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setResetPasswordStudent(student)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[38px]"
                        title="Cấp lại mật khẩu cho học sinh này"
                      >
                        <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Cấp lại MK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(student);
                          setIsEditModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[38px]"
                        title="Sửa thông tin học sinh"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            student,
                          })
                        }
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Xóa tài khoản này"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GIAO DIỆN MÁY TÍNH & TABLET: Bảng dữ liệu đầy đủ */}
            <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden shadow-2xs overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="p-0.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        {selectedStudentIds.length === filteredStudents.length &&
                        filteredStudents.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Họ và tên học sinh</th>
                    <th className="py-3 px-4">Lớp & Khối</th>
                    <th className="py-3 px-4">Tài khoản đăng nhập</th>
                    <th className="py-3 px-4">Mật khẩu</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStudents.map((student, idx) => {
                    const isChecked = selectedStudentIds.includes(student.id);

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-indigo-50/30 transition-colors ${
                          isChecked ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectOne(student.id)}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* STT */}
                        <td className="py-2.5 px-3 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Họ và tên */}
                        <td className="py-2.5 px-4 font-bold text-slate-900 text-sm">
                          {student.fullName}
                        </td>

                        {/* Lớp & Khối */}
                        <td className="py-2.5 px-4">
                          <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {student.className || 'Chưa rõ'}
                          </span>
                          <span className="ml-1.5 text-slate-500 font-semibold text-[11px]">
                            (Khối {student.grade || 8})
                          </span>
                        </td>

                        {/* Tài khoản */}
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                          <span className="bg-indigo-50/80 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                            {student.username}
                          </span>
                        </td>

                        {/* Mật khẩu */}
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {showPasswords ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {student.password || '123'}
                            </span>
                          ) : (
                            <span className="text-slate-400 tracking-wider">••••••</span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Hoạt động</span>
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Cấp lại mật khẩu (KeyRound) */}
                            <button
                              type="button"
                              onClick={() => setResetPasswordStudent(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                              title="Cấp lại mật khẩu khi học sinh quên"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Cấp lại MK</span>
                            </button>

                            {/* Nút Sửa thông tin */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(student);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa thông tin học sinh"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Xóa học sinh */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                 isOpen: true,
                                 student,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* MODAL 1: Nhập danh sách học sinh từ tệp Excel */}
      <ExcelStudentImportModal
        isOpen={isExcelImportOpen}
        targetGrade={selectedGrade === 'all' ? 8 : selectedGrade}
        onClose={() => setIsExcelImportOpen(false)}
        onSuccess={(msg) => {
          triggerUpdate();
          showToast(msg);
        }}
      />

      {/* MODAL 2: Cấp lại mật khẩu cho 1 học sinh khi học sinh quên */}
      <ResetPasswordModal
        isOpen={Boolean(resetPasswordStudent)}
        student={resetPasswordStudent}
        onClose={() => setResetPasswordStudent(null)}
        onSuccess={(msg) => {
          triggerUpdate();
          showToast(msg);
        }}
      />

      {/* MODAL 3: Đặt mật khẩu chung đồng loạt cho danh sách đang chọn hoặc tất cả */}
      {isBatchPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Đặt Mật Khẩu Chung Đồng Loạt</h3>
                  <p className="text-xs text-amber-100">
                    Áp dụng cho {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} học sinh được chọn` : `toàn bộ ${filteredStudents.length} học sinh đang lọc`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPasswordModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBatchPassword} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nhập mật khẩu chung đồng loạt mới <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={batchPasswordInput}
                  onChange={(e) => setBatchPasswordInput(e.target.value)}
                  placeholder="Ví dụ: 123 hoặc 123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                  {['123', '123456', 'HocSinh@26', 'thcs2026'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBatchPasswordInput(p)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        batchPasswordInput === p
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                ⚠️ Mật khẩu của các học sinh được chọn sẽ được đồng loạt thay đổi thành <strong>"{batchPasswordInput}"</strong>. Học sinh sẽ dùng tài khoản hiện có và mật khẩu này để đăng nhập.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Xác Nhận Đặt Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Thêm hoặc Sửa 1 tài khoản học sinh thủ công */}
      {isEditModalOpen && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          initialStudent={editingStudent}
          defaultGrade={selectedGrade === 'all' ? 8 : selectedGrade}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(msg) => {
            triggerUpdate();
            showToast(msg);
          }}
        />
      )}

      {/* MODAL 5: Xác nhận xóa an toàn */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.isBatch ? 'Xác nhận xóa hàng loạt' : 'Xác nhận xóa tài khoản học sinh'}
        itemTitle={
          deleteConfirm.isBatch
            ? `Xóa toàn bộ ${selectedStudentIds.length} học sinh đang được chọn`
            : `${deleteConfirm.student?.fullName} (Tài khoản: ${deleteConfirm.student?.username} - Lớp ${deleteConfirm.student?.className})`
        }
        message="Dữ liệu tài khoản của học sinh này sẽ bị xóa khỏi hệ thống. Học sinh sẽ không thể đăng nhập bằng tài khoản này nữa."
        confirmLabel={deleteConfirm.isBatch ? `Xóa ${selectedStudentIds.length} học sinh` : 'Xác nhận xóa'}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteConfirm({ isOpen: false })}
      />

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700/80 backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

// Component con: Modal Thêm / Chỉnh sửa tài khoản học sinh thủ công
const EditStudentModal: React.FC<{
  isOpen: boolean;
  initialStudent: User | null;
  defaultGrade?: GradeLevel;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}> = ({ isOpen, initialStudent, defaultGrade = 8, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState(initialStudent?.fullName || '');
  const [username, setUsername] = useState(initialStudent?.username || '');
  const [password, setPassword] = useState(initialStudent?.password || '123456');
  const [grade, setGrade] = useState<GradeLevel>(initialStudent?.grade || defaultGrade);
  const [className, setClassName] = useState(initialStudent?.className || `${defaultGrade}A1`);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên học sinh!');
      return;
    }
    if (!username.trim()) {
      setError('Vui lòng nhập Tên tài khoản!');
      return;
    }

    const res = saveStudentUser({
      id: initialStudent?.id,
      fullName: fullName.trim(),
      username: username.trim(),
      password: password.trim() || '123456',
      grade,
      className: className.trim().toUpperCase(),
      role: 'student',
    });

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <h3 className="text-base font-bold">
            {initialStudent ? 'Chỉnh Sửa Tài Khoản Học Sinh' : 'Thêm Học Sinh Mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ và tên học sinh <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp học <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: 8A1"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 uppercase font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên tài khoản (Tên đăng nhập) <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: vanan8a1"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mật khẩu đăng nhập:
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mặc định: 123456"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              {initialStudent ? 'Lưu Thay Đổi' : 'Thêm Học Sinh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
