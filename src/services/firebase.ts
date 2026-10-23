/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Lesson, Question, Submission, User } from '../types';
import { DEFAULT_FIREBASE_CONFIG, FirebaseProjectConfig } from '../config/firebaseConfig';

export type FirebaseCustomConfig = FirebaseProjectConfig;

const FIREBASE_STORAGE_KEY = 'thcs_review_firebase_config';

/**
 * Lấy cấu hình Firebase:
 * 1. Tùy chỉnh qua giao diện lưu trong LocalStorage (nếu có)
 * 2. Biến môi trường Netlify (VITE_FIREBASE_*)
 * 3. Cấu hình mặc định trong src/config/firebaseConfig.ts
 */
export function getFirebaseConfig(): {
  config: FirebaseCustomConfig | null;
  source: 'env' | 'custom' | 'file' | 'none';
} {
  // 1. Kiểm tra cấu hình tùy chỉnh người dùng nhập qua giao diện
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: FirebaseCustomConfig = JSON.parse(raw);
        if (parsed.apiKey && parsed.projectId) {
          return { config: parsed, source: 'custom' };
        }
      } catch (e) {
        console.warn('Invalid custom firebase config:', e);
      }
    }
  }

  // 2. Kiểm tra biến môi trường Netlify (VITE_FIREBASE_*)
  const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    const envConfig: FirebaseCustomConfig = {
      apiKey: envApiKey,
      authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
      messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
    };
    return { config: envConfig, source: 'env' };
  }

  // 3. Kiểm tra file cấu hình mặc định src/config/firebaseConfig.ts
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId) {
    return { config: DEFAULT_FIREBASE_CONFIG, source: 'file' };
  }

  return { config: null, source: 'none' };
}

/**
 * Kiểm tra xem Firebase đã được kết nối cấu hình chưa
 */
export function isFirebaseConfigured(): boolean {
  const { config } = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

let cachedDb: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  if (cachedDb) return cachedDb;

  const { config } = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) return null;

  try {
    const app: FirebaseApp =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
            projectId: config.projectId,
            storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
            messagingSenderId: config.messagingSenderId || '',
            appId: config.appId || '',
          });

    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (error) {
    console.error('Error initializing Firebase App/Firestore:', error);
    return null;
  }
}

export function saveFirebaseCustomConfig(config: FirebaseCustomConfig): void {
  localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
  cachedDb = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('thcs_firebase_config_changed'));
  }
}

export function removeFirebaseCustomConfig(): void {
  localStorage.removeItem(FIREBASE_STORAGE_KEY);
  cachedDb = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('thcs_firebase_config_changed'));
  }
}

export async function testFirebaseConnection(
  customConfig?: FirebaseCustomConfig
): Promise<{ success: boolean; message: string; projectId?: string }> {
  try {
    const config = customConfig || getFirebaseConfig().config;
    if (!config || !config.apiKey || !config.projectId) {
      return {
        success: false,
        message: 'Chưa có thông tin cấu hình Firebase (cần ít nhất apiKey và projectId).',
      };
    }

    const testAppName = `test_${Date.now()}`;
    const testApp = initializeApp(config, testAppName);
    const testDb = getFirestore(testApp);

    const pingRef = doc(testDb, '_system_check', 'ping');
    await setDoc(pingRef, {
      lastChecked: new Date().toISOString(),
      appName: 'Học Tốt THCS - Tin học 6789',
      status: 'active',
    });

    const snapshot = await getDoc(pingRef);
    if (snapshot.exists()) {
      return {
        success: true,
        message: `Kết nối thành công đến Cloud Firestore của dự án "${config.projectId}"!`,
        projectId: config.projectId,
      };
    } else {
      return {
        success: false,
        message: 'Không đọc được dữ liệu kiểm tra từ Firestore.',
      };
    }
  } catch (error: any) {
    console.error('Firebase test error:', error);
    let errorDetail = error?.message || 'Lỗi không xác định';
    if (error?.code === 'permission-denied') {
      errorDetail =
        'Quyền truy cập bị từ chối (permission-denied). Hãy kiểm tra lại Firestore Security Rules trên Firebase Console và publish các rules cho phép đọc/ghi!';
    } else if (error?.code === 'not-found') {
      errorDetail = 'Không tìm thấy cơ sở dữ liệu Cloud Firestore (Hãy tạo Firestore Database trên Firebase Console).';
    }
    return {
      success: false,
      message: `Kết nối thất bại: ${errorDetail}`,
    };
  }
}

// ================= REAL-TIME ON-SNAPSHOT LISTENERS ĐA THIẾT BỊ =================

let activeListeners: Unsubscribe[] = [];

/**
 * Bắt đầu lắng nghe thay đổi thời gian thực từ Cloud Firestore (Real-time Sync)
 * Khi bất kỳ máy tính hay điện thoại nào thêm học sinh, nộp bài, hay thêm bài học,
 * tất cả các trình duyệt khác đang mở đều nhận được dữ liệu mới nhất tức thì!
 */
export function startRealtimeCloudSync(callbacks: {
  onUsersUpdate?: (users: User[]) => void;
  onLessonsUpdate?: (lessons: Lesson[]) => void;
  onQuestionsUpdate?: (questions: Question[]) => void;
  onSubmissionsUpdate?: (submissions: Submission[]) => void;
}): void {
  stopRealtimeCloudSync();

  const db = getFirebaseDb();
  if (!db) return;

  try {
    // 1. Lắng nghe danh sách học sinh & người dùng
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const users: User[] = [];
          snapshot.forEach((d) => users.push(d.data() as User));
          if (callbacks.onUsersUpdate) {
            callbacks.onUsersUpdate(users);
          }
        }
      },
      (err) => console.warn('Realtime users listener error:', err)
    );
    activeListeners.push(unsubUsers);

    // 2. Lắng nghe danh mục bài học
    const unsubLessons = onSnapshot(
      collection(db, 'lessons'),
      (snapshot) => {
        if (!snapshot.empty) {
          const lessons: Lesson[] = [];
          snapshot.forEach((d) => lessons.push(d.data() as Lesson));
          if (callbacks.onLessonsUpdate) {
            callbacks.onLessonsUpdate(lessons);
          }
        }
      },
      (err) => console.warn('Realtime lessons listener error:', err)
    );
    activeListeners.push(unsubLessons);

    // 3. Lắng nghe ngân hàng câu hỏi
    const unsubQuestions = onSnapshot(
      collection(db, 'questions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const questions: Question[] = [];
          snapshot.forEach((d) => questions.push(d.data() as Question));
          if (callbacks.onQuestionsUpdate) {
            callbacks.onQuestionsUpdate(questions);
          }
        }
      },
      (err) => console.warn('Realtime questions listener error:', err)
    );
    activeListeners.push(unsubQuestions);

    // 4. Lắng nghe bài thi & kết quả làm bài của học sinh
    const unsubSubmissions = onSnapshot(
      collection(db, 'submissions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const submissions: Submission[] = [];
          snapshot.forEach((d) => submissions.push(d.data() as Submission));
          submissions.sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          if (callbacks.onSubmissionsUpdate) {
            callbacks.onSubmissionsUpdate(submissions);
          }
        }
      },
      (err) => console.warn('Realtime submissions listener error:', err)
    );
    activeListeners.push(unsubSubmissions);
  } catch (e) {
    console.warn('Start realtime sync error:', e);
  }
}

/**
 * Hủy các listener thời gian thực
 */
export function stopRealtimeCloudSync(): void {
  activeListeners.forEach((unsub) => {
    try {
      unsub();
    } catch (e) {
      console.warn('Error unsubscribing:', e);
    }
  });
  activeListeners = [];
}

// ================= CÁC HÀM ĐỒNG BỘ CLOUD =================

export async function uploadAllLocalDataToFirestore(params: {
  users: User[];
  lessons: Lesson[];
  questions: Question[];
  submissions: Submission[];
}): Promise<{
  success: boolean;
  message: string;
  stats: { users: number; lessons: number; questions: number; submissions: number };
}> {
  const db = getFirebaseDb();
  if (!db) {
    return {
      success: false,
      message: 'Chưa cấu hình Firebase hoặc cơ sở dữ liệu Firestore chưa sẵn sàng.',
      stats: { users: 0, lessons: 0, questions: 0, submissions: 0 },
    };
  }

  try {
    const { users, lessons, questions, submissions } = params;

    // Ghi người dùng
    for (const user of users) {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    }

    // Ghi bài học
    for (const lesson of lessons) {
      await setDoc(doc(db, 'lessons', lesson.id), lesson, { merge: true });
    }

    // Ghi câu hỏi
    const chunkSize = 250;
    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunk = questions.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const q of chunk) {
        batch.set(doc(db, 'questions', q.id), q, { merge: true });
      }
      await batch.commit();
    }

    // Ghi bài nộp
    for (let i = 0; i < submissions.length; i += chunkSize) {
      const chunk = submissions.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const s of chunk) {
        batch.set(doc(db, 'submissions', s.id), s, { merge: true });
      }
      await batch.commit();
    }

    return {
      success: true,
      message: `Đã đồng bộ lên Cloud Firestore thành công: ${lessons.length} bài học, ${questions.length} câu hỏi, ${users.length} tài khoản, ${submissions.length} bài thi!`,
      stats: {
        users: users.length,
        lessons: lessons.length,
        questions: questions.length,
        submissions: submissions.length,
      },
    };
  } catch (error: any) {
    console.error('Upload to Firestore error:', error);
    return {
      success: false,
      message: `Đồng bộ thất bại: ${error?.message || 'Lỗi mạng hoặc quyền Firestore'}`,
      stats: { users: 0, lessons: 0, questions: 0, submissions: 0 },
    };
  }
}

export async function fetchAllDataFromFirestore(): Promise<{
  success: boolean;
  data?: {
    users: User[];
    lessons: Lesson[];
    questions: Question[];
    submissions: Submission[];
  };
  message: string;
}> {
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, message: 'Firebase chưa được kết nối.' };
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    usersSnap.forEach((d) => users.push(d.data() as User));

    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    const lessons: Lesson[] = [];
    lessonsSnap.forEach((d) => lessons.push(d.data() as Lesson));

    const questionsSnap = await getDocs(collection(db, 'questions'));
    const questions: Question[] = [];
    questionsSnap.forEach((d) => questions.push(d.data() as Question));

    const subsSnap = await getDocs(collection(db, 'submissions'));
    const submissions: Submission[] = [];
    subsSnap.forEach((d) => submissions.push(d.data() as Submission));

    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return {
      success: true,
      data: { users, lessons, questions, submissions },
      message: 'Tải dữ liệu từ Firestore thành công.',
    };
  } catch (error: any) {
    console.error('Fetch from Firestore error:', error);
    return {
      success: false,
      message: `Không thể tải từ Cloud: ${error?.message || 'Lỗi mạng'}`,
    };
  }
}

// Các hàm sync ngầm đơn lẻ
export function firestoreSyncUser(user: User): void {
  const db = getFirebaseDb();
  if (!db) return;
  setDoc(doc(db, 'users', user.id), user, { merge: true }).catch((err) =>
    console.warn('Firestore sync user error:', err)
  );
}

export function firestoreDeleteUser(userId: string): void {
  const db = getFirebaseDb();
  if (!db) return;
  deleteDoc(doc(db, 'users', userId)).catch((err) =>
    console.warn('Firestore delete user error:', err)
  );
}

export function firestoreSyncLesson(lesson: Lesson): void {
  const db = getFirebaseDb();
  if (!db) return;
  setDoc(doc(db, 'lessons', lesson.id), lesson, { merge: true }).catch((err) =>
    console.warn('Firestore sync lesson error:', err)
  );
}

export function firestoreDeleteLesson(lessonId: string): void {
  const db = getFirebaseDb();
  if (!db) return;
  deleteDoc(doc(db, 'lessons', lessonId)).catch((err) =>
    console.warn('Firestore delete lesson error:', err)
  );
}

export function firestoreSyncQuestion(question: Question): void {
  const db = getFirebaseDb();
  if (!db) return;
  setDoc(doc(db, 'questions', question.id), question, { merge: true }).catch((err) =>
    console.warn('Firestore sync question error:', err)
  );
}

export function firestoreSyncQuestionsBatch(questions: Question[]): void {
  const db = getFirebaseDb();
  if (!db || questions.length === 0) return;
  const batch = writeBatch(db);
  questions.forEach((q) => {
    batch.set(doc(db, 'questions', q.id), q, { merge: true });
  });
  batch.commit().catch((err) => console.warn('Firestore sync questions batch error:', err));
}

export function firestoreDeleteQuestion(questionId: string): void {
  const db = getFirebaseDb();
  if (!db) return;
  deleteDoc(doc(db, 'questions', questionId)).catch((err) =>
    console.warn('Firestore delete question error:', err)
  );
}

export function firestoreSyncSubmission(submission: Submission): void {
  const db = getFirebaseDb();
  if (!db) return;
  setDoc(doc(db, 'submissions', submission.id), submission, { merge: true }).catch((err) =>
    console.warn('Firestore sync submission error:', err)
  );
}
