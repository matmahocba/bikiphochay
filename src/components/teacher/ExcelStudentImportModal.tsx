/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { GradeLevel } from '../../types';
import { batchImportStudents } from '../../services/storageService';
import { downloadStudentTemplateExcel } from '../../services/excelExport';
import {
  FileSpreadsheet,
  Upload,
  Download,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ParsedStudentItem {
  id: string;
  fullName: string;
  className: string;
  username: string;
  grade: GradeLevel;
  isValid: boolean;
  errorReason?: string;
}

interface ExcelStudentImportModalProps {
  isOpen: boolean;
  targetGrade?: GradeLevel;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  isOpen,
  targetGrade = 8,
  onClose,
  onSuccess,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(targetGrade);
  const [defaultPassword, setDefaultPassword] = useState('123');
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentItem[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Tự động nhận diện Khối lớp từ tên lớp (ví dụ: '6A1' -> 6, '7B' -> 7, '8A' -> 8, '9C' -> 9)
  const extractGradeFromClass = (className: string, fallbackGrade: GradeLevel): GradeLevel => {
    const match = className.trim().match(/^[6-9]/);
    if (match) {
      const g = parseInt(match[0], 10);
      if (g >= 6 && g <= 9) return g as GradeLevel;
    }
    return fallbackGrade;
  };

  // Tạo username tự động nếu dòng trong Excel bị thiếu tài khoản
  const generateUsernameFromInfo = (fullName: string, className: string, index: number): string => {
    const removeAccents = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');

    const clean = removeAccents(fullName.trim().toLowerCase()).replace(/[^a-z0-9]/g, '');
    const cleanCls = className.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean || 'hs'}${cleanCls || 'class'}_${index + 1}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setParsingError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error('Tệp Excel không chứa bảng tính (Sheet) hợp lệ.');
        }

        // Đọc dữ liệu thô dạng mảng các dòng
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawRows.length < 2) {
          throw new Error('Tệp Excel cần có ít nhất 1 dòng tiêu đề cột và 1 dòng dữ liệu học sinh.');
        }

        // Tìm dòng tiêu đề (Header row) chứa "Họ và tên", "Lớp", "Tài khoản"
        let headerRowIndex = -1;
        let colFullName = -1;
        let colClass = -1;
        let colUsername = -1;

        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r].map((cell: any) => String(cell || '').trim().toLowerCase());

          const nameIdx = row.findIndex(
            (c: string) =>
              c.includes('họ và tên') ||
              c.includes('họ tên') ||
              c.includes('tên học sinh') ||
              c.includes('full name') ||
              c === 'tên'
          );
          const classIdx = row.findIndex(
            (c: string) => c === 'lớp' || c.includes('lớp') || c.includes('class')
          );
          const userIdx = row.findIndex(
            (c: string) =>
              c.includes('tài khoản') ||
              c.includes('tên đăng nhập') ||
              c.includes('username') ||
              c === 'tk' ||
              c.includes('mã học sinh') ||
              c.includes('mã hs')
          );

          if (nameIdx !== -1 && classIdx !== -1) {
            headerRowIndex = r;
            colFullName = nameIdx;
            colClass = classIdx;
            colUsername = userIdx;
            break;
          }
        }

        // Nếu không tìm thấy cột chuẩn, thử dùng vị trí mặc định 1, 2, 3
        if (headerRowIndex === -1) {
          headerRowIndex = 0;
          colFullName = 1;
          colClass = 2;
          colUsername = 3;
        }

        const items: ParsedStudentItem[] = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const rawName = String(row[colFullName] ?? '').trim();
          const rawClass = String(row[colClass] ?? '').trim().toUpperCase();
          let rawUser = colUsername !== -1 ? String(row[colUsername] ?? '').trim().toLowerCase() : '';

          // Bỏ qua dòng trống hoàn toàn
          if (!rawName && !rawClass && !rawUser) continue;

          let isValid = true;
          let errorReason = '';

          if (!rawName) {
            isValid = false;
            errorReason = 'Thiếu Họ và tên';
          } else if (!rawClass) {
            isValid = false;
            errorReason = 'Thiếu thông tin Lớp';
          }

          if (!rawUser && rawName && rawClass) {
            // Tự động sinh tài khoản nếu chưa có trong file
            rawUser = generateUsernameFromInfo(rawName, rawClass, i);
          }

          const grade = extractGradeFromClass(rawClass, selectedGrade);

          items.push({
            id: `import_row_${i}_${Date.now()}`,
            fullName: rawName,
            className: rawClass,
            username: rawUser,
            grade,
            isValid,
            errorReason,
          });
        }

        if (items.length === 0) {
          throw new Error('Không tìm thấy bản ghi học sinh nào trong tệp Excel vừa tải lên.');
        }

        setParsedStudents(items);
        setIsProcessing(false);
      } catch (err: any) {
        setParsingError(err?.message || 'Có lỗi xảy ra khi đọc tệp Excel. Vui lòng kiểm tra lại định dạng tệp!');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParsingError('Không thể đọc file. Vui lòng thử lại!');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleRemoveItem = (id: string) => {
    setParsedStudents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmImport = () => {
    const validStudents = parsedStudents.filter((s) => s.isValid);
    if (validStudents.length === 0) {
      setParsingError('Không có dữ liệu học sinh hợp lệ nào để nhập vào hệ thống!');
      return;
    }

    const cleanPassword = defaultPassword.trim() || '123';

    const result = batchImportStudents({
      students: validStudents.map((s) => ({
        fullName: s.fullName,
        className: s.className,
        username: s.username,
        grade: s.grade,
      })),
      defaultPassword: cleanPassword,
      targetGrade: selectedGrade,
    });

    onSuccess(
      `Thành công: ${result.message} Học sinh có thể dùng tài khoản và mật khẩu này để đăng nhập ngay!`
    );
    onClose();
  };

  const validCount = parsedStudents.filter((s) => s.isValid).length;
  const invalidCount = parsedStudents.filter((s) => !s.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header Modal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Thêm Danh Sách Học Sinh Từ Tệp Excel</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Tin học 6-9
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Hỗ trợ bảng gồm các cột: <strong>Họ và tên</strong>, <strong>Lớp</strong>, <strong>Tài khoản</strong> và đặt mật khẩu chung đồng loạt
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chính Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Hướng dẫn & Tải tệp Excel mẫu */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-700">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Quy chuẩn tệp Excel danh sách học sinh:</span>
              </div>
              <p>
                Bảng tính cần có các cột: <strong>Họ và tên</strong>, <strong>Lớp</strong> (Ví dụ: 6A1, 7A2, 8A1, 9B...) và <strong>Tài khoản</strong> (Tên đăng nhập).
              </p>
              <p className="text-slate-500 text-[11px]">
                * Khối lớp sẽ được hệ thống tự động suy ra từ tên lớp (VD: Lớp 8A1 ➔ Khối 8). Nếu cột tài khoản để trống, hệ thống sẽ tự động khởi tạo theo tên và lớp.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadStudentTemplateExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-300 shadow-xs transition-all flex-shrink-0 cursor-pointer"
              title="Tải về tệp Excel mẫu .xlsx"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải Tệp Excel Mẫu Chuẩn</span>
            </button>
          </div>

          {/* Cấu hình mật khẩu chung đồng loạt & Khối mặc định */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            {/* 1. Mật khẩu chung đồng loạt */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Mật khẩu chung đồng loạt cho toàn danh sách:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="Ví dụ: 123 hoặc 123456"
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
                {['123', '123456', 'HocSinh@26', 'thcs2026'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDefaultPassword(p)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      defaultPassword === p
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Khối lớp mục tiêu (nếu trong file lớp không có số khối) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Khối lớp mặc định (khi lớp không có số khối):</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      selectedGrade === g
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                * Tất cả học sinh nhập vào sẽ được cấp mật khẩu này để đăng nhập ứng dụng.
              </p>
            </div>
          </div>

          {/* Khu vực chọn / Kéo thả tệp Excel */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                file
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/10'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {file ? file.name : 'Nhấp để chọn tệp Excel hoặc kéo thả tệp vào đây'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng hỗ trợ: <strong>.xlsx, .xls, .csv</strong> (Kích thước tối đa 15MB)
                </p>
              </div>

              <button
                type="button"
                className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {file ? 'Chọn tệp Excel khác' : 'Chọn tệp từ máy tính'}
              </button>
            </div>
          </div>

          {/* Thông báo lỗi nếu có */}
          {parsingError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Bảng xem trước danh sách học sinh sau khi đọc file */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Bản xem trước danh sách ({parsedStudents.length} học sinh)
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {invalidCount} lỗi
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  Mật khẩu áp dụng: <span className="font-mono font-bold text-amber-700">{defaultPassword}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Lớp & Khối</th>
                      <th className="py-2.5 px-3">Tài khoản đăng nhập</th>
                      <th className="py-2.5 px-3">Mật khẩu chung</th>
                      <th className="py-2.5 px-3 text-center w-24">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right w-16">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedStudents.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !item.isValid ? 'bg-rose-50/40 text-rose-800' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{item.fullName || '---'}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-700">{item.className}</span>{' '}
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Khối {item.grade})
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">{item.username}</td>
                        <td className="py-2 px-3 font-mono text-amber-700 font-semibold">
                          {defaultPassword}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sẵn sàng</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={item.errorReason}>
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>{item.errorReason || 'Lỗi'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedStudents.length > 0 ? (
              <span>
                Đã nạp <strong>{validCount}</strong> học sinh hợp lệ • Mật khẩu chung: <strong className="font-mono text-amber-700">{defaultPassword}</strong>
              </span>
            ) : (
              <span>Vui lòng chọn hoặc tải tệp Excel để bắt đầu</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Thêm {validCount > 0 ? `${validCount} Học Sinh` : 'Danh Sách'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
