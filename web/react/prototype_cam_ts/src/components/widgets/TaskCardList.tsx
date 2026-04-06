'use client';

// ============================================================
// TaskCardList — Flutter task_card.dart + TaskPhotoCell 대응
// TaskListScreen 에서 그룹 내 아이템 목록을 렌더링
// ============================================================

import React from 'react';
import type { CaptureResult, TaskGroup, TaskItem } from '@/lib/types';

const FONT = "'S-Core Dream', sans-serif";
const MANDATORY = '#DE321C';
const GUIDE_BLUE = '#2751E0';
const GUIDE_GRAY = '#888888';
const CHECK_GREEN = '#0FE995';

interface Props {
  group: TaskGroup;
  groupIdx: number;
  captures: Record<string, CaptureResult>;
  onGoCapture: (itemIdx: number) => void;
  onShowGuide: (item: TaskItem) => void;
}

export function TaskCardList({ group, groupIdx, captures, onGoCapture, onShowGuide }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {group.items.map((item, iIdx) => {
        const capture = captures[item.id];
        const isDone = !!capture;
        const guideActive = item.hasGuide;

        return (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ background: '#F5F5F5' }}
          >
            {/* 사진추가 / 촬영완료 셀 */}
            <_TaskPhotoCell
              capture={capture}
              onTap={() => onGoCapture(iIdx)}
            />

            {/* 정보 셀 */}
            <div
              className="flex-1 flex items-center gap-2 px-4 py-[14px] rounded-lg bg-white"
            >
              <div className="flex-1 min-w-0">
                {/* 타이틀 (*필수 표시) */}
                <p
                  className="font-medium line-clamp-2"
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    color: 'black',
                    lineHeight: '14px',
                  }}
                >
                  {item.isMandatory && (
                    <span style={{ color: MANDATORY }}>*</span>
                  )}
                  {item.title}
                </p>
                {/* 촬영 완료 표시 — Flutter: Icons.check_circle_outline_rounded (outline) */}
                {isDone && (
                  <div className="flex items-center gap-[3px] mt-1">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        color: CHECK_GREEN,
                        fontSize: 11,
                        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                      }}
                    >
                      check_circle
                    </span>
                    <span style={{ fontFamily: FONT, color: CHECK_GREEN, fontSize: 10, fontWeight: 500 }}>
                      촬영 완료
                    </span>
                  </div>
                )}
              </div>

              {/* 가이드 버튼 — Flutter: Icons.description_outlined (외곽선) */}
              <button
                onClick={guideActive ? () => onShowGuide(item) : undefined}
                disabled={!guideActive}
                className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: '#F5F5F5' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: guideActive ? GUIDE_BLUE : GUIDE_GRAY,
                    fontSize: 16,
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                  }}
                >
                  description
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 사진 셀 60×60 ────────────────────────────────────────────
function _TaskPhotoCell({
  capture, onTap,
}: {
  capture: CaptureResult | undefined;
  onTap: () => void;
}) {
  const SZ = 60;

  if (capture) {
    return (
      <button
        onClick={onTap}
        style={{ width: SZ, height: SZ, position: 'relative', flexShrink: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capture.dataUrl}
          alt="captured"
          style={{ width: SZ, height: SZ, objectFit: 'cover', borderRadius: 8 }}
        />
        {/* 오버레이 — Flutter: Colors.black.withAlpha(40) ≈ rgba(0,0,0,0.16) */}
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: 8,
            background: 'rgba(0,0,0,0.16)',
          }}
        />
        {/* 체크 아이콘 */}
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24, borderRadius: '50%',
            background: CHECK_GREEN,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onTap}
      style={{
        width: SZ,
        height: SZ,
        flexShrink: 0,
        borderRadius: 8,
        border: '1px solid #DADADA',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Flutter: Icons.camera_alt_outlined (외곽선) */}
      <span
        className="material-symbols-outlined text-black"
        style={{
          fontSize: 20,
          fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
        }}
      >
        camera_alt
      </span>
      <span style={{ fontFamily: FONT, color: 'black', fontSize: 8, fontWeight: 700, marginTop: 2 }}>
        사진추가
      </span>
    </button>
  );
}
