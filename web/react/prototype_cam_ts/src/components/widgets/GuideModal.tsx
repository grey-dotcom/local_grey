'use client';

// ============================================================
// GuideModal — Flutter guide_modal.dart 대응
// 업무 참고사항 가이드 모달
// ============================================================

import React, { useState } from 'react';
import type { TaskItem } from '@/lib/types';

const FONT = "'S-Core Dream', sans-serif";

interface Props {
  item: TaskItem;
  onClose: () => void;
}

export function GuideModal({ item, onClose }: Props) {
  const images = item.guideImageUrl ? [item.guideImageUrl] : [];
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.54)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ width: 296 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이미지 캐러셀 */}
        {images.length > 0 ? (
          <div className="relative" style={{ height: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentPage]}
              alt="guide"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black flex items-center justify-center disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black flex items-center justify-center disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>chevron_right</span>
                </button>
                <div
                  className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-[3px] rounded-full"
                  style={{ background: 'rgba(0,0,0,0.39)' }}
                >
                  <span className="text-white text-xs font-medium" style={{ fontFamily: FONT }}>
                    {currentPage + 1}/{images.length}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: 40 }} />
        )}

        {/* 내용 */}
        <div className="px-4 pt-5">
          <p
            className="text-black font-semibold text-center"
            style={{ fontFamily: FONT, fontSize: 18, lineHeight: '26px' }}
          >
            업무 참고사항
          </p>
          <div className="mt-2 mb-3">
            <_DashedDivider />
          </div>
          <p
            className="line-clamp-3"
            style={{ fontFamily: FONT, color: '#9F9F9F', fontSize: 14, fontWeight: 200, lineHeight: '22px' }}
          >
            {item.instructions ?? item.contents}
          </p>
        </div>

        {/* 확인 버튼 */}
        <div className="px-4 pt-5 pb-4">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg text-white font-bold"
            style={{ background: '#2751E0', fontFamily: FONT, fontSize: 14 }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function _DashedDivider() {
  return (
    <div
      style={{
        width: '100%',
        height: 1,
        backgroundImage: 'repeating-linear-gradient(90deg, #D0D0D0 0px, #D0D0D0 4px, transparent 4px, transparent 7px)',
      }}
    />
  );
}
