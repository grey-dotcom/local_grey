'use client';

// ============================================================
// ReportScreen — Flutter report_screen.dart 대응
// 보고사항 등록 / 수정
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { reportCategories, reportTypes } from '@/lib/data';
import type { ReportCategory, ReportEntry, ReportType } from '@/lib/types';

const FONT = "'S-Core Dream', sans-serif";
const BTN_FILL = '#2751E0';
const BTN_INACTIVE = '#CCCCCC';
const MANDATORY = '#DE321C';

interface Props {
  editEntry?: ReportEntry | null;
  onBack: () => void;
}

export default function ReportScreen({ editEntry, onBack }: Props) {
  const isEditMode = !!editEntry;
  const report = useReportContext();

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 수정 모드 초기화
  useEffect(() => {
    if (editEntry) {
      const cat = reportCategories.find(c => c.id === editEntry.categoryId) ?? null;
      const typ = reportTypes.find(t => t.id === editEntry.typeId) ?? null;
      setSelectedCategory(cat);
      setSelectedType(typ);
      setPhotoDataUrls([...editEntry.photoDataUrls]);
      setText(editEntry.text);
    }
  }, [editEntry]);

  // 완료 조건: 카테고리 + 유형 + 텍스트 1자 이상
  const isComplete = !!selectedCategory && !!selectedType && text.trim().length > 0;

  // 변경 감지
  const isDirty = isEditMode
    ? selectedCategory?.id !== editEntry?.categoryId ||
      selectedType?.id !== editEntry?.typeId ||
      text !== editEntry?.text ||
      photoDataUrls.length !== editEntry?.photoDataUrls.length
    : !!selectedCategory || !!selectedType || photoDataUrls.length > 0 || text.length > 0;

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  function handleBack() {
    if (isDirty) setShowLeaveDialog(true);
    else onBack();
  }

  async function handlePickPhoto() {
    if (photoDataUrls.length >= 5) {
      showToast('사진은 최대 5장까지 등록 가능합니다.');
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoDataUrls(prev => [...prev, dataUrl]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSubmit() {
    if (!isComplete || !selectedCategory || !selectedType) return;
    if (isEditMode && editEntry) {
      report.update({
        ...editEntry,
        categoryId: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        typeId: selectedType.id,
        typeLabel: selectedType.label,
        photoDataUrls: [...photoDataUrls],
        text,
      });
      showToast('보고사항이 수정되었습니다.');
    } else {
      report.add({
        id: String(Date.now()),
        categoryId: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        typeId: selectedType.id,
        typeLabel: selectedType.label,
        photoDataUrls: [...photoDataUrls],
        text,
        createdAt: new Date(),
      });
      showToast('보고사항이 등록되었습니다.');
    }
    // Flutter: Navigator.pop(context) — snackbar 표시 후 바로 이전 화면으로
    setTimeout(() => onBack(), 300);
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── AppBar ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center h-14 relative"
        style={{ borderBottom: '1px solid #EEEEEE' }}
      >
        <button onClick={handleBack} className="absolute left-4 w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-black" style={{ fontSize: 18 }}>
            arrow_back_ios
          </span>
        </button>
        <p
          className="w-full text-center font-semibold"
          style={{ fontFamily: FONT, color: 'black', fontSize: 16 }}
        >
          {isEditMode ? '보고사항 수정' : '보고사항 등록'}
        </p>
      </div>

      {/* ── 본문 ───────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        onClick={() => { setCategoryOpen(false); setTypeOpen(false); }}
      >
        <div className="px-5 py-6 space-y-4">

          {/* ① 카테고리 */}
          <_SectionTitle text="카테고리를 선택해 주세요" />
          <div className="mt-3">
            <_DropdownTile
              label={selectedCategory?.label ?? '카테고리 선택'}
              isPlaceholder={!selectedCategory}
              isOpen={categoryOpen}
              onTap={(e) => {
                e.stopPropagation();
                setCategoryOpen(p => !p);
                if (!categoryOpen) setTypeOpen(false);
              }}
            />
            {categoryOpen && (
              <div className="mt-1">
                <_DropdownMenu
                  items={reportCategories.map(c => c.label)}
                  onSelect={(idx) => {
                    setSelectedCategory(reportCategories[idx]);
                    setCategoryOpen(false);
                    setSelectedType(null);
                    setTypeOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          <_DashedDivider />

          {/* ② 카테고리 선택 후 상세 섹션 */}
          {selectedCategory ? (
            <div
              className="rounded-xl p-4"
              style={{ background: '#F5F5F5' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-bold text-black" style={{ fontFamily: FONT, fontSize: 16 }}>
                {selectedCategory.label}
              </p>
              <div className="mt-3 mb-3" style={{ height: 1, background: '#E0E0E0' }} />

              {/* 보고 유형 드롭다운 */}
              <_DropdownTile
                label={selectedType?.label ?? '보고 유형 선택'}
                isPlaceholder={!selectedType}
                isOpen={typeOpen}
                onTap={(e) => {
                  e.stopPropagation();
                  setTypeOpen(p => !p);
                }}
              />
              {typeOpen && (
                <div className="mt-1">
                  <_DropdownMenu
                    items={reportTypes.map(t => t.label)}
                    onSelect={(idx) => {
                      setSelectedType(reportTypes[idx]);
                      setTypeOpen(false);
                    }}
                  />
                </div>
              )}

              {/* 사진 추가 그리드 */}
              <div className="mt-4">
                <_PhotoGrid
                  photos={photoDataUrls}
                  onAdd={handlePickPhoto}
                  onRemove={(idx) => setPhotoDataUrls(prev => prev.filter((_, i) => i !== idx))}
                />
              </div>

              {/* 텍스트 입력 */}
              <div className="mt-4">
                <_TextInputBox text={text} onChange={setText} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <p
                className="text-center leading-relaxed"
                style={{ fontFamily: FONT, color: '#BBBBBB', fontSize: 13 }}
              >
                카테고리를 선택하면<br />상세 항목이 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 등록/수정 버튼 ──────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid #EEEEEE', background: 'white' }}
      >
        <button
          onClick={handleSubmit}
          className="w-full h-[52px] rounded-[6px] text-white font-bold"
          style={{
            background: isComplete ? BTN_FILL : BTN_INACTIVE,
            fontFamily: FONT,
            fontSize: 16,
            transition: 'background 0.15s',
          }}
        >
          {isEditMode ? '수정 완료' : '등록'}
        </button>
      </div>

      {/* ── 뒤로가기 경고 다이얼로그 ───────────────────── */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-[90%] mx-4">
            <p className="font-bold text-black mb-2" style={{ fontFamily: FONT, fontSize: 16 }}>
              작성 중인 내용이 있습니다
            </p>
            <p style={{ fontFamily: FONT, color: '#555555', fontSize: 14, lineHeight: '1.6' }}>
              입력한 내용이 저장되지 않습니다.<br />정말 나가시겠습니까?
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowLeaveDialog(false)}
                style={{ fontFamily: FONT, color: '#888888', fontSize: 14, fontWeight: 500 }}
                className="px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={() => { setShowLeaveDialog(false); onBack(); }}
                className="px-4 py-2 rounded-lg text-white font-bold"
                style={{ background: MANDATORY, fontFamily: FONT, fontSize: 14 }}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 토스트 (Flutter SnackBar 대응) ─────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div
            className="px-4 py-3 rounded-lg text-white text-sm font-medium"
            style={{ background: '#22C55E', fontFamily: FONT, maxWidth: 320 }}
          >
            {toast}
          </div>
        </div>
      )}

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── 공통 서브 컴포넌트 ────────────────────────────────────────

function _SectionTitle({ text }: { text: string }) {
  return (
    <p className="font-bold text-black" style={{ fontFamily: FONT, fontSize: 16, lineHeight: '24px' }}>
      {text}
    </p>
  );
}

function _DropdownTile({
  label, isPlaceholder, isOpen, onTap,
}: {
  label: string;
  isPlaceholder: boolean;
  isOpen: boolean;
  onTap: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full h-12 flex items-center px-4 rounded-lg bg-white text-left"
      style={{ border: `1px solid ${isOpen ? '#2751E0' : '#DDDDDD'}` }}
    >
      <span
        className="flex-1 text-sm"
        style={{ fontFamily: FONT, color: isPlaceholder ? '#BBBBBB' : 'black', fontWeight: 400 }}
      >
        {label}
      </span>
      <span
        className="material-symbols-outlined text-[#888888] transition-transform duration-200"
        style={{ fontSize: 22, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        keyboard_arrow_down
      </span>
    </button>
  );
}

function _DropdownMenu({ items, onSelect }: { items: string[]; onSelect: (idx: number) => void }) {
  return (
    <div
      className="bg-white rounded-lg overflow-hidden"
      style={{
        border: '1px solid #DDDDDD',
        boxShadow: '0 4px 8px rgba(0,0,0,0.07)',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="w-full text-left px-4 py-[14px]"
          style={{
            fontFamily: FONT,
            color: 'black',
            fontSize: 14,
            borderBottom: i < items.length - 1 ? '1px solid #F2F2F2' : 'none',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function _DashedDivider() {
  return (
    <div
      className="w-full"
      style={{
        height: 1,
        backgroundImage: 'repeating-linear-gradient(90deg, #D0D0D0 0px, #D0D0D0 4px, transparent 4px, transparent 7px)',
      }}
    />
  );
}

function _PhotoGrid({
  photos, onAdd, onRemove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {photos.length < 5 && (
        <button
          onClick={onAdd}
          className="w-20 h-20 rounded-lg bg-white flex flex-col items-center justify-center gap-1"
          style={{ border: '1px solid #DADADA' }}
        >
          {/* Flutter: Icons.camera_alt_outlined → FILL 0 */}
          <span
            className="material-symbols-outlined text-black"
            style={{
              fontSize: 24,
              fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
            }}
          >
            camera_alt
          </span>
          <span style={{ fontFamily: FONT, color: 'black', fontSize: 10, fontWeight: 700 }}>
            사진 추가
          </span>
        </button>
      )}
      {photos.map((url, i) => (
        <div key={i} className="relative w-20 h-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`photo-${i}`}
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute top-[2px] right-[2px] w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 13 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

function _TextInputBox({ text, onChange }: { text: string; onChange: (v: string) => void }) {
  const MAX = 50;
  return (
    <div
      className="rounded-lg bg-white"
      style={{ border: '1px solid #DDDDDD', padding: '12px 14px 8px' }}
    >
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        rows={3}
        placeholder="내용은 50자 이내로 작성해 주세요"
        className="w-full resize-none outline-none"
        style={{
          fontFamily: FONT,
          fontSize: 14,
          color: 'black',
          lineHeight: 1.5,
          background: 'transparent',
        }}
      />
      <p className="text-right" style={{ fontFamily: FONT, color: '#9F9F9F', fontSize: 12 }}>
        {text.length}/{MAX}
      </p>
    </div>
  );
}
