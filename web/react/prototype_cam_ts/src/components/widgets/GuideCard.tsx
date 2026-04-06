'use client';

// ============================================================
// GuideCard — Flutter guide_card.dart 대응
// ============================================================

import React from 'react';
import { useCaptureContext } from '@/context/CaptureContext';

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const BLUE = '#3B82F6';
const GRAY = '#64748B';

interface Props {
  onListTap: () => void;
}

export function GuideCard({ onListTap }: Props) {
  const provider = useCaptureContext();
  const item = provider.currentItem;
  const group = provider.currentGroup;
  if (!item || !group) return null;

  const n = provider.currentItemGlobalIndex;
  const total = provider.totalItemCount;
  const isMandatory = item.isMandatory;
  const isExpanded = provider.isContentsExpanded;

  return (
    <div className="bg-white">
      {/* ── 1행: 배지 + 리스트 버튼 ──────────────────── */}
      <div className="flex items-center px-5 pt-4">
        <_Badge isMandatory={isMandatory} n={n} total={total} />
        <div className="flex-1" />
        <_ListButton onTap={onListTap} />
      </div>

      {/* ── 2행: 타이틀 (h=25px 고정) ───────────────── */}
      <div className="px-5 mt-1" style={{ height: 25, overflow: 'hidden' }}>
        <p
          className="truncate"
          style={{
            fontFamily: FONT,
            color: '#0F172A',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: '25px',
          }}
        >
          {item.title}
        </p>
      </div>

      {/* ── 3행: contents + 드롭다운 버튼 ───────────── */}
      {/* Flutter AnimatedSize: 기본 23px(1줄) → 확장 시 전체 높이 */}
      <div className="px-5 mt-2 flex items-start gap-1">
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            // Flutter AnimatedSize 대응: undefined 대신 큰 값으로 CSS transition 작동
            maxHeight: isExpanded ? 999 : 23,
            transition: 'max-height 220ms ease-in-out',
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              color: '#475569',
              fontSize: 14,
              lineHeight: '22.75px',
              // 축소 시 1줄 클램프, 확장 시 전체 표시
              display: '-webkit-box',
              WebkitLineClamp: isExpanded ? 99 : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties}
          >
            {item.contents}
          </p>
        </div>
        <button
          onClick={provider.toggleContents}
          className="flex-shrink-0"
          style={{ padding: '2px 4px 0 4px' }}
        >
          <span
            className="material-symbols-outlined transition-transform duration-200"
            style={{
              color: '#94A3B8',
              fontSize: 22,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'block',
            }}
          >
            keyboard_arrow_down
          </span>
        </button>
      </div>

      {/* ── 페이지네이션 ─────────────────────────────── */}
      <div
        className="flex items-center px-5 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid #F1F5F9', gap: 8 }}
      >
        {provider.currentItems.map((t, i) => {
          const isCurrent = i === provider.itemIndex;
          const isDone = provider.isItemCaptured(t.id);
          return (
            <button
              key={t.id}
              onClick={() => provider.jumpToItem(provider.groupIndex, i)}
              className="flex-shrink-0"
            >
              <_PaginationDot index={i + 1} isCurrent={isCurrent} isDone={isDone} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 배지 ────────────────────────────────────────────────────
function _Badge({ isMandatory, n, total }: { isMandatory: boolean; n: number; total: number }) {
  const textColor = isMandatory ? BLUE : GRAY;
  const bg = isMandatory ? '#EFF6FF' : '#F1F5F9';
  const divider = isMandatory ? 'rgba(59,130,246,0.20)' : 'rgba(100,116,139,0.24)';
  return (
    <div
      className="flex items-center rounded-full"
      style={{ background: bg, padding: '4px 10px' }}
    >
      <span style={{ fontFamily: FONT, color: textColor, fontSize: 12, fontWeight: 700, lineHeight: '1.2' }}>
        {isMandatory ? '필수' : '선택'}
      </span>
      <div style={{ width: 1, height: 12, background: divider, margin: '0 6px' }} />
      <span style={{ fontFamily: FONT, color: textColor, fontSize: 12, fontWeight: 700, lineHeight: '1.2' }}>
        {n} / {total}
      </span>
    </div>
  );
}

// ── 리스트 버튼 ──────────────────────────────────────────────
function _ListButton({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: '#F8FAFC' }}
    >
      <span className="material-symbols-outlined" style={{ color: '#475569', fontSize: 16 }}>
        format_list_bulleted
      </span>
    </button>
  );
}

// ── 페이지네이션 Dot ─────────────────────────────────────────
function _PaginationDot({ index, isCurrent, isDone }: { index: number; isCurrent: boolean; isDone: boolean }) {
  if (isCurrent) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
        style={{
          background: BLUE,
          fontSize: 14,
          fontFamily: FONT,
          // Flutter: BoxShadow(color:black/5, blur:2, offset(0,1)), spread:4(BLUE), spread:2(white)
          boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 0 0 4px ${BLUE}, 0 0 0 6px white`,
        }}
      >
        {index}
      </div>
    );
  }
  if (isDone) {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: BLUE }}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
      </div>
    );
  }
  return (
    <div className="w-2 h-2 rounded-full" style={{ background: '#CBD5E1' }} />
  );
}
