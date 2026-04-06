'use client';

// ============================================================
// TaskListModal — Flutter task_list_modal.dart 대응
// 촬영 업무 선택 모달 (하단 시트)
// 모달 오픈 시 현재 도안이 보이는 위치로 자동 스크롤 (Flutter initState 동일)
// ============================================================

import React, { useEffect, useRef } from 'react';
import { useCaptureContext } from '@/context/CaptureContext';

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const BLUE = '#3B82F6';

// 레이아웃 상수 (높이 추정값 — Flutter _TaskListModalState 동일)
const GROUP_HEADER_FIRST_H = 12 + 24; // padding-top:0 + text + padding-bottom:12
const GROUP_HEADER_H = 20 + 24 + 12;  // padding-top:20 + text + padding-bottom:12
const CARD_H = 88;                     // 카드 내부 padding:16×2 + 콘텐츠
const CARD_GAP = 12;
const LIST_PADDING_TOP = 24;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskListModal({ isOpen, onClose }: Props) {
  const provider = useCaptureContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 모달 오픈 시 현재 도안이 보이는 위치로 자동 스크롤
  // Flutter: WidgetsBinding.instance.addPostFrameCallback → _scrollToCurrent
  useEffect(() => {
    if (!isOpen) return;
    // 렌더링 후 스크롤 (postFrameCallback 대응)
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;

      // flat list 항목 목록 재구성 (group header + item data)
      type Entry = { type: 'header'; groupIndex: number } | { type: 'item'; groupIndex: number; indexInGroup: number };
      const entries: Entry[] = [];
      for (let g = 0; g < provider.groups.length; g++) {
        entries.push({ type: 'header', groupIndex: g });
        for (let i = 0; i < provider.groups[g].items.length; i++) {
          entries.push({ type: 'item', groupIndex: g, indexInGroup: i });
        }
      }

      // 현재 도안의 flat index 찾기
      let targetIndex = -1;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.type === 'item' && e.groupIndex === provider.groupIndex && e.indexInGroup === provider.itemIndex) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex < 0) return;

      // targetIndex까지의 offset 계산
      let offset = LIST_PADDING_TOP;
      for (let i = 0; i < targetIndex; i++) {
        const e = entries[i];
        if (e.type === 'header') {
          offset += (e.groupIndex === 0) ? GROUP_HEADER_FIRST_H : GROUP_HEADER_H;
        } else {
          offset += CARD_H + CARD_GAP;
        }
      }

      // 현재 도안을 뷰포트 중앙에 오도록 조정
      const viewportH = scrollRef.current.clientHeight;
      const targetOffset = offset - (viewportH / 2) + (CARD_H / 2);
      scrollRef.current.scrollTop = Math.max(0, targetOffset);
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, provider.groupIndex, provider.itemIndex, provider.groups]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50">
      {/* 배경 — Flutter showModalBottomSheet 기본 barrierColor: Colors.black54 */}
      <div
        className="absolute inset-0 bg-black/[0.54]"
        onClick={onClose}
      />
      {/* 모달 시트 — 화면 92% */}
      {/* Flutter: BoxShadow(color: Color(0x1F000000), blurRadius:32, offset:(0,-4)) */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-white flex flex-col"
        style={{
          height: '92%',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        }}
      >
        <_ModalHeader onClose={onClose} />
        <_ModalBody onClose={onClose} scrollRef={scrollRef} />
        <_ModalFooter />
      </div>
    </div>
  );
}

function _ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex-shrink-0 flex items-center px-6 py-5"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <p
        className="font-bold"
        style={{ fontFamily: FONT, color: '#0F172A', fontSize: 20, lineHeight: '1.4' }}
      >
        촬영 업무 선택
      </p>
      <div className="flex-1" />
      <button
        onClick={onClose}
        className="w-10 h-10 flex items-center justify-center"
      >
        <span className="material-symbols-outlined" style={{ color: '#64748B', fontSize: 24 }}>close</span>
      </button>
    </div>
  );
}

function _ModalBody({ onClose, scrollRef }: { onClose: () => void; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const provider = useCaptureContext();

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
      {provider.groups.map((group, gIdx) => (
        <div key={group.id}>
          {/* 그룹 헤더 */}
          <div
            className="px-1 pb-3"
            style={{ paddingTop: gIdx === 0 ? 0 : 20 }}
          >
            <p
              className="font-bold"
              style={{ fontFamily: FONT, color: '#0F172A', fontSize: 16, lineHeight: '1.5' }}
            >
              {group.title}
            </p>
          </div>

          {/* 도안 카드들 */}
          <div className="space-y-3">
            {group.items.map((item, iIdx) => {
              // 전체 flat index
              let globalIdx = 0;
              for (let g = 0; g < gIdx; g++) globalIdx += provider.groups[g].items.length;
              globalIdx += iIdx + 1;

              const isCurrent = gIdx === provider.groupIndex && iIdx === provider.itemIndex;
              const isDone = provider.isItemCaptured(item.id);

              return (
                <_TaskCard
                  key={item.id}
                  title={item.title}
                  globalIndex={globalIdx}
                  isMandatory={item.isMandatory}
                  isCurrent={isCurrent}
                  isDone={isDone}
                  onTap={() => {
                    provider.jumpToItem(gIdx, iIdx);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function _ModalFooter() {
  const provider = useCaptureContext();
  const total = provider.totalItemCount;
  return (
    <div
      className="flex-shrink-0 px-6 py-[14px] text-center"
      style={{
        background: '#F8FAFC',
        borderTop: '1px solid #F1F5F9',
      }}
    >
      <p style={{ fontFamily: FONT, color: '#94A3B8', fontSize: 12, lineHeight: '1.33' }}>
        총 {total}개의 업무가 있습니다.
      </p>
    </div>
  );
}

// ── 도안 카드 ──────────────────────────────────────────────
function _TaskCard({
  title, globalIndex, isMandatory, isCurrent, isDone, onTap,
}: {
  title: string;
  globalIndex: number;
  isMandatory: boolean;
  isCurrent: boolean;
  isDone: boolean;
  onTap: () => void;
}) {
  const isCurrentDone = isCurrent && isDone;
  const isCurrentOnly = isCurrent && !isDone;
  const isDoneOnly = !isCurrent && isDone;

  let bg = 'white';
  let border = '1px solid #F1F5F9';
  let titleColor = '#475569';
  let badgeText = '대기';
  let badgeBg = '#F1F5F9';
  let badgeColor = '#64748B';

  if (isCurrentDone || isCurrentOnly) {
    bg = '#EFF6FF';
    border = `1px solid ${BLUE}`;
    titleColor = BLUE;
    badgeBg = BLUE;
    badgeColor = 'white';
    badgeText = isCurrentDone ? '완료' : '진행중';
  } else if (isDoneOnly) {
    badgeText = '완료';
  }

  return (
    <button
      onClick={onTap}
      className="w-full text-left flex items-center gap-3 p-4 rounded-[32px]"
      style={{ background: bg, border }}
    >
      {/* 왼쪽 배지 */}
      {isDone ? (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.10)' }}
        >
          <span className="material-symbols-outlined" style={{ color: BLUE, fontSize: 16 }}>check</span>
        </div>
      ) : (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          style={{
            background: isCurrent ? BLUE : '#F1F5F9',
            color: isCurrent ? 'white' : '#94A3B8',
            fontFamily: FONT,
          }}
        >
          {globalIndex}
        </div>
      )}

      {/* 가운데 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="truncate text-base"
            style={{
              fontFamily: FONT,
              color: titleColor,
              fontWeight: isCurrent ? 700 : 500,
              lineHeight: '1.4',
            }}
          >
            {title}
          </span>
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: badgeBg, color: badgeColor, fontFamily: FONT }}
          >
            {badgeText}
          </span>
        </div>
        <p
          style={{
            fontFamily: FONT,
            color: isMandatory ? BLUE : '#64748B',
            fontSize: 12,
            fontWeight: isCurrent && !isDone ? 700 : 500,
            lineHeight: '1.33',
          }}
        >
          {isMandatory ? '필수' : '선택'}
        </p>
      </div>

      {/* 화살표 */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: isCurrent ? 'white' : '#F8FAFC',
          boxShadow: isCurrent ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: isCurrent ? BLUE : '#94A3B8', fontSize: 20 }}
        >
          chevron_right
        </span>
      </div>
    </button>
  );
}
