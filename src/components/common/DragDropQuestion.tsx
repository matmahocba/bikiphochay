/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DragDropPair } from '../../types';
import { GripVertical, RotateCcw, Check, Sparkles } from 'lucide-react';

interface DragDropQuestionProps {
  pairs: DragDropPair[];
  currentMapping: Record<string, string>; // slotId -> itemText
  onChange: (mapping: Record<string, string>) => void;
  disabled?: boolean;
  showCorrectAnswers?: boolean;
}

/**
 * LOGIC QUAN TRỌNG: CÂU HỎI KÉO THẢ (DRAG & DROP)
 *
 * Để đảm bảo ứng dụng hoạt động mượt mà trên cả MÁY TÍNH (dùng chuột) và ĐIỆN THOẠI (cảm ứng):
 * 1. Hỗ trợ HTML5 Drag & Drop:
 *    - onDragStart: Lưu text của thẻ đang kéo vào event.dataTransfer.
 *    - onDragOver: e.preventDefault() để cho phép thả vào ô đích.
 *    - onDrop: Lấy text từ dataTransfer và gán vào slotId tương ứng.
 *
 * 2. Hỗ trợ Chạm/Click (Touch & Click-to-Place) cho điện thoại thông minh:
 *    - Học sinh nhấn vào thẻ từ ở khay -> Thẻ chuyển sang trạng thái "Đang chọn" (selectedItem).
 *    - Sau đó chạm vào ô đích muốn đặt -> Thẻ lập tức được đưa vào ô đích đó.
 *    - Chạm vào thẻ đã đặt trong ô để hoàn trả về khay.
 *
 * 3. Ngăn ngừa trùng lặp: Mỗi thẻ item chỉ được xuất hiện ở tối đa 1 ô slot tại một thời điểm.
 */
export const DragDropQuestion: React.FC<DragDropQuestionProps> = ({
  pairs,
  currentMapping,
  onChange,
  disabled = false,
  showCorrectAnswers = false,
}) => {
  // Thẻ đang được chọn (dùng cho chế độ chạm trên điện thoại)
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Danh sách các item đã được đưa vào một ô nào đó
  const assignedItems = new Set(Object.values(currentMapping));

  // Danh sách các item còn lại trong khay chờ
  const availableItems = pairs.map((p) => p.itemText).filter((item) => !assignedItems.has(item));

  // --- HTML5 Drag & Drop handlers (Chuột máy tính) ---
  const handleDragStart = (e: React.DragEvent, itemText: string) => {
    if (disabled) return;
    e.dataTransfer.setData('text/plain', itemText);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSlotId: string) => {
    if (disabled) return;
    e.preventDefault();
    const droppedItem = e.dataTransfer.getData('text/plain');
    if (!droppedItem) return;

    placeItemInSlot(droppedItem, targetSlotId);
  };

  // --- Logic đặt item vào ô (Dùng chung cho cả Drag & Drop và Click-to-Place) ---
  const placeItemInSlot = (itemText: string, targetSlotId: string) => {
    const updated = { ...currentMapping };

    // Nếu item này đang ở ô khác thì xóa khỏi ô đó trước
    Object.keys(updated).forEach((key) => {
      if (updated[key] === itemText) {
        delete updated[key];
      }
    });

    // Đặt vào ô mới
    updated[targetSlotId] = itemText;
    onChange(updated);
    setSelectedItem(null);
  };

  // --- Click-to-place handler (Chạm trên mobile/tablet) ---
  const handleSlotClick = (slotId: string) => {
    if (disabled) return;

    if (selectedItem) {
      // Đang có thẻ được chọn -> đặt vào ô này
      placeItemInSlot(selectedItem, slotId);
    } else if (currentMapping[slotId]) {
      // Nhấn vào ô đã có thẻ -> trả thẻ về khay chờ
      const updated = { ...currentMapping };
      delete updated[slotId];
      onChange(updated);
    }
  };

  // Xóa thẻ khỏi slot cụ thể
  const handleRemoveFromSlot = (slotId: string) => {
    if (disabled) return;
    const updated = { ...currentMapping };
    delete updated[slotId];
    onChange(updated);
  };

  // Đặt lại toàn bộ
  const handleReset = () => {
    if (disabled) return;
    onChange({});
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Khay chứa các thẻ đáp án có thể kéo thả */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Khay các thẻ đáp án (Kéo thả hoặc Nhấp để chọn):</span>
          </div>
          {Object.keys(currentMapping).length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại vị trí
            </button>
          )}
        </div>

        {availableItems.length === 0 ? (
          <div className="py-2 text-center text-xs text-slate-500 italic">
            Tất cả các thẻ đáp án đã được xếp vào các ô bên dưới.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {availableItems.map((item, idx) => {
              const isSelected = selectedItem === item;
              return (
                <div
                  key={`${item}-${idx}`}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedItem(isSelected ? null : item);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-xs select-none cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'bg-indigo-600 text-white ring-3 ring-indigo-300 scale-105 shadow-md'
                      : 'bg-white text-indigo-950 border border-indigo-200 hover:border-indigo-400 hover:bg-white hover:shadow-sm'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item}</span>
                  {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Đã chọn</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danh sách các ô nhận đáp án tương ứng */}
      <div className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Xếp đáp án tương ứng vào ô bên dưới:
        </div>
        <div className="grid grid-cols-1 gap-3">
          {pairs.map((pair, idx) => {
            const placedItem = currentMapping[pair.id];
            const isCorrect = showCorrectAnswers && placedItem === pair.itemText;
            const isWrong = showCorrectAnswers && placedItem && placedItem !== pair.itemText;

            return (
              <div
                key={pair.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, pair.id)}
                onClick={() => handleSlotClick(pair.id)}
                className={`p-3.5 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  showCorrectAnswers
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : isWrong
                      ? 'border-rose-400 bg-rose-50/50'
                      : 'border-slate-200 bg-slate-50'
                    : placedItem
                    ? 'border-indigo-400 bg-white shadow-xs'
                    : selectedItem
                    ? 'border-dashed border-indigo-400 bg-indigo-50/30 cursor-pointer animate-pulse'
                    : 'border-dashed border-slate-300 bg-slate-50/60 hover:border-indigo-300'
                }`}
              >
                {/* Nhãn mô tả đích */}
                <div className="flex items-start gap-2.5 sm:max-w-[55%]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{pair.slotLabel}</span>
                  </div>
                </div>

                {/* Vùng thả thẻ đáp án */}
                <div className="flex-1 flex sm:justify-end items-center">
                  {placedItem ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-sm font-medium">
                      <span>{placedItem}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromSlot(pair.id);
                          }}
                          className="w-4 h-4 rounded-full bg-indigo-200 hover:bg-rose-500 hover:text-white text-indigo-700 flex items-center justify-center text-xs font-bold transition-colors"
                          title="Gỡ khỏi ô"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-1.5 px-3 border border-dashed border-slate-200 rounded-lg bg-white/70">
                      {selectedItem ? '👉 Chạm vào đây để thả thẻ' : 'Thả hoặc chạm thẻ vào đây'}
                    </div>
                  )}
                </div>

                {/* Nếu ở chế độ xem kết quả */}
                {showCorrectAnswers && (
                  <div className="text-xs font-medium sm:pl-3 sm:border-l border-slate-200 flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đúng
                      </span>
                    ) : (
                      <span className="text-rose-600">
                        Đáp án đúng: <strong>{pair.itemText}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
