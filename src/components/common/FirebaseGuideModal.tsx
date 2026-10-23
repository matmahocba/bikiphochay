/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Flame,
  Copy,
  Check,
  Globe,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Server,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileUp,
  Radio,
  Share2,
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveFirebaseCustomConfig,
  removeFirebaseCustomConfig,
  testFirebaseConnection,
  FirebaseCustomConfig,
  isFirebaseConfigured,
} from '../../services/firebase';
import {
  syncFromCloudFirestore,
  syncToCloudFirestore,
  exportAllDataAsJsonString,
  importDataFromJsonString,
  initRealtimeSync,
} from '../../services/storageService';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'netlify' | 'backup' | 'rules'>('config');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Trạng thái kết nối
  const [currentConfigInfo, setCurrentConfigInfo] = useState<{
    config: FirebaseCustomConfig | null;
    source: 'env' | 'custom' | 'file' | 'none';
  }>({ config: null, source: 'none' });

  // Form cấu hình
  const [quickPasteText, setQuickPasteText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Trạng thái kiểm tra & đồng bộ
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen]);

  const loadCurrentConfig = () => {
    const info = getFirebaseConfig();
    setCurrentConfigInfo(info);
    if (info.config) {
      setApiKey(info.config.apiKey || '');
      setProjectId(info.config.projectId || '');
      setAuthDomain(info.config.authDomain || '');
      setStorageBucket(info.config.storageBucket || '');
      setMessagingSenderId(info.config.messagingSenderId || '');
      setAppId(info.config.appId || '');
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Tự động phân tích khi dán đoạn mã từ Firebase Console
  const handleParseSnippet = (text: string) => {
    setQuickPasteText(text);
    if (!text.trim()) return;

    try {
      if (text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setAppId(parsed.appId);
        setStatusMessage({
          type: 'success',
          text: 'Đã trích xuất thông tin cấu hình từ JSON thành công!',
        });
        return;
      }

      const extractKey = (key: string): string => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extractKey('apiKey');
      const extractedProjectId = extractKey('projectId');
      const extractedAuthDomain = extractKey('authDomain');
      const extractedStorageBucket = extractKey('storageBucket');
      const extractedSenderId = extractKey('messagingSenderId');
      const extractedAppId = extractKey('appId');

      if (extractedApiKey && extractedProjectId) {
        setApiKey(extractedApiKey);
        setProjectId(extractedProjectId);
        if (extractedAuthDomain) setAuthDomain(extractedAuthDomain);
        if (extractedStorageBucket) setStorageBucket(extractedStorageBucket);
        if (extractedSenderId) setMessagingSenderId(extractedSenderId);
        if (extractedAppId) setAppId(extractedAppId);

        setStatusMessage({
          type: 'success',
          text: `Đã tự động trích xuất cấu hình Project "${extractedProjectId}"! Bấm "Lưu & Kiểm tra kết nối" để kích hoạt.`,
        });
      }
    } catch (e) {
      console.warn('Error parsing paste:', e);
    }
  };

  // Lưu và kiểm tra kết nối Firestore
  const handleSaveAndTest = async () => {
    const cleanApiKey = apiKey.trim();
    const cleanProjectId = projectId.trim();

    if (!cleanApiKey || !cleanProjectId) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng cung cấp ít nhất API Key và Project ID để kết nối!',
      });
      return;
    }

    const newConfig: FirebaseCustomConfig = {
      apiKey: cleanApiKey,
      projectId: cleanProjectId,
      authDomain: authDomain.trim() || `${cleanProjectId}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${cleanProjectId}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    setIsTesting(true);
    setStatusMessage({
      type: 'info',
      text: 'Đang kiểm tra kết nối đến Google Cloud Firestore...',
    });

    const testRes = await testFirebaseConnection(newConfig);
    setIsTesting(false);

    if (testRes.success) {
      saveFirebaseCustomConfig(newConfig);
      loadCurrentConfig();
      initRealtimeSync();
      setStatusMessage({
        type: 'success',
        text: `✅ ${testRes.message}. Chế độ đồng bộ thời gian thực (Real-time onSnapshot) đã được kích hoạt!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `❌ ${testRes.message}`,
      });
    }
  };

  // Hủy cấu hình và quay lại LocalStorage
  const handleResetConfig = () => {
    removeFirebaseCustomConfig();
    setApiKey('');
    setProjectId('');
    setAuthDomain('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setQuickPasteText('');
    loadCurrentConfig();
    setStatusMessage({
      type: 'info',
      text: 'Đã chuyển về chế độ LocalStorage an toàn nội bộ.',
    });
  };

  // Đẩy dữ liệu lên Cloud
  const handleUploadAll = async () => {
    setIsSyncingUp(true);
    setStatusMessage({
      type: 'info',
      text: 'Đang đồng bộ toàn bộ bài học, câu hỏi và học sinh lên Cloud Firestore...',
    });

    const res = await syncToCloudFirestore();
    setIsSyncingUp(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `✅ ${res.message}`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `❌ ${res.message}`,
      });
    }
  };

  // Tải dữ liệu từ Cloud
  const handleDownloadAll = async () => {
    setIsSyncingDown(true);
    setStatusMessage({
      type: 'info',
      text: 'Đang tải dữ liệu mới nhất từ Cloud Firestore về...',
    });

    const res = await syncFromCloudFirestore();
    setIsSyncingDown(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `✅ ${res.message}`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `❌ ${res.message}`,
      });
    }
  };

  // Tải tệp sao lưu JSON
  const handleExportBackup = () => {
    try {
      const jsonStr = exportAllDataAsJsonString();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sao_luu_tin_hoc_thcs_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'Đã tải xuống tệp sao lưu JSON thành công!',
      });
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi xuất tệp: ${e?.message}`,
      });
    }
  };

  // Khôi phục từ tệp JSON
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = await importDataFromJsonString(content);
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ ${result.message}`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `❌ ${result.message}`,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Kiểm tra kết nối hệ thống
    match /_system_check/{docId} {
      allow read, write: if true;
    }

    // 2. Hồ sơ người dùng và học sinh (Đăng ký, Đăng nhập, Quản lý)
    match /users/{userId} {
      allow read, write: if true;
    }

    // 3. Danh mục bài học Tin học Khối 6, 7, 8, 9
    match /lessons/{lessonId} {
      allow read, write: if true;
    }

    // 4. Ngân hàng câu hỏi trắc nghiệm, điền khuyết, kéo thả, tự luận
    match /questions/{questionId} {
      allow read, write: if true;
    }

    // 5. Kết quả làm bài thi & báo cáo điểm của học sinh
    match /submissions/{subId} {
      allow read, write: if true;
    }
  }
}`;

  const netlifyEnvSnippet = `# CÁC BIẾN MÔI TRƯỜNG CHO NETLIFY (Site configuration > Environment variables)
VITE_FIREBASE_API_KEY="${apiKey || 'AIzaSy...'}"
VITE_FIREBASE_PROJECT_ID="${projectId || 'tin-hoc-thcs-6789'}"
VITE_FIREBASE_AUTH_DOMAIN="${authDomain || (projectId ? `${projectId}.firebaseapp.com` : 'tin-hoc-thcs-6789.firebaseapp.com')}"
VITE_FIREBASE_STORAGE_BUCKET="${storageBucket || (projectId ? `${projectId}.firebasestorage.app` : 'tin-hoc-thcs-6789.firebasestorage.app')}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId || ''}"
VITE_FIREBASE_APP_ID="${appId || ''}"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs flex-shrink-0">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Lưu Trữ Firebase & Đồng Bộ Đa Thiết Bị Netlify
                </h3>
                {isFirebaseConfigured() ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400 text-slate-950 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
                    Đang đồng bộ Cloud
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950">
                    Chế độ LocalStorage
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-100 line-clamp-1">
                Lưu trữ bài học, học sinh, bài làm trực tuyến — các máy tính & điện thoại khác nhau đều thấy dữ liệu mới nhất
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Trạng thái dữ liệu:</span>
            {isFirebaseConfigured() ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Đang kết nối Cloud Firestore ({currentConfigInfo.config?.projectId})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Bộ nhớ máy này (LocalStorage) — Chưa kết nối Cloud chung
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isFirebaseConfigured() && (
              <>
                <button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={isSyncingUp}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                  title="Đẩy dữ liệu mẫu lên Cloud"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isSyncingUp ? 'Đang đẩy...' : 'Đẩy dữ liệu lên Cloud'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={isSyncingDown}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Tải lại từ Cloud"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isSyncingDown ? 'Đang tải...' : 'Làm mới từ Cloud'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 sm:px-6 bg-white gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Cấu Hình Firebase & Đa Thiết Bị</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('netlify')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'netlify'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Đưa Lên Netlify.app</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Sao Lưu & Chuyển Giao (.JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Firestore Rules</span>
          </button>
        </div>

        {/* Notification Toast Message inside modal */}
        {statusMessage && (
          <div
            className={`mx-5 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-sm flex-1">
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Giải thích cơ chế Đa máy tính & Đa trình duyệt */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                  <Radio className="w-4 h-4 text-indigo-600" />
                  Cơ chế Đồng bộ Đa Máy Tính & Trình Duyệt trên Netlify
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Khi đưa ứng dụng lên <strong className="text-indigo-800">Netlify.app</strong>, để <strong>tất cả các máy tính của học sinh & giáo viên đều kết nối chung và thấy dữ liệu mới nhất tức thì</strong> mà học sinh không cần phải nhập mã API key gì cả:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <span className="font-bold text-indigo-700">Cách 1 (Khuyến nghị trên Netlify):</span>
                    <p className="text-slate-600 mt-1">
                      Cài đặt 6 biến môi trường <code>VITE_FIREBASE_*</code> trong mục <strong>Site configuration &gt; Environment variables</strong> trên Netlify. Khi trang web build xong, tất cả thiết bị truy cập link đều tự động kết nối chung 1 database!
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <span className="font-bold text-indigo-700">Cách 2 (Điền trực tiếp trong mã nguồn):</span>
                    <p className="text-slate-600 mt-1">
                      Mở file <code>src/config/firebaseConfig.ts</code> trong dự án và điền thông số Firebase vào biến <code>DEFAULT_FIREBASE_CONFIG</code>. Khi đẩy lên Netlify, website sẽ dùng cấu hình này cho mọi học sinh.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Hướng dẫn lấy config */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <Key className="w-4 h-4 text-orange-600" />
                    Lấy thông tin cấu hình từ Google Firebase Console
                  </span>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold"
                  >
                    Mở Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Vào <strong className="text-slate-800">console.firebase.google.com</strong> ➔ Chọn dự án ➔ Project Settings (biểu tượng bánh răng) ➔ Thêm Web App (<code>&lt;/&gt;</code>) ➔ Sao chép đoạn mã cấu hình và dán vào bên dưới.
                </p>
              </div>

              {/* Ô dán nhanh cấu hình */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Dán nhanh đoạn mã Firebase Config (hoặc JSON):
                </label>
                <textarea
                  rows={3}
                  value={quickPasteText}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder={`Ví dụ:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "tin-hoc-thcs",\n  appId: "1:..."\n};`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs bg-slate-50/70"
                />
              </div>

              {/* Form chi tiết */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-slate-600 tracking-wider">
                    Các thông số chính
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                    className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAdvancedFields ? 'Thu gọn' : 'Xem thông số nâng cao'}</span>
                    {showAdvancedFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Project ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="tin-hoc-thcs-6789"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {showAdvancedFields && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Auth Domain
                        </label>
                        <input
                          type="text"
                          value={authDomain}
                          onChange={(e) => setAuthDomain(e.target.value)}
                          placeholder="tin-hoc-thcs.firebaseapp.com"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          App ID
                        </label>
                        <input
                          type="text"
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          placeholder="1:123456789:web:abcdef"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Storage Bucket
                        </label>
                        <input
                          type="text"
                          value={storageBucket}
                          onChange={(e) => setStorageBucket(e.target.value)}
                          placeholder="tin-hoc-thcs.firebasestorage.app"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Messaging Sender ID
                        </label>
                        <input
                          type="text"
                          value={messagingSenderId}
                          onChange={(e) => setMessagingSenderId(e.target.value)}
                          placeholder="1234567890"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAndTest}
                      disabled={isTesting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang kiểm tra kết nối...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Lưu & Kiểm tra kết nối Cloud</span>
                        </>
                      )}
                    </button>

                    {isFirebaseConfigured() && (
                      <button
                        type="button"
                        onClick={handleResetConfig}
                        className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Hủy cấu hình Cloud
                      </button>
                    )}
                  </div>

                  {isFirebaseConfigured() && (
                    <button
                      type="button"
                      onClick={handleUploadAll}
                      disabled={isSyncingUp}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Đồng bộ dữ liệu mẫu lên Cloud (1-Click)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-sm text-sky-900">
                  <Globe className="w-4 h-4 text-sky-600" />
                  Triển khai trang web miễn phí lên Netlify (.netlify.app)
                </span>
                <p className="leading-relaxed text-slate-600">
                  Dự án đã được cấu hình sẵn <code>netlify.toml</code> và <code>public/_redirects</code> để hỗ trợ Single Page App hoàn hảo (tải lại trang trên điện thoại không bao giờ gặp lỗi 404).
                </p>
              </div>

              {/* Các bước triển khai */}
              <div className="space-y-3">
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Đẩy mã nguồn lên GitHub</h5>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Đưa mã nguồn của ứng dụng lên GitHub cá nhân hoặc tài khoản trường học.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Liên kết với Netlify (Add new site &gt; Import from Git)</h5>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Vào <a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">app.netlify.com</a> ➔ Chọn repository GitHub. Cấu hình tự động:
                      <br />
                      • Build command: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">npm run build</code>
                      <br />
                      • Publish directory: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">dist</code>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-800 text-xs">
                        Cài đặt Biến môi trường trên Netlify (Giúp tất cả các máy tính dùng chung database)
                      </h5>
                      <button
                        onClick={() => copyToClipboard(netlifyEnvSnippet, 'env')}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                      >
                        {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Sao chép biến Netlify
                      </button>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Vào <strong>Site configuration &gt; Environment variables</strong> trên Netlify để lưu các giá trị sau:
                    </p>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto mt-2">
                      {netlifyEnvSnippet}
                    </pre>
                  </div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Chia sẻ link cho học sinh toàn trường</h5>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Netlify cấp link dạng <code>https://ten-ung-dung.netlify.app</code>. Khi học sinh mở link trên điện thoại hoặc máy tính và nộp bài, kết quả sẽ xuất hiện ngay trên máy tính của Thầy/Cô qua cơ sở dữ liệu thời gian thực!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-700" />
                  Sao Lưu & Chuyển Giao Dữ Liệu Ngoại Tuyến (JSON)
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Tính năng này giúp Thầy/Cô sao lưu toàn bộ danh mục 16 bài học, ngân hàng câu hỏi, tài khoản học sinh và toàn bộ lịch sử điểm số ra một tệp <code>.json</code> duy nhất. Thầy/Cô có thể cất giữ an toàn hoặc chuyển sang bất kỳ máy tính nào khác mà không cần cấu hình mạng.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Xuất dữ liệu */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Xuất tệp sao lưu (.json)</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tải về máy toàn bộ dữ liệu hiện tại của ứng dụng (bài học, câu hỏi, tài khoản học sinh, lịch sử làm bài thi).
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Tải về tệp sao lưu dữ liệu (.json)</span>
                  </button>
                </div>

                {/* Nhập dữ liệu */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Khôi phục từ tệp (.json)</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Nạp dữ liệu từ tệp sao lưu trước đó hoặc từ máy tính khác. Nếu đang kết nối Cloud, dữ liệu sẽ tự động đồng bộ lên Firebase.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Chọn tệp .json để khôi phục</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Quy tắc bảo mật Cloud Firestore (Firestore Rules)
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Dán đoạn quy tắc này vào tab <strong>Rules</strong> của Firestore trong Firebase Console để cho phép học sinh nộp bài và xem kết quả.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(sampleRules, 'rules')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Sao chép Rules
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {sampleRules}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Môn Tin học Khối 6, 7, 8, 9 • Giáo viên: Lê Quang Khánh</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            Đóng hộp thoại
          </button>
        </div>
      </div>
    </div>
  );
};
