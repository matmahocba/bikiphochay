/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Submission } from '../types';

/**
 * LOGIC QUAN TRỌNG: XUẤT BẢNG THỐNG KÊ LỊCH SỬ ÔN TẬP RA FILE EXCEL (.XLSX)
 *
 * 1. Chuyển đổi mảng đối tượng Submission thành định dạng bảng dữ liệu có tiêu đề tiếng Việt rõ ràng.
 * 2. Định dạng ngày giờ nộp bài theo chuẩn Việt Nam (DD/MM/YYYY HH:mm:ss).
 * 3. Tự động tính độ rộng cột (col widths) để bảng tính hiển thị đẹp mắt, không bị che khuất văn bản.
 * 4. Tạo workbook mới, gắn worksheet và kích hoạt tải về file .xlsx bằng hàm XLSX.writeFile.
 */
export function exportSubmissionsToExcel(
  submissions: Submission[],
  fileNamePrefix: string = 'Bao_Cao_Tin_Hoc_THCS'
): void {
  if (!submissions || submissions.length === 0) {
    alert('Không có dữ liệu bài nộp nào để xuất file Excel!');
    return;
  }

  // Bước 1: Chuẩn bị dữ liệu từng dòng cho file Excel
  const excelData = submissions.map((sub, index) => {
    // Định dạng thời gian nộp bài sang chuẩn Việt Nam
    const submitDate = new Date(sub.submittedAt);
    const formattedDate = !isNaN(submitDate.getTime())
      ? submitDate.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : sub.submittedAt;

    // Thời gian làm bài (phút : giây)
    const minutes = Math.floor((sub.timeSpentSeconds || 0) / 60);
    const seconds = (sub.timeSpentSeconds || 0) % 60;
    const timeSpentStr = `${minutes} phút ${seconds} giây`;

    return {
      'STT': index + 1,
      'Họ và tên Học sinh': sub.studentName,
      'Lớp': sub.studentClass,
      'Khối lớp': `Khối ${sub.grade}`,
      'Tên bài học': sub.lessonTitle,
      'Môn học': sub.subject,
      'Điểm số (Thang 10)': sub.score,
      'Số câu đúng': `${sub.correctCount}/${sub.totalQuestions}`,
      'Số lần làm lại (Lần thứ)': sub.attemptNumber,
      'Thời gian làm bài': timeSpentStr,
      'Thời gian nộp bài': formattedDate,
    };
  });

  // Bước 2: Tạo Worksheet từ mảng JSON
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Bước 3: Cấu hình độ rộng cho từng cột tương ứng để bảng hiển thị trực quan
  const columnWidths = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Lớp
    { wch: 12 }, // Khối lớp
    { wch: 36 }, // Tên bài học
    { wch: 18 }, // Môn học
    { wch: 18 }, // Điểm số
    { wch: 14 }, // Số câu đúng
    { wch: 22 }, // Số lần làm lại
    { wch: 20 }, // Thời gian làm bài
    { wch: 22 }, // Thời gian nộp bài
  ];
  worksheet['!cols'] = columnWidths;

  // Bước 4: Tạo Workbook chứa worksheet vừa tạo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê kết quả');

  // Bước 5: Đặt tên file xuất với timestamp hiện tại
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  const cleanPrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fullFileName = `${cleanPrefix}_${timestamp}.xlsx`;

  // Kích hoạt tiến trình tải file Excel về máy tính của người dùng
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * Tải về tệp Excel mẫu chuẩn để giáo viên thêm danh sách học sinh:
 * Gồm 3 cột chính: Họ và tên, Lớp, Tài khoản
 */
export function downloadStudentTemplateExcel(): void {
  const sampleData = [
    {
      'STT': 1,
      'Họ và tên': 'Nguyễn Văn An',
      'Lớp': '8A1',
      'Tài khoản': 'vanan8a1',
      'Ghi chú': 'Học sinh Khối 8',
    },
    {
      'STT': 2,
      'Họ và tên': 'Trần Thị Mai',
      'Lớp': '8A1',
      'Tài khoản': 'thimai8a1',
      'Ghi chú': 'Học sinh Khối 8',
    },
    {
      'STT': 3,
      'Họ và tên': 'Lê Hoàng Long',
      'Lớp': '8A2',
      'Tài khoản': 'hoanglong8a2',
      'Ghi chú': 'Học sinh Khối 8',
    },
    {
      'STT': 4,
      'Họ và tên': 'Phạm Quỳnh Anh',
      'Lớp': '7A1',
      'Tài khoản': 'quynhanh7a1',
      'Ghi chú': 'Học sinh Khối 7',
    },
    {
      'STT': 5,
      'Họ và tên': 'Vũ Đức Minh',
      'Lớp': '6A3',
      'Tài khoản': 'ducminh6a3',
      'Ghi chú': 'Học sinh Khối 6',
    },
    {
      'STT': 6,
      'Họ và tên': 'Đặng Bảo Ngọc',
      'Lớp': '9A1',
      'Tài khoản': 'baongoc9a1',
      'Ghi chú': 'Học sinh Khối 9',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 26 }, // Họ và tên
    { wch: 12 }, // Lớp
    { wch: 20 }, // Tài khoản
    { wch: 24 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Danh_Sach_HS');
  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh_Tin_Hoc.xlsx');
}

/**
 * Xuất danh sách tài khoản học sinh ra file Excel (.xlsx) kèm thông tin tài khoản & mật khẩu
 */
export function exportStudentListToExcel(
  students: Array<{
    id: string;
    fullName: string;
    className?: string;
    grade?: number;
    username: string;
    password?: string;
    createdAt?: string;
  }>,
  fileNamePrefix: string = 'Danh_Sach_Tai_Khoan_Hoc_Sinh'
): void {
  if (!students || students.length === 0) {
    return;
  }

  const excelData = students.map((s, index) => {
    return {
      'STT': index + 1,
      'Họ và tên': s.fullName,
      'Lớp': s.className || '',
      'Khối': s.grade ? `Khối ${s.grade}` : '',
      'Tài khoản (Tên đăng nhập)': s.username,
      'Mật khẩu': s.password || '123',
      'Ngày tạo': s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 26 }, // Họ và tên
    { wch: 10 }, // Lớp
    { wch: 12 }, // Khối
    { wch: 24 }, // Tài khoản
    { wch: 16 }, // Mật khẩu
    { wch: 16 }, // Ngày tạo
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tai_Khoan_Hoc_Sinh');

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  XLSX.writeFile(workbook, `${fileNamePrefix}_${timestamp}.xlsx`);
}
