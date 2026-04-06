'use client';

// ============================================================
// ReportEntriesSection / ReportEntryCard — Flutter report_entry_card.dart 대응
// ============================================================

import React, { useState } from 'react';
import { useReportContext } from '@/context/ReportContext';
import type { ReportEntry } from '@/lib/types';

const FONT = "'S-Core Dream', sans-serif";

interface Props {
  onEdit: (entry: ReportEntry) => void;
}

// ── 보고사항 섹션 (항목 없으면 숨김) ────────────────────────
export function ReportEntriesSection({ onEdit }: Props) {
  const report = useReportContext();
  if (!report.hasEntries) return null;

  return (
    <div className="bg-white mt-2 px-4 py-5">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="material-symbols-outlined text-black" style={{ fontSize: 22 }}>assignment</span>
        <p
          className="font-semibold text-black"
          style={{ fontFamily: FONT, fontSize: 16 }}
        >
          등록한 보고사항
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {report.entries.map(entry => (
          <ReportEntryCard key={entry.id} entry={entry} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

// ── 보고사항 카드 ─────────────────────────────────────────────
export function ReportEntryCard({ entry, onEdit }: { entry: ReportEntry; onEdit: (e: ReportEntry) => void }) {
  const report = useReportContext();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

  return (
    <>
      <div
        className="rounded-2xl px-4 py-6"
        style={{ background: '#F5F5F5' }}
      >
        {/* 헤더: 유형명 + 수정/삭제 */}
        <div className="flex items-center gap-2">
          <p
            className="flex-1 font-semibold text-black truncate"
            style={{ fontFamily: FONT, fontSize: 14, lineHeight: '22px' }}
          >
            {entry.typeLabel}
          </p>
          <_SmallBtn label="수정" color="#2751E0" onTap={() => onEdit(entry)} />
          <_SmallBtn label="삭제" color="#505050" onTap={() => setShowDeleteDialog(true)} />
        </div>

        {/* 구분선 */}
        <div className="my-3" style={{ height: 1, background: '#D9D9D9' }} />

        {/* 사진 썸네일 */}
        {entry.photoDataUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {entry.photoDataUrls.map((url, i) => (
              <button key={i} onClick={() => setFullscreenIdx(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`photo-${i}`}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                />
              </button>
            ))}
          </div>
        )}

        {/* 내용 텍스트 */}
        <div
          className="w-full rounded-xl p-4"
          style={{ background: 'white', border: '1px solid #DADADA' }}
        >
          <p
            style={{ fontFamily: FONT, color: 'black', fontSize: 12, fontWeight: 200, lineHeight: '14px' }}
          >
            {entry.text}
          </p>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-[90%]">
            <p className="font-bold text-black mb-2" style={{ fontFamily: FONT, fontSize: 16 }}>
              보고사항을 삭제하시겠습니까?
            </p>
            <p style={{ fontFamily: FONT, color: '#555555', fontSize: 14, lineHeight: '1.6' }}>
              삭제된 내용은 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{ fontFamily: FONT, color: '#888888', fontSize: 14, fontWeight: 500 }}
                className="px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={() => { report.remove(entry.id); setShowDeleteDialog(false); }}
                className="px-4 py-2 rounded-lg text-white font-bold"
                style={{ background: '#DE321C', fontFamily: FONT, fontSize: 14 }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체화면 사진 뷰어 */}
      {fullscreenIdx !== null && (
        <_FullscreenViewer
          photos={entry.photoDataUrls}
          initialIdx={fullscreenIdx}
          onClose={() => setFullscreenIdx(null)}
        />
      )}
    </>
  );
}

// ── 수정/삭제 소형 버튼 ──────────────────────────────────────
function _SmallBtn({ label, color, onTap }: { label: string; color: string; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-[38px] h-[26px] rounded-lg bg-white flex items-center justify-center"
      style={{ border: `1px solid ${color}` }}
    >
      <span style={{ fontFamily: FONT, color, fontSize: 12, fontWeight: 500, lineHeight: '14px' }}>
        {label}
      </span>
    </button>
  );
}

// ── 전체화면 뷰어 (PageView + 핀치줌 대신 확대 클릭) ─────────
function _FullscreenViewer({
  photos, initialIdx, onClose,
}: {
  photos: string[];
  initialIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIdx);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* 현재 사진 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[idx]}
        alt="fullscreen"
        className="max-w-full max-h-full object-contain"
      />

      {/* 닫기 */}
      <button
        onClick={onClose}
        className="absolute top-12 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>close</span>
      </button>

      {/* 이전/다음 */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(p => p - 1)}
            disabled={idx === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>chevron_left</span>
          </button>
          <button
            onClick={() => setIdx(p => p + 1)}
            disabled={idx === photos.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>chevron_right</span>
          </button>
          {/* 인디케이터 */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.47)' }}
          >
            <span className="text-white text-[13px] font-medium" style={{ fontFamily: FONT }}>
              {idx + 1} / {photos.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
