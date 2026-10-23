/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HARDCODED_TEACHER,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
} from '../data/seedData';
import {
  GradeLevel,
  Lesson,
  Question,
  StudentAnswer,
  Submission,
  User,
} from '../types';
import {
  firestoreSyncUser,
  firestoreDeleteUser,
  firestoreSyncLesson,
  firestoreDeleteLesson,
  firestoreSyncQuestion,
  firestoreSyncQuestionsBatch,
  firestoreDeleteQuestion,
  firestoreSyncSubmission,
  fetchAllDataFromFirestore,
  uploadAllLocalDataToFirestore,
  isFirebaseConfigured,
  startRealtimeCloudSync,
  stopRealtimeCloudSync,
} from './firebase';

export const MAX_ATTEMPTS = 10;

const STORAGE_KEYS = {
  USERS: 'thcs_review_users',
  CURRENT_USER: 'thcs_review_current_user',
  LESSONS: 'thcs_review_lessons',
  QUESTIONS: 'thcs_review_questions',
  SUBMISSIONS: 'thcs_review_submissions',
  GUEST_STUDENT: 'thcs_review_guest_student',
  INITIALIZED: 'thcs_review_initialized_v1',
};

// Khởi tạo dữ liệu mẫu nếu chưa có trong LocalStorage
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    const allUsers = [HARDCODED_TEACHER, ...INITIAL_STUDENTS];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(INITIAL_LESSONS));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    // Mặc định đăng nhập giáo viên để người dùng trải nghiệm ngay dashboard
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(HARDCODED_TEACHER));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } else {
    // Đảm bảo thông tin giáo viên admin luôn đồng bộ tên mới nhất "Lê Quang Khánh"
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        const users: User[] = JSON.parse(rawUsers);
        const teacherIndex = users.findIndex((u) => u.username === HARDCODED_TEACHER.username);
        if (teacherIndex !== -1 && users[teacherIndex].fullName !== HARDCODED_TEACHER.fullName) {
          users[teacherIndex].fullName = HARDCODED_TEACHER.fullName;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      }
      const rawCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (rawCurrent) {
        const current: User = JSON.parse(rawCurrent);
        if (current.username === HARDCODED_TEACHER.username && current.fullName !== HARDCODED_TEACHER.fullName) {
          current.fullName = HARDCODED_TEACHER.fullName;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
        }
      }
    } catch (e) {
      console.warn('Sync teacher profile error:', e);
    }

    // Đảm bảo môn học áp dụng luôn là Tin học và chuẩn hóa triệt để
    try {
      const rawLessons = localStorage.getItem(STORAGE_KEYS.LESSONS);
      if (rawLessons) {
        let lessons: Lesson[] = JSON.parse(rawLessons);
        let needsUpdate = false;
        const hasLegacyNonTinHoc = lessons.some(
          (l) =>
            l.title.includes('hữu tỉ') ||
            l.title.includes('Căn bậc hai') ||
            l.title.includes('Phản ứng hóa học') ||
            !l.subject.toLowerCase().includes('tin học')
        );

        if (hasLegacyNonTinHoc) {
          localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(INITIAL_LESSONS));
          localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
          localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
        } else {
          // Chuẩn hóa tên môn học thành 'Tin học' cho toàn bộ bài học
          lessons = lessons.map((l) => {
            if (l.subject !== 'Tin học') {
              needsUpdate = true;
              return { ...l, subject: 'Tin học' };
            }
            return l;
          });
          if (needsUpdate) {
            localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
          }
        }
      }

      const rawSubs = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (rawSubs) {
        let subs: Submission[] = JSON.parse(rawSubs);
        let subsNeedUpdate = false;
        subs = subs.map((s) => {
          if (s.subject !== 'Tin học') {
            subsNeedUpdate = true;
            return { ...s, subject: 'Tin học' };
          }
          return s;
        });
        if (subsNeedUpdate) {
          localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
        }
      }
    } catch (e) {
      console.warn('Sync lessons subject error:', e);
    }
  }

  // Khởi động đồng bộ thời gian thực đa thiết bị khi Firebase được cấu hình
  if (isFirebaseConfigured()) {
    initRealtimeSync();
    setTimeout(() => {
      syncFromCloudFirestore().catch((err) => console.warn('Initial cloud sync check:', err));
    }, 400);
  }
}

// Khôi phục về dữ liệu mẫu ban đầu
export function resetToSeedData(): void {
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.LESSONS);
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  initializeStorage();
}

// ================= FIRESTORE CLOUD SYNC HELPERS =================

/**
 * Khởi tạo listener lắng nghe thay đổi thời gian thực từ Cloud Firestore
 * Giúp mọi máy tính, điện thoại, trình duyệt khác nhau đều cập nhật dữ liệu mới nhất tức thì!
 */
export function initRealtimeSync(): void {
  startRealtimeCloudSync({
    onUsersUpdate: (users) => {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thcs_data_synced', { detail: { type: 'users' } }));
      }
    },
    onLessonsUpdate: (lessons) => {
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thcs_data_synced', { detail: { type: 'lessons' } }));
      }
    },
    onQuestionsUpdate: (questions) => {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thcs_data_synced', { detail: { type: 'questions' } }));
      }
    },
    onSubmissionsUpdate: (submissions) => {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thcs_data_synced', { detail: { type: 'submissions' } }));
      }
    },
  });
}

/**
 * Tải toàn bộ dữ liệu mới nhất từ Firestore và cập nhật vào bộ nhớ đệm LocalStorage
 */
export async function syncFromCloudFirestore(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchAllDataFromFirestore();
    if (!res.success || !res.data) {
      return { success: false, message: res.message };
    }

    const { users, lessons, questions, submissions } = res.data;

    // Nếu database trên Cloud còn hoàn toàn trống (mới tạo), tự động đưa dữ liệu mẫu lên
    if (lessons.length === 0 && questions.length === 0) {
      console.log('Cloud database is empty, auto-populating with initial seed data...');
      await syncToCloudFirestore();
      return { success: true, message: 'Đã tự động khởi tạo dữ liệu môn Tin học lên Cloud Firestore!' };
    }

    let updatedSomething = false;
    if (users && users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      updatedSomething = true;
    }
    if (lessons && lessons.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
      updatedSomething = true;
    }
    if (questions && questions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      updatedSomething = true;
    }
    if (submissions && submissions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
      updatedSomething = true;
    }

    if (updatedSomething && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_data_synced'));
    }

    return {
      success: true,
      message: `Đã cập nhật dữ liệu từ Cloud Firestore (${lessons.length} bài học, ${questions.length} câu hỏi, ${users.length} tài khoản, ${submissions.length} bài thi)!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi đồng bộ từ Cloud: ${error?.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Đẩy toàn bộ dữ liệu hiện tại lên Cloud Firestore (khởi tạo cloud database ban đầu)
 */
export async function syncToCloudFirestore(): Promise<{
  success: boolean;
  message: string;
  stats?: { users: number; lessons: number; questions: number; submissions: number };
}> {
  const users = getAllUsers();
  const lessons = getLessons();
  const questions = getQuestions();
  const submissions = getSubmissions();

  return await uploadAllLocalDataToFirestore({
    users,
    lessons,
    questions,
    submissions,
  });
}

/**
 * Xuất toàn bộ dữ liệu ra chuỗi JSON để sao lưu / chuyển giao giữa các máy tính
 */
export function exportAllDataAsJsonString(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    appName: 'Học Tốt THCS - Tin học 6789',
    author: 'Lê Quang Khánh',
    users: getAllUsers(),
    lessons: getLessons(),
    questions: getQuestions(),
    submissions: getSubmissions(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Nhập dữ liệu từ chuỗi JSON và đồng bộ ngay lên Cloud (nếu có kết nối)
 */
export async function importDataFromJsonString(jsonStr: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.lessons || !data.questions) {
      return { success: false, message: 'Tệp JSON không đúng định dạng dữ liệu của ứng dụng!' };
    }

    if (Array.isArray(data.users) && data.users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    }
    if (Array.isArray(data.lessons) && data.lessons.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(data.lessons));
    }
    if (Array.isArray(data.questions) && data.questions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(data.questions));
    }
    if (Array.isArray(data.submissions)) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(data.submissions));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_data_synced'));
    }

    // Nếu đang kết nối Firebase, đồng bộ cả lên Cloud
    if (isFirebaseConfigured()) {
      await syncToCloudFirestore();
    }

    return {
      success: true,
      message: `Đã nhập thành công ${data.lessons.length} bài học, ${data.questions.length} câu hỏi và ${data.users?.length || 0} tài khoản!`,
    };
  } catch (e: any) {
    return { success: false, message: `Lỗi đọc tệp dữ liệu: ${e?.message || 'Định dạng tệp không hợp lệ'}` };
  }
}

// ================= USER & AUTH =================

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export interface GuestStudentInfo {
  fullName: string;
  className: string;
  grade: GradeLevel;
}

// Lấy thông tin phiên học sinh
export function getGuestStudentSession(): GuestStudentInfo | null {
  const data = localStorage.getItem(STORAGE_KEYS.GUEST_STUDENT);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Lưu thông tin học sinh khi điền form trước khi làm bài
export function saveGuestStudentSession(info: GuestStudentInfo): User {
  const cleanName = info.fullName.trim();
  const cleanClass = info.className.trim().toUpperCase();
  const sessionInfo: GuestStudentInfo = {
    fullName: cleanName,
    className: cleanClass,
    grade: info.grade,
  };
  localStorage.setItem(STORAGE_KEYS.GUEST_STUDENT, JSON.stringify(sessionInfo));

  // Tạo đối tượng User học sinh hoàn chỉnh
  const cleanId = `hs_${encodeURIComponent(cleanName.toLowerCase().replace(/\s+/g, '_'))}_${encodeURIComponent(cleanClass.toLowerCase())}`;
  const studentUser: User = {
    id: cleanId,
    username: cleanId,
    fullName: cleanName,
    role: 'student',
    grade: info.grade,
    className: cleanClass,
    createdAt: new Date().toISOString(),
  };

  return studentUser;
}

export function clearGuestStudentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.GUEST_STUDENT);
}

export function getAllUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) return [HARDCODED_TEACHER];
  try {
    return JSON.parse(data);
  } catch {
    return [HARDCODED_TEACHER];
  }
}

export function registerStudent(userData: {
  fullName: string;
  grade: GradeLevel;
  className: string;
  username: string;
  password?: string;
}): { success: boolean; message: string; user?: User } {
  const users = getAllUsers();
  const cleanUsername = userData.username.trim().toLowerCase();
  const cleanFullName = userData.fullName.trim();
  const cleanClassName = userData.className.trim().toUpperCase();
  const password = userData.password?.trim();

  // Kiểm tra bắt buộc nhập đầy đủ tài khoản, mật khẩu, họ tên và thông tin lớp
  if (!cleanUsername) {
    return { success: false, message: 'Vui lòng nhập Tên tài khoản / Tên đăng nhập!' };
  }
  if (!password) {
    return { success: false, message: 'Vui lòng nhập Mật khẩu bảo vệ tài khoản!' };
  }
  if (!cleanFullName) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Họ và tên học sinh!' };
  }
  if (!cleanClassName) {
    return { success: false, message: 'Vui lòng nhập hoặc chọn thông tin Lớp học!' };
  }
  if (![6, 7, 8, 9].includes(userData.grade)) {
    return { success: false, message: 'Khối lớp không hợp lệ (hỗ trợ Khối 6, 7, 8, 9)!' };
  }

  // Kiểm tra tên đăng nhập trùng
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return {
      success: false,
      message: 'Tên tài khoản này đã tồn tại. Vui lòng chọn tên đăng nhập khác!',
    };
  }

  const newUser: User = {
    id: `student_${Date.now()}`,
    username: cleanUsername,
    password: password,
    fullName: cleanFullName,
    role: 'student',
    grade: userData.grade,
    className: cleanClassName,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  firestoreSyncUser(newUser);
  setCurrentUser(newUser);

  return { success: true, message: 'Đăng ký tài khoản thành công!', user: newUser };
}

// Cập nhật thông tin cá nhân học sinh khi có sai sót (họ tên, lớp học, khối lớp, mật khẩu)
export function updateStudentProfile(
  userId: string,
  data: {
    fullName: string;
    grade: GradeLevel;
    className: string;
    password?: string;
  }
): { success: boolean; message: string; user?: User } {
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, message: 'Không tìm thấy thông tin tài khoản học sinh!' };
  }

  const cleanFullName = data.fullName.trim();
  const cleanClassName = data.className.trim().toUpperCase();

  if (!cleanFullName) {
    return { success: false, message: 'Họ và tên không được để trống!' };
  }
  if (!cleanClassName) {
    return { success: false, message: 'Thông tin lớp học không được để trống!' };
  }
  if (![6, 7, 8, 9].includes(data.grade)) {
    return { success: false, message: 'Khối lớp không hợp lệ (hỗ trợ Khối 6, 7, 8, 9)!' };
  }

  // Cập nhật thông tin người dùng
  users[userIndex].fullName = cleanFullName;
  users[userIndex].grade = data.grade;
  users[userIndex].className = cleanClassName;
  if (data.password && data.password.trim()) {
    users[userIndex].password = data.password.trim();
  }

  const updatedUser = users[userIndex];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  firestoreSyncUser(updatedUser);

  // Đồng bộ với currentUser nếu đúng là tài khoản đang đăng nhập
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updatedUser);
  }

  // Đồng bộ lịch sử nộp bài cũ của học sinh để tên và lớp mới hiển thị đúng trong báo cáo của Giáo viên
  try {
    const rawSubs = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (rawSubs) {
      const subs: Submission[] = JSON.parse(rawSubs);
      let changed = false;
      const updatedSubs = subs.map((s) => {
        if (s.studentId === userId) {
          changed = true;
          return {
            ...s,
            studentName: cleanFullName,
            className: cleanClassName,
            grade: data.grade,
          };
        }
        return s;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updatedSubs));
      }
    }
  } catch (e) {
    console.warn('Sync student submissions error:', e);
  }

  return {
    success: true,
    message: 'Cập nhật thông tin cá nhân thành công!',
    user: updatedUser,
  };
}

export function loginUser(
  username: string,
  password?: string
): { success: boolean; message: string; user?: User } {
  const users = getAllUsers();
  const cleanUsername = username.trim().toLowerCase();

  // Kiểm tra tài khoản giáo viên mặc định theo đề bài: it.teach / Teach@26
  if (cleanUsername === HARDCODED_TEACHER.username.toLowerCase()) {
    if (password === HARDCODED_TEACHER.password) {
      setCurrentUser(HARDCODED_TEACHER);
      return {
        success: true,
        message: 'Đăng nhập Giáo viên thành công!',
        user: HARDCODED_TEACHER,
      };
    }
    return { success: false, message: 'Mật khẩu Giáo viên không chính xác!' };
  }

  // Kiểm tra danh sách học sinh
  const student = users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (!student) {
    return {
      success: false,
      message: 'Không tìm thấy tài khoản. Hãy kiểm tra lại hoặc Đăng ký mới!',
    };
  }

  // Kiểm tra mật khẩu học sinh (nếu có lưu)
  if (student.password && password && student.password !== password) {
    return { success: false, message: 'Mật khẩu không chính xác!' };
  }

  setCurrentUser(student);
  return { success: true, message: 'Đăng nhập thành công!', user: student };
}

// ================= QUẢN LÝ TÀI KHOẢN HỌC SINH (GIÁO VIÊN) =================

export function getStudents(grade?: GradeLevel): User[] {
  const users = getAllUsers();
  return users.filter(
    (u) =>
      u.role === 'student' &&
      (!grade || Number(u.grade) === Number(grade))
  );
}

// Cấp lại mật khẩu cho học sinh (dành cho Giáo viên khi học sinh quên mật khẩu)
export function resetStudentPassword(
  userId: string,
  newPassword: string = '123456'
): { success: boolean; message: string; user?: User } {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    return { success: false, message: 'Không tìm thấy học sinh cần cấp lại mật khẩu!' };
  }

  const cleanPass = newPassword.trim() || '123456';
  users[index].password = cleanPass;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  firestoreSyncUser(users[index]);

  // Nếu học sinh đang đăng nhập, đồng bộ mật khẩu mới
  const current = getCurrentUser();
  if (current && current.id === userId) {
    current.password = cleanPass;
    setCurrentUser(current);
  }

  return {
    success: true,
    message: `Đã cấp lại mật khẩu mới ("${cleanPass}") cho học sinh ${users[index].fullName}!`,
    user: users[index],
  };
}

// Thêm mới hoặc chỉnh sửa tài khoản học sinh bởi Giáo viên
export function saveStudentUser(
  studentData: Omit<User, 'id' | 'createdAt'> & { id?: string }
): { success: boolean; message: string; user?: User } {
  const users = getAllUsers();
  const cleanUsername = studentData.username.trim().toLowerCase();
  const cleanFullName = studentData.fullName.trim();
  const cleanClassName = (studentData.className || '').trim().toUpperCase();
  const password = studentData.password ? studentData.password.trim() : '123456';

  if (!cleanFullName) {
    return { success: false, message: 'Vui lòng nhập Họ và tên học sinh!' };
  }
  if (!cleanUsername) {
    return { success: false, message: 'Vui lòng nhập Tên tài khoản học sinh!' };
  }

  if (studentData.id) {
    // Sửa học sinh hiện có
    const index = users.findIndex((u) => u.id === studentData.id);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy học sinh để cập nhật!' };
    }

    // Kiểm tra trùng username với người khác
    const duplicate = users.find(
      (u) => u.id !== studentData.id && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return { success: false, message: `Tên tài khoản "${cleanUsername}" đã được người khác sử dụng!` };
    }

    users[index] = {
      ...users[index],
      fullName: cleanFullName,
      username: cleanUsername,
      grade: studentData.grade || users[index].grade,
      className: cleanClassName || users[index].className,
      password: password,
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    firestoreSyncUser(users[index]);
    return { success: true, message: 'Cập nhật tài khoản học sinh thành công!', user: users[index] };
  } else {
    // Thêm mới học sinh
    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: `Tên tài khoản "${cleanUsername}" đã tồn tại!` };
    }

    const newUser: User = {
      id: `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      password: password,
      fullName: cleanFullName,
      role: 'student',
      grade: studentData.grade || 8,
      className: cleanClassName || '8A1',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    firestoreSyncUser(newUser);
    return { success: true, message: 'Thêm tài khoản học sinh thành công!', user: newUser };
  }
}

// Xóa tài khoản học sinh
export function deleteStudentUser(userId: string): { success: boolean; message: string } {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) {
    return { success: false, message: 'Không tìm thấy học sinh cần xóa!' };
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  firestoreDeleteUser(userId);
  return { success: true, message: 'Đã xóa tài khoản học sinh thành công!' };
}

// Nhập hàng loạt học sinh từ file Excel với mật khẩu chung đồng loạt
export function batchImportStudents(params: {
  students: Array<{
    fullName: string;
    className: string;
    username: string;
    grade?: GradeLevel;
  }>;
  defaultPassword?: string;
  targetGrade?: GradeLevel;
}): {
  success: boolean;
  addedCount: number;
  updatedCount: number;
  message: string;
} {
  const { students, defaultPassword = '123', targetGrade = 8 } = params;
  const users = getAllUsers();
  let addedCount = 0;
  let updatedCount = 0;

  const now = new Date().toISOString();

  students.forEach((item, idx) => {
    const cleanUsername = item.username.trim().toLowerCase();
    const cleanFullName = item.fullName.trim();
    const cleanClassName = item.className.trim().toUpperCase();
    const effectiveGrade = item.grade || targetGrade;

    if (!cleanUsername || !cleanFullName) return;

    const existingIndex = users.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (existingIndex !== -1) {
      // Đã có tài khoản: Cập nhật lại thông tin & đặt lại mật khẩu chung
      users[existingIndex].fullName = cleanFullName;
      users[existingIndex].className = cleanClassName;
      users[existingIndex].grade = effectiveGrade;
      users[existingIndex].password = defaultPassword;
      updatedCount++;
      firestoreSyncUser(users[existingIndex]);
    } else {
      // Thêm mới
      const newU: User = {
        id: `student_${Date.now()}_${idx}`,
        username: cleanUsername,
        password: defaultPassword,
        fullName: cleanFullName,
        role: 'student',
        grade: effectiveGrade,
        className: cleanClassName,
        createdAt: now,
      };
      users.push(newU);
      addedCount++;
      firestoreSyncUser(newU);
    }
  });

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  return {
    success: true,
    addedCount,
    updatedCount,
    message: `Đã nhập thành công ${addedCount} học sinh mới và cập nhật ${updatedCount} học sinh với mật khẩu chung "${defaultPassword}".`,
  };
}

// Đặt mật khẩu chung đồng loạt cho danh sách học sinh theo danh sách ID hoặc theo Khối / Lớp
export function setBatchStudentPassword(
  studentIds: string[],
  newPassword: string
): { success: boolean; updatedCount: number; message: string } {
  const users = getAllUsers();
  let updatedCount = 0;
  const cleanPass = newPassword.trim() || '123';

  users.forEach((u) => {
    if (u.role === 'student' && studentIds.includes(u.id)) {
      u.password = cleanPass;
      updatedCount++;
      firestoreSyncUser(u);
    }
  });

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  return {
    success: true,
    updatedCount,
    message: `Đã đặt mật khẩu chung "${cleanPass}" thành công cho ${updatedCount} học sinh!`,
  };
}

// ================= LESSONS (BÀI HỌC) =================

export function getLessons(): Lesson[] {
  const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getLessonsByGrade(grade: GradeLevel): Lesson[] {
  const lessons = getLessons();
  return lessons.filter((l) => Number(l.grade) === Number(grade));
}

export function getLessonById(id: string): Lesson | undefined {
  return getLessons().find((l) => l.id === id);
}

export function saveLesson(lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Lesson {
  const lessons = getLessons();
  const now = new Date().toISOString();
  // Chuẩn hóa môn học áp dụng là Tin học
  const subjectName = 'Tin học';

  if (lesson.id) {
    // Cập nhật
    const index = lessons.findIndex((l) => l.id === lesson.id);
    if (index !== -1) {
      lessons[index] = {
        ...lessons[index],
        ...lesson,
        subject: subjectName,
        updatedAt: now,
      };
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
      firestoreSyncLesson(lessons[index]);
      return lessons[index];
    }
  }

  // Thêm mới
  const newLesson: Lesson = {
    ...lesson,
    subject: subjectName,
    id: `lesson_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  lessons.push(newLesson);
  localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
  firestoreSyncLesson(newLesson);
  return newLesson;
}

export function deleteLesson(id: string): void {
  const lessons = getLessons().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
  firestoreDeleteLesson(id);

  // Đồng thời xoá câu hỏi của bài học
  const questions = getQuestions().filter((q) => q.lessonId !== id);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));

  // Đồng thời xoá lịch sử làm bài của bài học
  const submissions = getSubmissions().filter((s) => s.lessonId !== id);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
}

// ================= QUESTIONS (CÂU HỎI) =================

export function getQuestions(): Question[] {
  const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getQuestionsByLesson(lessonId: string): Question[] {
  return getQuestions().filter((q) => q.lessonId === lessonId);
}

export function saveQuestion(question: Omit<Question, 'id'> & { id?: string }): Question {
  const questions = getQuestions();
  if (question.id) {
    const index = questions.findIndex((q) => q.id === question.id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...question };
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      firestoreSyncQuestion(questions[index]);
      return questions[index];
    }
  }

  const newQuestion: Question = {
    ...question,
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  questions.push(newQuestion);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  firestoreSyncQuestion(newQuestion);
  return newQuestion;
}

/**
 * Lưu hàng loạt câu hỏi cho một bài học (ví dụ: nhập từ file Word/PDF hoặc sinh tự động)
 */
export function saveQuestionsBatch(
  newQuestions: Array<Omit<Question, 'id'> & { id?: string }>
): Question[] {
  const existingQuestions = getQuestions();
  const createdQuestions: Question[] = [];

  newQuestions.forEach((q, idx) => {
    const newQ: Question = {
      ...q,
      id: q.id || `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    };
    createdQuestions.push(newQ);
    existingQuestions.push(newQ);
  });

  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(existingQuestions));
  firestoreSyncQuestionsBatch(createdQuestions);
  return createdQuestions;
}

/**
 * Xóa toàn bộ câu hỏi của một bài học
 */
export function clearQuestionsByLesson(lessonId: string): void {
  const remaining = getQuestions().filter((q) => q.lessonId !== lessonId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(remaining));
}

export function deleteQuestion(id: string): void {
  const questions = getQuestions().filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  firestoreDeleteQuestion(id);
}


// ================= SUBMISSIONS & ATTEMPTS (LỊCH SỬ ÔN TẬP) =================

export function getSubmissions(): Submission[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getSubmissionsByLesson(lessonId: string): Submission[] {
  return getSubmissions().filter((s) => s.lessonId === lessonId);
}

export function getStudentSubmissions(
  studentId: string,
  lessonId?: string,
  studentName?: string,
  studentClass?: string
): Submission[] {
  const cleanName = studentName?.trim().toLowerCase();
  const cleanClass = studentClass?.trim().toLowerCase();

  const list = getSubmissions().filter((s) => {
    if (s.studentId === studentId) return true;
    if (cleanName && cleanClass) {
      return (
        s.studentName.trim().toLowerCase() === cleanName &&
        s.studentClass.trim().toLowerCase() === cleanClass
      );
    }
    return false;
  });
  if (lessonId) {
    return list.filter((s) => s.lessonId === lessonId);
  }
  return list;
}

// Logic quan trọng: Đếm số lần học sinh đã làm bài học cụ thể
export function getStudentAttemptCount(
  studentId: string,
  lessonId: string,
  studentName?: string,
  studentClass?: string
): number {
  const studentSubs = getStudentSubmissions(studentId, lessonId, studentName, studentClass);
  return studentSubs.length;
}

// Kiểm tra xem học sinh có được phép làm bài không (theo cấu hình maxAttempts của bài học hoặc mặc định)
export function canStudentAttempt(
  studentId: string,
  lessonId: string,
  studentName?: string,
  studentClass?: string
): {
  allowed: boolean;
  count: number;
  maxAttempts: number;
  isUnlimited: boolean;
  remaining: number;
} {
  const count = getStudentAttemptCount(studentId, lessonId, studentName, studentClass);
  const lessons = getLessons();
  const lesson = lessons.find((l) => l.id === lessonId);

  // Cấu hình số lượt từ Giáo viên:
  // - 0: Không giới hạn số lượt ôn tập (học sinh làm thoải mái)
  // - > 0: Giới hạn đúng số lượt này (ví dụ: 1 lượt làm kiểm tra, 2 lượt, 3 lượt, 5 lượt...)
  // - undefined: Mặc định 10 lượt
  const maxAttempts =
    lesson?.maxAttempts !== undefined && lesson?.maxAttempts !== null
      ? Number(lesson.maxAttempts)
      : 10;

  const isUnlimited = maxAttempts === 0;
  const allowed = isUnlimited ? true : count < maxAttempts;
  const remaining = isUnlimited ? 999999 : Math.max(0, maxAttempts - count);

  return {
    allowed,
    count,
    maxAttempts,
    isUnlimited,
    remaining,
  };
}

// Hàm chuẩn hóa chuỗi để so sánh đáp án điền khuyết
export function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// Chấm điểm tự động cho bài nộp của học sinh
export function gradeSubmission(
  lesson: Lesson,
  questions: Question[],
  studentAnswers: StudentAnswer[]
): {
  score: number;
  correctCount: number;
  totalQuestions: number;
  gradedAnswers: StudentAnswer[];
} {
  let correctCount = 0;
  const gradedAnswers: StudentAnswer[] = [];

  const answersMap = new Map<string, StudentAnswer>();
  studentAnswers.forEach((ans) => answersMap.set(ans.questionId, ans));

  questions.forEach((q) => {
    const studentAns = answersMap.get(q.id) || {
      questionId: q.id,
      type: q.type,
    };

    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      // 1. Trắc nghiệm 4 lựa chọn
      isCorrect = Boolean(studentAns.selectedOptionId && studentAns.selectedOptionId === q.correctOptionId);
    } else if (q.type === 'fill_in_the_blank') {
      // 2. Điền khuyết / Trả lời ngắn
      const rawUserText = studentAns.textResponse || '';
      const normalizedUserText = normalizeAnswer(rawUserText);

      if (normalizedUserText && q.acceptableAnswers && q.acceptableAnswers.length > 0) {
        isCorrect = q.acceptableAnswers.some(
          (ans) => normalizeAnswer(ans) === normalizedUserText
        );
      }
    } else if (q.type === 'drag_and_drop') {
      // 3. Kéo thả: Kiểm tra xem tất cả các slot có đúng itemText quy ước không
      const pairs = q.dragDropPairs || [];
      const mapping = studentAns.dragDropMapping || {};

      if (pairs.length > 0) {
        let allPairsMatch = true;
        for (const pair of pairs) {
          const placedItem = mapping[pair.id];
          if (placedItem !== pair.itemText) {
            allPairsMatch = false;
            break;
          }
        }
        isCorrect = allPairsMatch;
      }
    } else if (q.type === 'essay') {
      // 4. Tự luận: Tự động ghi nhận bài làm đã hoàn thành (nếu có nội dung >= 5 ký tự)
      isCorrect = Boolean(studentAns.textResponse && studentAns.textResponse.trim().length >= 5);
    }

    if (isCorrect) {
      correctCount += 1;
    }

    gradedAnswers.push({
      ...studentAns,
      isCorrect,
      scoreAwarded: isCorrect ? q.points : 0,
    });
  });

  // Tính điểm theo thang điểm 10
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 10).toFixed(1)) : 0;

  return {
    score,
    correctCount,
    totalQuestions,
    gradedAnswers,
  };
}

// Lưu bài nộp mới vào LocalStorage
export function recordSubmission(params: {
  lesson: Lesson;
  student: User;
  questions: Question[];
  studentAnswers: StudentAnswer[];
  timeSpentSeconds: number;
}): { success: boolean; submission?: Submission; message: string } {
  const { lesson, student, questions, studentAnswers, timeSpentSeconds } = params;

  // Kiểm tra giới hạn số lượt làm bài do giáo viên cấu hình
  const attemptCheck = canStudentAttempt(student.id, lesson.id, student.fullName, student.className);
  if (!attemptCheck.allowed) {
    return {
      success: false,
      message: `Bạn đã tham gia ôn tập bài học này ${attemptCheck.count}/${attemptCheck.maxAttempts} lượt (đã đạt giới hạn tối đa do Giáo viên quy định)!`,
    };
  }

  const { score, correctCount, totalQuestions, gradedAnswers } = gradeSubmission(
    lesson,
    questions,
    studentAnswers
  );

  const newSubmission: Submission = {
    id: `sub_${Date.now()}`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    subject: lesson.subject,
    studentId: student.id,
    studentName: student.fullName,
    studentClass: student.className || 'Chưa rõ',
    grade: lesson.grade,
    attemptNumber: attemptCheck.count + 1, // Lần thi thứ count + 1
    score,
    correctCount,
    totalQuestions,
    submittedAt: new Date().toISOString(),
    timeSpentSeconds,
    answers: gradedAnswers,
  };

  const submissions = getSubmissions();
  submissions.unshift(newSubmission); // Thêm vào đầu để mới nhất lên trước
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  firestoreSyncSubmission(newSubmission);

  return {
    success: true,
    submission: newSubmission,
    message: 'Nộp bài thành công!',
  };
}
