/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { GradeLevel, User } from '../types';

export interface ParsedStudentRow {
  fullName: string;
  className: string;
  username: string;
  grade?: GradeLevel;
  error?: string;
}

/**
 * Tải file Excel mẫu danh sách học sinh theo khối
 */
export function downloadStudentListTemplate(grade: GradeLevel = 8): void {
  const sampleData = [
    {
      'STT': 1,
      'Họ và tên': 'Nguyễn Văn An',
      'Lớp': `${grade}A1`,
      'Tài khoản': `an.nv${grade}a1`,
    },
    {
      'STT': 2,
      'Họ và tên': 'Trần Thị Bình',
      'Lớp': `${grade}A1`,
      'Tài khoản': `binh.tt${grade}a1`,
    },
    {
      'STT': 3,
      'Họ và tên': 'Lê Hoàng Cường',
      'Lớp': `${grade}A2`,
      'Tài khoản': `cuong.lh${grade}a2`,
    },
    {
      'STT': 4,
      'Họ và tên': 'Phạm Thu Dung',
      'Lớp': `${grade}A2`,
      'Tài khoản': `dung.pt${grade}a2`,
    },
    {
      'STT': 5,
      'Họ và tên': 'Đặng Quốc Huy',
      'Lớp': `${grade}B1`,
      'Tài khoản': `huy.dq${grade}b1`,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Đặt độ rộng các cột
  worksheet['!cols'] = [
    { wch: 8 },  // STT
    { wch: 25 }, // Họ và tên
    { wch: 12 }, // Lớp
    { wch: 20 }, // Tài khoản
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `HocSinh_Khoi_${grade}`);

  XLSX.writeFile(workbook, `Mau_Danh_Sach_Hoc_Sinh_Khoi_${grade}.xlsx`);
}

/**
 * Xuất danh sách học sinh hiện có ra file Excel
 */
export function exportStudentRosterToExcel(students: User[], gradeLabel: string = 'Toan_Bo'): void {
  const data = students.map((s, idx) => ({
    'STT': idx + 1,
    'Họ và tên': s.fullName,
    'Khối': s.grade ? `Khối ${s.grade}` : '',
    'Lớp': s.className || '',
    'Tên tài khoản (Username)': s.username,
    'Mật khẩu': s.password || '',
    'Ngày tạo': s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh');
  XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_${gradeLabel}.xlsx`);
}

/**
 * Đọc và phân tích file Excel / CSV danh sách học sinh
 */
export async function parseStudentsFromExcelFile(
  file: File,
  defaultGrade: GradeLevel = 8
): Promise<{ students: ParsedStudentRow[]; errors: string[] }> {
  const errors: string[] = [];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('Tệp Excel không có trang tính (sheet) nào.');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Tệp Excel không chứa dữ liệu học sinh.');
  }

  const students: ParsedStudentRow[] = [];

  rawRows.forEach((row, index) => {
    // Chuẩn hóa tên các thuộc tính (keys) không phân biệt hoa thường hoặc dấu
    let rawFullName = '';
    let rawClass = '';
    let rawUsername = '';
    let rawGrade: GradeLevel | undefined = undefined;

    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase();
      const strVal = String(val).trim();

      // Nhận diện cột Họ và tên
      if (
        cleanKey.includes('họ') ||
        cleanKey.includes('tên') ||
        cleanKey.includes('name') ||
        cleanKey === 'fullname'
      ) {
        if (!rawFullName) rawFullName = strVal;
      }
      // Nhận diện cột Lớp
      else if (cleanKey.includes('lớp') || cleanKey === 'class' || cleanKey === 'classname') {
        if (!rawClass) rawClass = strVal;
      }
      // Nhận diện cột Tài khoản / Tên đăng nhập
      else if (
        cleanKey.includes('tài khoản') ||
        cleanKey.includes('tai khoan') ||
        cleanKey.includes('đăng nhập') ||
        cleanKey.includes('dang nhap') ||
        cleanKey.includes('username') ||
        cleanKey.includes('user') ||
        cleanKey.includes('mã hs') ||
        cleanKey.includes('mahs')
      ) {
        if (!rawUsername) rawUsername = strVal;
      }
      // Nhận diện cột Khối nếu có
      else if (cleanKey.includes('khối') || cleanKey === 'grade') {
        const num = parseInt(strVal.replace(/[^0-9]/g, ''), 10);
        if ([6, 7, 8, 9].includes(num)) {
          rawGrade = num as GradeLevel;
        }
      }
    }

    // Nếu không tìm thấy cột có tiêu đề chuẩn, thử lấy theo thứ tự cột thứ 2, 3, 4
    if (!rawFullName || !rawClass || !rawUsername) {
      const values = Object.values(row).map((v) => String(v).trim()).filter((v) => v !== '');
      if (values.length >= 3) {
        if (!rawFullName) rawFullName = values[1] || values[0];
        if (!rawClass) rawClass = values[2] || values[1];
        if (!rawUsername) rawUsername = values[3] || values[2];
      }
    }

    if (!rawFullName && !rawUsername) {
      // Dòng trống, bỏ qua
      return;
    }

    // Kiểm tra và tự động suy ra khối nếu có trong tên lớp (ví dụ lớp 8A1 -> Khối 8)
    let finalGrade = rawGrade || defaultGrade;
    const matchGrade = rawClass.match(/^([6-9])/);
    if (matchGrade) {
      finalGrade = parseInt(matchGrade[1], 10) as GradeLevel;
    }

    // Tự sinh username nếu trống (ví dụ dựa trên họ tên không dấu)
    let finalUsername = rawUsername;
    if (!finalUsername && rawFullName) {
      finalUsername = rawFullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') + `.${rawClass.toLowerCase()}`;
    }

    if (!rawFullName || !finalUsername) {
      errors.push(`Dòng ${index + 2}: Thiếu Họ tên hoặc Tên tài khoản.`);
      return;
    }

    students.push({
      fullName: rawFullName,
      className: rawClass.toUpperCase() || `${finalGrade}A`,
      username: finalUsername.toLowerCase(),
      grade: finalGrade,
    });
  });

  return { students, errors };
}
