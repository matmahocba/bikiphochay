/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'teacher' | 'student';

export type GradeLevel = 6 | 7 | 8 | 9;

export interface User {
  id: string;
  username: string;
  password?: string; // In real auth this would be hashed on backend; stored in LocalStorage for prototype
  fullName: string;
  role: Role;
  grade?: GradeLevel;
  className?: string; // e.g., '6A1', '7B', '8A', '9C'
  createdAt: string;
}

export type QuestionType =
  | 'multiple_choice'    // Trắc nghiệm 4 lựa chọn (A, B, C, D - 1 đáp án đúng)
  | 'fill_in_the_blank'  // Trắc nghiệm trả lời ngắn (Điền khuyết)
  | 'drag_and_drop'      // Câu hỏi Kéo thả (Kéo đáp án vào ô trống)
  | 'essay';             // Tự luận (Học sinh tự gõ câu trả lời dài)

export interface Option {
  id: string;
  text: string;
}

export interface DragDropPair {
  id: string;
  itemText: string;     // Thẻ có thể kéo thả (ví dụ: "Oxy", "Lục lạp", "2.5")
  slotLabel: string;    // Nhãn của ô vị trí đích (ví dụ: "Khí duy trì sự sống", "Bào quan quang hợp")
}

export interface Question {
  id: string;
  lessonId: string;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  points: number; // Mặc định 1 điểm hoặc theo trọng số

  // Dành cho Trắc nghiệm 4 lựa chọn
  options?: Option[];
  correctOptionId?: string; // e.g. "opt_1"

  // Dành cho Trả lời ngắn / Điền khuyết
  acceptableAnswers?: string[]; // Danh sách đáp án được chấp nhận (không phân biệt hoa thường)

  // Dành cho Kéo thả
  dragDropPairs?: DragDropPair[]; // Các cặp item và ô đích

  // Dành cho Tự luận
  essayGuide?: string; // Hướng dẫn chấm / Gợi ý đáp án của giáo viên
}

export interface Lesson {
  id: string;
  grade: GradeLevel;
  subject: string;
  title: string;
  description: string;
  allowReviewResults: boolean; // "Cho phép học sinh xem thống kê kết quả sau khi làm xong"
  timeLimitMinutes?: number; // 0 = Không giới hạn thời gian (tự do); >0 = số phút đếm ngược
  maxAttempts?: number; // 0 = Không giới hạn số lượt (học sinh ôn tập tuỳ thích); >0 = giới hạn số lượt tối đa
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptionId?: string;
  textResponse?: string;
  dragDropMapping?: Record<string, string>; // slotId -> itemText
  isCorrect?: boolean;
  scoreAwarded?: number;
}

export interface Submission {
  id: string;
  lessonId: string;
  lessonTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  grade: GradeLevel;
  attemptNumber: number; // 1 to 10
  score: number; // Điểm số (thang 10)
  correctCount: number;
  totalQuestions: number;
  submittedAt: string; // ISO string
  timeSpentSeconds: number;
  answers: StudentAnswer[];
}
