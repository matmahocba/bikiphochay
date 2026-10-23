/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CẤU HÌNH FIREBASE DÀNH CHO DỰ ÁN KHI ĐƯA LÊN NETLIFY (HOẶC MÁY CHỦ BẤT KỲ)
 * 
 * Cách hoạt động đa thiết bị & đa trình duyệt:
 * - Khi Thầy/Cô cấu hình thông số Firebase tại đây hoặc qua Netlify Environment Variables,
 *   tất cả học sinh và giáo viên khi truy cập website (trên điện thoại, máy tính bàn, laptop)
 *   sẽ tự động kết nối chung vào 1 cơ sở dữ liệu Cloud Firestore trực tuyến duy nhất.
 * - Mọi thao tác: Học sinh đăng ký tài khoản, làm bài ôn tập, giáo viên thêm bài học / câu hỏi
 *   sẽ được đồng bộ theo thời gian thực (Real-time onSnapshot) đến tất cả các máy khác ngay tức khắc!
 */

export interface FirebaseProjectConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

// Thầy/Cô có thể điền trực tiếp thông số Firebase tại đây trước khi tải lên GitHub/Netlify:
export const DEFAULT_FIREBASE_CONFIG: FirebaseProjectConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
