/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, Lesson, Question, Submission, User } from '../../types';
import {
  clearQuestionsByLesson,
  deleteLesson,
  deleteQuestion,
  getLessonsByGrade,
  getQuestionsByLesson,
  getStudents,
  getSubmissionsByLesson,
  saveLesson,
  saveQuestion,
  saveQuestionsBatch,
} from '../../services/storageService';
import { exportSubmissionsToExcel } from '../../services/excelExport';
import { LessonCreationQuestionOption, LessonEditorModal } from './LessonEditorModal';
import { QuestionEditorModal } from './QuestionEditorModal';
import { LessonReportsModal } from './LessonReportsModal';
import { StudentInteractionTracker } from './StudentInteractionTracker';
import { StudentAccountManagement } from './StudentAccountManagement';
import { ImportWordPdfModal } from './ImportWordPdfModal';
import { BatchQuestionsGeneratorModal } from './BatchQuestionsGeneratorModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  BarChart3,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  ChevronRight,
  Clock,
  ShieldCheck,
  Users,
  Upload,
  FileUp,
  RotateCcw,
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: User;
  onRefreshData?: () => void;
  onOpenFirebaseModal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onOpenFirebaseModal,
}) => {
  // Sidebar chọn khối lớp (Khối 6, Khối 7, Khối 8, Khối 9) theo đề bài
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(8);

  // Bài học đang được chọn để quản lý câu hỏi & xem báo cáo
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Modals
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Tab chính: Quản lý bài học & câu hỏi / Quản lý tài khoản học sinh / Theo dõi học sinh tương tác
  const [activeTab, setActiveTab] = useState<'lessons' | 'accounts' | 'students'>('lessons');

  // Chế độ xem ở danh mục khối lớp: Quản lý Bài học & Câu hỏi HOẶC Quản lý Học sinh của khối lớp đó
  const [gradeSectionView, setGradeSectionView] = useState<'lessons' | 'students'>('lessons');

  // Quản lý hộp thoại xác nhận xóa bài học / xóa câu hỏi (không dùng window.confirm để tránh bị chặn trong iframe preview)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'lesson' | 'question' | 'clear_all_questions';
    lesson?: Lesson;
    question?: Question;
    lessonId?: string;
    lessonTitle?: string;
  }>({ isOpen: false, type: 'lesson' });

  // Thông báo Toast thành công
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Trigger state update
  const [version, setVersion] = useState(0);
  const triggerUpdate = () => setVersion((v) => v + 1);

  // Tự động làm mới khi dữ liệu Cloud Firestore được đồng bộ
  useEffect(() => {
    const handleDataSynced = () => triggerUpdate();
    window.addEventListener('thcs_data_synced', handleDataSynced);
    return () => {
      window.removeEventListener('thcs_data_synced', handleDataSynced);
    };
  }, []);

  // Lấy dữ liệu bài học theo khối lớp đang chọn
  const lessons = getLessonsByGrade(selectedGrade);

  // Lấy toàn bộ danh sách học sinh để đếm và quản lý theo khối
  const allStudents = React.useMemo(() => getStudents(), [version]);
  const gradeStudentCount = allStudents.filter(
    (s) => Number(s.grade) === Number(selectedGrade)
  ).length;

  // Đảm bảo có bài học được chọn
  const activeLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0] || null;

  // Lấy danh sách câu hỏi của bài học đang chọn
  const questions = activeLesson ? getQuestionsByLesson(activeLesson.id) : [];

  // Lấy bài nộp của học sinh đối với bài học này
  const submissions = activeLesson ? getSubmissionsByLesson(activeLesson.id) : [];

  // Hàm khởi tạo câu hỏi mẫu phù hợp với môn Tin học theo từng khối lớp
  const createSampleQuestionsForLesson = (lessonId: string, grade: GradeLevel, count = 5) => {
    const gradeTopics: Record<GradeLevel, string[]> = {
      6: [
        'Thông tin và thu nhận thông tin trong đời sống',
        'Lưu trữ dữ liệu trong máy tính (Bit, Byte, KB, MB, GB)',
        'Mạng máy tính và các thành phần của mạng',
        'Tìm kiếm và an toàn thông tin trên Internet',
        'Soạn thảo văn bản và định dạng trang in',
      ],
      7: [
        'Bảng tính điện tử và các kiểu dữ liệu Excel',
        'Các hàm tính toán SUM, AVERAGE, COUNT, MAX, MIN',
        'Định dạng và trình bày bảng dữ liệu chuyên nghiệp',
        'Sắp xếp và lọc dữ liệu trong bảng tính',
        'Tạo biểu đồ trực quan hóa dữ liệu',
      ],
      8: [
        'Lịch sử phát triển của máy tính qua các thời kỳ',
        'Thuật toán tuần tự, rẽ nhánh và lặp trong lập trình',
        'Ngôn ngữ lập trình trực quan Scratch / Python cơ bản',
        'Xử lý thông tin và đạo đức trong môi trường số',
        'Ứng dụng phần mềm chỉnh sửa đồ họa đa phương tiện',
      ],
      9: [
        'Cơ sở dữ liệu và hệ quản trị cơ sở dữ liệu quan hệ',
        'Mạng xã hội và an toàn thông tin trên không gian mạng',
        'Thuật toán tìm kiếm nhị phân và thuật toán sắp xếp',
        'Định hướng nghề nghiệp trong lĩnh vực Tin học',
        'Tác động của trí tuệ nhân tạo (AI) và chuyển đổi số',
      ],
    };

    const topics = gradeTopics[grade] || gradeTopics[6];
    const newQuestions: Array<Omit<Question, 'id'> & { id?: string }> = [];
    const types: Question['type'][] = ['multiple_choice', 'fill_in_the_blank', 'drag_and_drop', 'essay'];

    for (let i = 0; i < count; i++) {
      const qType = types[i % types.length];
      const topic = topics[i % topics.length];

      if (qType === 'multiple_choice') {
        newQuestions.push({
          lessonId,
          type: 'multiple_choice',
          prompt: `Câu ${i + 1}: [Khối ${grade}] Về chủ đề "${topic}", phát biểu nào sau đây là ĐÚNG nhất?`,
          points: 2.0,
          options: [
            { id: 'opt_a', text: 'Đây là phương án chuẩn xác theo chương trình Tin học.' },
            { id: 'opt_b', text: 'Phương án này chỉ đúng trong các hệ thống máy tính thời kỳ đầu.' },
            { id: 'opt_c', text: 'Phương án này nêu sai thuật ngữ cơ bản của bài học.' },
            { id: 'opt_d', text: 'Phương án này không thể thực hiện được trong môi trường số.' },
          ],
          correctOptionId: 'opt_a',
          explanation: `Khái niệm về "${topic}" đã được nêu rõ trong bài học Tin học ${grade}.`,
        });
      } else if (qType === 'fill_in_the_blank') {
        newQuestions.push({
          lessonId,
          type: 'fill_in_the_blank',
          prompt: `Câu ${i + 1}: [Khối ${grade}] Điền thuật ngữ còn thiếu vào chỗ trống về "${topic}":`,
          points: 2.0,
          acceptableAnswers: ['thông tin', 'dữ liệu', 'máy tính', 'thuật toán'],
          explanation: 'Học sinh điền từ khóa trọng tâm của bài học.',
        });
      } else if (qType === 'drag_and_drop') {
        newQuestions.push({
          lessonId,
          type: 'drag_and_drop',
          prompt: `Câu ${i + 1}: [Khối ${grade}] Ghép các thành phần của "${topic}" vào vị trí đích tương ứng:`,
          points: 3.0,
          dragDropPairs: [
            { id: `dd_${Date.now()}_${i}_1`, itemText: 'Thành phần A', slotLabel: 'Vị trí đích 1' },
            { id: `dd_${Date.now()}_${i}_2`, itemText: 'Thành phần B', slotLabel: 'Vị trí đích 2' },
            { id: `dd_${Date.now()}_${i}_3`, itemText: 'Thành phần C', slotLabel: 'Vị trí đích 3' },
          ],
          explanation: 'Ghép nối chính xác các cặp tương ứng để nhận điểm tối đa.',
        });
      } else {
        newQuestions.push({
          lessonId,
          type: 'essay',
          prompt: `Câu ${i + 1}: [Khối ${grade}] Em hãy viết đoạn văn ngắn (3 - 5 câu) phân tích tầm quan trọng của "${topic}" trong đời sống?`,
          points: 3.0,
          essayGuide: 'Học sinh nêu được định nghĩa, 2 ví dụ thực tế và rút ra kết luận ngắn gọn, ngôn từ mạch lạc.',
          explanation: 'Giáo viên đánh giá theo tiêu chí lập luận logic và ví dụ minh họa chính xác.',
        });
      }
    }

    saveQuestionsBatch(newQuestions);
  };

  // Thêm / Sửa bài học
  const handleSaveLesson = (
    lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    questionOption?: LessonCreationQuestionOption
  ) => {
    const isNew = !lessonData.id;
    const saved = saveLesson(lessonData);
    setSelectedLessonId(saved.id);
    triggerUpdate();

    if (isNew && questionOption) {
      if (questionOption.action === 'generate_sample') {
        createSampleQuestionsForLesson(saved.id, saved.grade, questionOption.sampleCount);
        triggerUpdate();
      } else if (questionOption.action === 'open_import_word_pdf') {
        setTimeout(() => {
          setIsImportModalOpen(true);
        }, 120);
      }
    }
  };

  // Xoá bài học: Mở modal xác nhận an toàn (hoạt động tốt cả trên web thật và iframe preview)
  const promptDeleteLesson = (lesson: Lesson) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'lesson',
      lesson,
    });
  };

  // Nhanh chóng Toggle cài đặt "Cho phép xem kết quả" ngay trên danh sách
  const handleToggleAllowReview = (lesson: Lesson) => {
    saveLesson({
      id: lesson.id,
      grade: lesson.grade,
      title: lesson.title,
      subject: lesson.subject,
      description: lesson.description,
      allowReviewResults: !lesson.allowReviewResults,
      timeLimitMinutes: lesson.timeLimitMinutes,
      maxAttempts: lesson.maxAttempts,
    });
    triggerUpdate();
  };

  // Thêm / Sửa câu hỏi
  const handleSaveQuestion = (questionData: Omit<Question, 'id'> & { id?: string }) => {
    saveQuestion(questionData);
    triggerUpdate();
    showToast(questionData.id ? 'Đã cập nhật câu hỏi thành công!' : 'Đã thêm câu hỏi mới thành công!');
  };

  // Xoá câu hỏi: Mở modal xác nhận an toàn
  const promptDeleteQuestion = (question: Question) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'question',
      question,
    });
  };

  // Làm trống toàn bộ câu hỏi trong bài học
  const promptClearAllQuestions = (lessonId: string, lessonTitle: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'clear_all_questions',
      lessonId,
      lessonTitle,
    });
  };

  // Thực thi hành động xóa sau khi người dùng bấm xác nhận trong modal
  const handleExecuteDelete = () => {
    if (deleteConfirm.type === 'lesson' && deleteConfirm.lesson) {
      const lessonTitle = deleteConfirm.lesson.title;
      deleteLesson(deleteConfirm.lesson.id);
      if (selectedLessonId === deleteConfirm.lesson.id) {
        setSelectedLessonId(null);
      }
      triggerUpdate();
      showToast(`Đã xóa thành công bài học "${lessonTitle}"!`);
    } else if (deleteConfirm.type === 'question' && deleteConfirm.question) {
      deleteQuestion(deleteConfirm.question.id);
      triggerUpdate();
      showToast('Đã xóa thành công câu hỏi!');
    } else if (deleteConfirm.type === 'clear_all_questions' && deleteConfirm.lessonId) {
      clearQuestionsByLesson(deleteConfirm.lessonId);
      triggerUpdate();
      showToast(`Đã xóa toàn bộ câu hỏi của bài "${deleteConfirm.lessonTitle || ''}"!`);
    }
  };

  // Xuất file Excel nhanh cho bài học hiện tại
  const handleQuickExport = (lesson: Lesson) => {
    const subs = getSubmissionsByLesson(lesson.id);
    exportSubmissionsToExcel(subs, `Bao_Cao_${lesson.title}`);
  };

  const gradeList: { grade: GradeLevel; title: string; subtitle: string }[] = [
    { grade: 6, title: 'Tin học 6', subtitle: 'Thông tin & Mạng máy tính' },
    { grade: 7, title: 'Tin học 7', subtitle: 'Phần cứng & Bảng tính điện tử' },
    { grade: 8, title: 'Tin học 8', subtitle: 'Thuật toán & Lập trình Scratch' },
    { grade: 9, title: 'Tin học 9', subtitle: 'Điện toán đám mây & An toàn số' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Banner Chào mừng Giáo viên */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-8 shadow-2xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        {/* Glow hiệu ứng nền */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 sm:space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Bảng Điều Khiển Giáo Viên</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              <span>Môn học: Tin học 6-9</span>
            </span>
            {onOpenFirebaseModal && (
              <button
                type="button"
                onClick={onOpenFirebaseModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 transition-colors cursor-pointer"
                title="Lưu trữ đám mây & Đồng bộ đa thiết bị Netlify"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Lưu trữ Cloud & Netlify</span>
              </button>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xs leading-snug">
            Mật mã học bá - Bí kíp học hay
            <span className="block text-indigo-200 text-base sm:text-xl lg:text-2xl font-bold mt-1 tracking-normal">
              Cẩm nang ôn tập kiến thức Tin học 6789
            </span>
            <span className="inline-block text-xs sm:text-sm font-semibold text-indigo-300 mt-1">
              By Lê Quang Khánh
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 z-10 flex-shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-[40px] ${
              activeTab === 'accounts'
                ? 'bg-amber-400 text-slate-900 shadow-amber-400/30 ring-2 ring-amber-300'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tài Khoản Học Sinh (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-[40px] ${
              activeTab === 'students'
                ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Lịch Sử & Tương Tác</span>
          </button>

          {activeTab === 'lessons' && (
            <button
              type="button"
              onClick={() => {
                setEditingLesson(null);
                setIsLessonModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bài Học Khối {selectedGrade}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh chuyển đổi 3 chế độ xem: Quản lý bài học | Quản lý tài khoản học sinh | Theo dõi tương tác */}
      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {/* Tab 1: Quản lý bài học & câu hỏi */}
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>1. Bài Học & Câu Hỏi</span>
          </button>

          {/* Tab 2: Quản lý danh sách & tài khoản học sinh */}
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>2. Tài Khoản Học Sinh (Excel)</span>
          </button>

          {/* Tab 3: Theo dõi học sinh tương tác & ôn tập */}
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span>3. Lịch Sử & Thống Kê</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 px-3 hidden lg:block whitespace-nowrap">
          Giáo viên: <strong>Lê Quang Khánh</strong> • Môn: <strong>Tin học</strong>
        </div>
      </div>

      {/* HIỂN THỊ NỘI DUNG THEO TAB ĐANG CHỌN */}
      {activeTab === 'accounts' ? (
        <StudentAccountManagement onRefresh={triggerUpdate} />
      ) : activeTab === 'students' ? (
        <StudentInteractionTracker onRefresh={triggerUpdate} />
      ) : (
        /* Layout 2 cột: Sidebar Danh mục khối lớp & Nội dung chính */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- CỘT TRÁI: SIDEBAR DANH MỤC KHỐI LỚP (Khối 6, 7, 8, 9) --- */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Danh mục Khối lớp (Tin học 6-9)</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
                {gradeList.map((g) => {
                  const isSelected = selectedGrade === g.grade;
                  const lessonCount = getLessonsByGrade(g.grade).length;
                  const studentCount = allStudents.filter(
                    (s) => Number(s.grade) === Number(g.grade)
                  ).length;

                  return (
                    <div
                      key={g.grade}
                      onClick={() => {
                        setSelectedGrade(g.grade);
                        setSelectedLessonId(null);
                      }}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 border-indigo-500'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-1">
                            <span>{g.title}</span>
                          </div>
                          <span
                            className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}
                          >
                            Khối {g.grade}
                          </span>
                        </div>

                        <div
                          className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-1 ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {g.subtitle}
                        </div>
                      </div>

                      {/* Phím tắt chọn nhanh Bài học hoặc Học sinh của khối lớp này */}
                      <div className="mt-2 pt-1.5 border-t border-slate-200/40 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGrade(g.grade);
                            setGradeSectionView('lessons');
                            setSelectedLessonId(null);
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[28px] ${
                            isSelected && gradeSectionView === 'lessons'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : isSelected
                              ? 'bg-white/15 text-white hover:bg-white/25'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                          }`}
                          title={`Xem bài học và ngân hàng câu hỏi Khối ${g.grade}`}
                        >
                          <BookOpen className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lessonCount} bài</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGrade(g.grade);
                            setGradeSectionView('students');
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[28px] ${
                            isSelected && gradeSectionView === 'students'
                              ? 'bg-amber-400 text-slate-900 shadow-xs'
                              : isSelected
                              ? 'bg-amber-400/25 text-amber-200 hover:bg-amber-400/40'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                          }`}
                          title={`Quản lý học sinh Khối ${g.grade}: cấp lại mật khẩu, sửa, thêm, xóa`}
                        >
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{studentCount} HS</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hướng dẫn nhanh cho Giáo viên */}
            <div className="hidden lg:block bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Nhiệm vụ Giáo viên theo Khối:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>Chọn <strong>Khối lớp</strong> (6, 7, 8, 9) cần thao tác.</li>
                <li><strong>Quản lý học sinh</strong>: Cấp lại mật khẩu, sửa thông tin, thêm hoặc xóa học sinh.</li>
                <li><strong>Soạn bài học & câu hỏi</strong>: Bật/tắt xem kết quả, tạo câu hỏi 4 dạng.</li>
                <li><strong>Lịch sử & Thống kê</strong>: Xuất bảng điểm Excel (.xlsx).</li>
              </ol>
            </div>
          </aside>

          {/* --- CỘT PHẢI: QUẢN LÝ BÀI HỌC HOẶC HỌC SINH THEO KHỐI LỚP --- */}
          <main className="lg:col-span-9 space-y-4 sm:space-y-6">
            {/* Thanh chuyển đổi mục xem cho Khối {selectedGrade}: Bài học vs Học sinh */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setGradeSectionView('lessons')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                    gradeSectionView === 'lessons'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 sm:bg-transparent'
                  }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">1. Bài Học</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      gradeSectionView === 'lessons'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {lessons.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGradeSectionView('students')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                    gradeSectionView === 'students'
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 sm:bg-transparent'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">2. Học Sinh</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      gradeSectionView === 'students'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {gradeStudentCount}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 px-1 font-medium flex items-center justify-between sm:justify-end gap-1.5">
                <span className="text-[11px] sm:text-xs">Đang xem:</span>
                <strong className="text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-xs">
                  Tin học {selectedGrade}
                </strong>
              </div>
            </div>

            {/* Hiển thị nội dung theo chế độ xem được chọn của Khối {selectedGrade} */}
            {gradeSectionView === 'students' ? (
              <div className="space-y-4">
                <StudentAccountManagement
                  key={`grade-students-${selectedGrade}-${version}`}
                  initialGrade={selectedGrade}
                  lockGrade={true}
                  onRefresh={triggerUpdate}
                />
              </div>
            ) : (
              <>
                {/* Thanh chọn bài học trong khối */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <span>Danh sách Bài học Tin học {selectedGrade}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Chọn một bài học môn Tin học bên dưới để quản lý nội dung câu hỏi hoặc xem báo cáo điểm
                      </p>
                    </div>

              <button
                type="button"
                onClick={() => {
                  setEditingLesson(null);
                  setIsLessonModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bài mới</span>
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Chưa có bài học nào trong Khối {selectedGrade}.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLesson(null);
                    setIsLessonModalOpen(true);
                  }}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Tạo bài học đầu tiên ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lessons.map((lesson) => {
                  const isCurrent = activeLesson?.id === lesson.id;
                  const qCount = getQuestionsByLesson(lesson.id).length;
                  const subCount = getSubmissionsByLesson(lesson.id).length;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                              Môn {lesson.subject || 'Tin học'}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              Khối {lesson.grade}
                            </span>
                          </div>
                          {/* Toggle xem thống kê kết quả */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAllowReview(lesson);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              lesson.allowReviewResults
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Nhấp để bật/tắt xem kết quả sau khi làm bài"
                          >
                            {lesson.allowReviewResults ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-600" />
                                <span>Xem KQ: Bật</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-500" />
                                <span>Xem KQ: Tắt</span>
                              </>
                            )}
                          </button>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {lesson.description || 'Chưa có mô tả bài học.'}
                        </p>
                      </div>

                      {/* Footer bài học: số câu hỏi & nút thao tác */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-500 text-[11px]">
                          <span className="font-bold text-slate-700">{qCount} câu</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">
                            {lesson.timeLimitMinutes && lesson.timeLimitMinutes > 0 ? `${lesson.timeLimitMinutes}p` : 'Tự do'}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">
                            {lesson.maxAttempts && lesson.maxAttempts > 0 ? `${lesson.maxAttempts} lượt` : 'Vô hạn'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLesson(lesson);
                              setIsLessonModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa thông tin bài học"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteLesson(lesson);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa bài học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chi tiết nội dung của Bài học đang chọn (Câu hỏi + Báo cáo) */}
          {activeLesson ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
              {/* Header bài học chi tiết */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {activeLesson.subject || 'Tin học'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Khối {activeLesson.grade}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{activeLesson.timeLimitMinutes && activeLesson.timeLimitMinutes > 0 ? `${activeLesson.timeLimitMinutes} phút` : 'Tự do (Không giới hạn giờ)'}</span>
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{activeLesson.maxAttempts && activeLesson.maxAttempts > 0 ? `Tối đa ${activeLesson.maxAttempts} lượt` : 'Không giới hạn lượt'}</span>
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">{activeLesson.title}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Nút xem thống kê & lịch sử ôn tập (kèm xuất Excel) */}
                  <button
                    type="button"
                    onClick={() => setIsReportsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Lịch sử ôn tập ({submissions.length})</span>
                  </button>

                  {/* Nút Xuất Excel trực tiếp */}
                  <button
                    type="button"
                    onClick={() => handleQuickExport(activeLesson)}
                    disabled={submissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Xuất file Excel thống kê bài học này"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Xuất Excel</span>
                  </button>

                  {/* Nút Sửa cấu hình bài học */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLesson(activeLesson);
                      setIsLessonModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Chỉnh sửa tên bài, mô tả, cấu hình thời gian và số lượt làm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sửa bài</span>
                  </button>

                  {/* Nút Xóa bài học này */}
                  <button
                    type="button"
                    onClick={() => promptDeleteLesson(activeLesson)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Xóa vĩnh viễn bài học này và toàn bộ câu hỏi bên trong"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xóa bài này</span>
                  </button>
                </div>
              </div>

              {/* Danh sách câu hỏi */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Danh sách Câu hỏi ({questions.length})</span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full normal-case">
                        {activeLesson.subject || 'Tin học'} Khối {activeLesson.grade}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chủ động tạo câu hỏi với 4 dạng: Trắc nghiệm 4 lựa chọn, Trả lời ngắn, Kéo thả và Tự luận
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Tạo nhanh theo số lượng */}
                    <button
                      type="button"
                      onClick={() => setIsBatchModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Khởi tạo số lượng câu hỏi mong muốn"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tạo nhanh số lượng câu</span>
                    </button>

                    {/* Nút Nhập từ file Word / PDF */}
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Tải lên tệp Word (.docx) hoặc PDF (.pdf) hoặc dán đề thi"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nhập từ Word / PDF</span>
                    </button>

                    {/* Nút Làm trống / Xóa tất cả câu hỏi */}
                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => promptClearAllQuestions(activeLesson.id, activeLesson.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Xóa toàn bộ câu hỏi trong bài học này để tạo lại từ đầu"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Làm trống câu hỏi</span>
                      </button>
                    )}

                    {/* Nút Thêm câu hỏi thủ công */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(null);
                        setIsQuestionModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Câu Hỏi</span>
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-4">
                    <div className="max-w-md mx-auto">
                      <HelpCircle className="w-10 h-10 mx-auto text-indigo-400 stroke-1 mb-2" />
                      <h4 className="text-sm font-bold text-slate-800">
                        Bài học này chưa có câu hỏi nào
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Thầy/Cô có thể chủ động thêm câu hỏi bằng 3 cách thuận tiện bên dưới:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                      {/* Lựa chọn 1: Thêm thủ công */}
                      <div
                        onClick={() => {
                          setEditingQuestion(null);
                          setIsQuestionModalOpen(true);
                        }}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mb-2">
                            <Plus className="w-4 h-4" />
                          </div>
                          <h5 className="text-xs font-bold text-slate-900">
                            1. Thêm từng câu thủ công
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Chọn 1 trong 4 dạng: Trắc nghiệm A/B/C/D, Điền khuyết, Kéo thả hoặc Tự luận.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-indigo-600">
                          Bắt đầu thêm ➔
                        </span>
                      </div>

                      {/* Lựa chọn 2: Nhập từ file Word / PDF */}
                      <div
                        onClick={() => setIsImportModalOpen(true)}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-2">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <h5 className="text-xs font-bold text-slate-900">
                            2. Nhập từ Word / PDF
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Tải tệp .docx, .pdf hoặc dán đề thi, tự động phân tích và import hàng loạt.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-emerald-600">
                          Tải tệp lên ➔
                        </span>
                      </div>

                      {/* Lựa chọn 3: Tạo nhanh bộ câu hỏi */}
                      <div
                        onClick={() => setIsBatchModalOpen(true)}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mb-2">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h5 className="text-xs font-bold text-slate-900">
                            3. Tạo nhanh số lượng câu
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Chọn 4, 5, 8 hoặc 10 câu hỏi, tự động tạo khung 4 dạng theo Tin học {activeLesson.grade}.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-blue-600">
                          Khởi tạo nhanh ➔
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const typeBadge = {
                        multiple_choice: {
                          label: 'Trắc nghiệm 4 lựa chọn',
                          color: 'bg-blue-100 text-blue-800',
                        },
                        fill_in_the_blank: {
                          label: 'Trả lời ngắn (Điền khuyết)',
                          color: 'bg-amber-100 text-amber-800',
                        },
                        drag_and_drop: {
                          label: 'Kéo thả ô trống',
                          color: 'bg-purple-100 text-purple-800',
                        },
                        essay: {
                          label: 'Tự luận',
                          color: 'bg-rose-100 text-rose-800',
                        },
                      }[q.type];

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white shadow-xs transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeBadge.color}`}
                                  >
                                    {typeBadge.label}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {q.points || 1} điểm
                                  </span>
                                </div>
                                <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                                  {q.prompt}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setIsQuestionModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Sửa câu hỏi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => promptDeleteQuestion(q)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Xóa câu</span>
                              </button>
                            </div>
                          </div>

                          {/* Chi tiết câu trả lời tóm lược */}
                          <div className="pl-9 text-xs text-slate-600">
                            {q.type === 'multiple_choice' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options?.map((opt, i) => {
                                  const letters = ['A', 'B', 'C', 'D'];
                                  const isCorrect = q.correctOptionId === opt.id;
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`px-2 py-1 rounded-md text-[11px] ${
                                        isCorrect
                                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                                          : 'bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <strong>{letters[i]}.</strong> {opt.text}{' '}
                                      {isCorrect && '✓'}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'fill_in_the_blank' && (
                              <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 text-[11px] text-amber-900">
                                Đáp án chấp nhận:{' '}
                                <span className="font-mono font-bold">
                                  {q.acceptableAnswers?.join(' | ')}
                                </span>
                              </div>
                            )}

                            {q.type === 'drag_and_drop' && (
                              <div className="bg-purple-50/60 p-2 rounded-lg border border-purple-200/60 text-[11px] text-purple-900 space-y-1">
                                {q.dragDropPairs?.map((pair) => (
                                  <div key={pair.id}>
                                    • Thẻ <strong>"{pair.itemText}"</strong> ➔ Vị trí:{' '}
                                    <em>"{pair.slotLabel}"</em>
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.type === 'essay' && (
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 italic">
                                Gợi ý chấm GV: {q.essayGuide || '(Chưa có gợi ý)'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Hãy tạo hoặc chọn một bài học để bắt đầu quản lý câu hỏi.
            </div>
          )}
              </>
            )}
        </main>
      </div>
      )}

      {/* Modals */}
      <LessonEditorModal
        isOpen={isLessonModalOpen}
        grade={selectedGrade}
        initialLesson={editingLesson}
        onClose={() => setIsLessonModalOpen(false)}
        onSave={handleSaveLesson}
        onDelete={promptDeleteLesson}
      />

      {activeLesson && (
        <QuestionEditorModal
          isOpen={isQuestionModalOpen}
          lessonId={activeLesson.id}
          initialQuestion={editingQuestion}
          onClose={() => setIsQuestionModalOpen(false)}
          onSave={handleSaveQuestion}
          onDelete={promptDeleteQuestion}
        />
      )}

      {activeLesson && (
        <LessonReportsModal
          isOpen={isReportsModalOpen}
          lesson={activeLesson}
          submissions={submissions}
          questions={questions}
          onClose={() => setIsReportsModalOpen(false)}
        />
      )}

      {activeLesson && (
        <ImportWordPdfModal
          isOpen={isImportModalOpen}
          lesson={activeLesson}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={(count) => {
            triggerUpdate();
            showToast(`Đã nhập thành công ${count} câu hỏi vào bài học "${activeLesson.title}"!`);
          }}
        />
      )}

      {activeLesson && (
        <BatchQuestionsGeneratorModal
          isOpen={isBatchModalOpen}
          lesson={activeLesson}
          onClose={() => setIsBatchModalOpen(false)}
          onGeneratedSuccess={(count) => {
            triggerUpdate();
            showToast(`Đã tạo nhanh thành công ${count} câu hỏi cho bài học "${activeLesson.title}"!`);
          }}
        />
      )}

      {/* Modal xác nhận xóa bài học hoặc xóa câu hỏi (an toàn trên iframe preview) */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === 'lesson'
            ? 'Xác nhận xóa bài học'
            : deleteConfirm.type === 'clear_all_questions'
            ? 'Xác nhận làm trống toàn bộ câu hỏi'
            : 'Xác nhận xóa câu hỏi'
        }
        itemTitle={
          deleteConfirm.type === 'lesson'
            ? deleteConfirm.lesson?.title
            : deleteConfirm.type === 'clear_all_questions'
            ? deleteConfirm.lessonTitle
            : deleteConfirm.question?.prompt
        }
        message={
          deleteConfirm.type === 'lesson'
            ? 'Toàn bộ nội dung câu hỏi và dữ liệu lịch sử làm bài của học sinh thuộc bài học này sẽ bị xóa vĩnh viễn khỏi hệ thống.'
            : deleteConfirm.type === 'clear_all_questions'
            ? 'Toàn bộ danh sách câu hỏi trong bài học này sẽ bị xóa. Thầy/Cô có thể tạo lại bài mới hoặc nhập từ tệp Word/PDF bất kỳ lúc nào.'
            : 'Câu hỏi này sẽ bị xóa khỏi bài ôn tập hiện tại.'
        }
        confirmLabel={
          deleteConfirm.type === 'clear_all_questions'
            ? 'Xóa tất cả câu hỏi'
            : 'Xác nhận xóa'
        }
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast thông báo phản hồi thao tác */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700/80 backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
