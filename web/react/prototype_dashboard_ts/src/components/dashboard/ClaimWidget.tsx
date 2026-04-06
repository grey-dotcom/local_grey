/**
 * @file components/dashboard/ClaimWidget.tsx
 * @description 클레임 — 필터 레이아웃 3 (Phase 3 기초 UI)
 *
 * [높이 정책] (19차 확정)
 *   카드 수 ≤ MAX_VISIBLE_CARDS(3): 외곽 = 전체 카드 자연 높이 + 패딩
 *   카드 수 > MAX_VISIBLE_CARDS(3): 외곽 = 첫 3개 실제 렌더 높이 합산 + gap + 패딩 고정
 *   모바일: 높이 제한 없음
 *
 * [onCountChange] (65차 신규)
 *   page.tsx 세그먼트 탭 카운트 실시간 전달용 콜백 prop.
 *   allClaims 전체(ALL 필터 기준) 카드 수를 전달.
 *
 * [정렬 정책] (68차 확정)
 *   오래된 순(reportedAt ASC) 기본 정렬.
 *   변경 시 sortClaims() 함수의 sort 방향만 수정.
 *
 * [조회 범위] (68차 확정)
 *   날짜 제한 없음 — 미처리 클레임 전체 표시.
 *   카드 정렬 기준 추후 변경 가능 (sortClaims 함수 참고).
 *
 * [클레임 상태] (68차 신규 — 4종)
 *   PENDING           → 처리대기
 *   ACCEPTED          → 인정완료 ⚠️ mock 임시 키
 *   DISPUTED          → 이의제기 ⚠️ mock 임시 키
 *   DISPUTE_COMPLETED → 이의제기완료 ⚠️ mock 임시 키
 *   (BE 키 미확정 — dashboard.ts ClaimStatus 주석 참고)
 *
 * [BE 연동 가이드]
 *   GET /page-dashboard/v1/claims
 *   Query: roomGroupIds={id}&filter={claimFilter}
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { ClaimReport, ClaimFilter } from '@/types/dashboard';
import { ClaimCard } from './ClaimCard';
import claimsMock from '@/mocks/claims.json';

const MAX_VISIBLE_CARDS = 3;
const CARD_GAP          = 8;
const LIST_PADDING_V    = 16;

// ── 정렬 (68차: 오래된 순 ASC 기본) ────────────────────────────────────
// 정렬 기준 변경 시 이 함수만 수정하면 됨
// 현재: reportedAt 오름차순 (가장 오래된 클레임 먼저)
// 변경 예: 최신순 → (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
function sortClaims(claims: ClaimReport[]): ClaimReport[] {
  return [...claims].sort(
    (a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
  );
}

// ── 필터 탭 (68차: 4종으로 확장) ────────────────────────────────────────
// ⚠️ ACCEPTED·DISPUTED·DISPUTE_COMPLETED는 mock 임시 키 — BE 확인 후 교체
const FILTER_TABS: { key: ClaimFilter; label: string }[] = [
  { key: 'ALL',              label: '전체'       },
  { key: 'PENDING',          label: '처리대기'   },
  { key: 'DISPUTED',         label: '이의제기'   },
  { key: 'ACCEPTED',         label: '인정완료'   },
  { key: 'DISPUTE_COMPLETED', label: '이의제기완료' },
];

function filterClaims(claims: ClaimReport[], filter: ClaimFilter): ClaimReport[] {
  switch (filter) {
    case 'ALL':              return claims;
    case 'PENDING':          return claims.filter(c => c.claimStatus === 'PENDING');
    case 'ACCEPTED':         return claims.filter(c => c.claimStatus === 'ACCEPTED');          // ⚠️ mock 임시 키
    case 'DISPUTED':         return claims.filter(c => c.claimStatus === 'DISPUTED');          // ⚠️ mock 임시 키
    case 'DISPUTE_COMPLETED': return claims.filter(c => c.claimStatus === 'DISPUTE_COMPLETED'); // ⚠️ mock 임시 키
    default:                 return claims;
  }
}

function getTabCount(claims: ClaimReport[], filter: ClaimFilter): number {
  return filterClaims(claims, filter).length;
}

interface ClaimWidgetProps {
  isMobile?:       boolean;
  isSingleColumn?: boolean;
  is3Col?:         boolean;
  desktopCols?:    number;
  style?:          React.CSSProperties;
  onCountChange?:  (count: number) => void;
}

export function ClaimWidget({ isMobile = false, isSingleColumn = false, desktopCols = 2, style, onCountChange }: ClaimWidgetProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [cardListMaxH, setCardListMaxH] = useState<number | null>(null);
  const [measured, setMeasured]         = useState(false);
  const [activeFilter, setActiveFilter] = useState<ClaimFilter>('ALL');

  // 오래된 순 정렬 적용하여 초기 로드
  const [allClaims, setAllClaims] = useState<ClaimReport[]>(
    sortClaims((claimsMock.content ?? []) as ClaimReport[])
  );
  const filtered = filterClaims(allClaims, activeFilter);

  const handleStatusChange = (claimId: string, newStatus: ClaimReport['claimStatus']) => {
    setAllClaims(prev => prev.map(claim =>
      claim.claimId === claimId ? { ...claim, claimStatus: newStatus, isNew: false } : claim
    ));
  };

  // 65차: 세그먼트 탭 카운트 실시간 전달
  useEffect(() => {
    onCountChange?.(allClaims.length);
  }, [allClaims.length, onCountChange]);

  const cardCount   = filtered.length;
  const needsScroll = (
    (!isMobile || (isMobile && desktopCols === 2)) &&
    !isSingleColumn &&
    cardCount > MAX_VISIBLE_CARDS
  );

  useEffect(() => {
    setMeasured(false);
    setCardListMaxH(null);
    if (!needsScroll) { setMeasured(true); return; }
    const container = listRef.current;
    if (!container) return;
    const measure = () => {
      const cards = Array.from(container.children) as HTMLElement[];
      if (cards.length < MAX_VISIBLE_CARDS) return;
      let total = LIST_PADDING_V * 2;
      for (let i = 0; i < MAX_VISIBLE_CARDS; i++) total += cards[i].getBoundingClientRect().height;
      total += CARD_GAP * (MAX_VISIBLE_CARDS - 1);
      setCardListMaxH(total);
      setMeasured(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    Array.from(container.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, [needsScroll, activeFilter]);

  return (
    <div style={{ background: 'white', borderRadius: 8, outline: '1px #EEEEEE solid', outlineOffset: -1, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      {/* 헤더 */}
      <div style={{ padding: isMobile ? '16px 16px 12px' : '24px 24px 18px', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'rgba(0,0,0,0.87)', fontSize: 20, fontWeight: 700, lineHeight: '32px', letterSpacing: '0.20px' }}>
              클레임
            </h3>
            <button type="button" title="클레임 안내" style={{ width: 18, height: 18, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#9E9E9E" />
              </svg>
            </button>
          </div>
          <button type="button"
            style={{ paddingInline: 10, paddingBlock: 4, background: '#E0E0E0', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.87)', fontSize: 13, fontWeight: 500, lineHeight: '22px', letterSpacing: '0.20px' }}
            onClick={() => console.log('[ClaimWidget] 클레임 등록')}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="rgba(0,0,0,0.87)" />
            </svg>
            클레임 등록
          </button>
        </div>

        {/* 필터 탭 — 4종 (68차 확장) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(tab => {
            const isActive     = activeFilter === tab.key;
            const count        = getTabCount(allClaims, tab.key);
            const displayCount = count > 99 ? '99+' : count;
            return isActive ? (
              <button key={tab.key} type="button" onClick={() => setActiveFilter(tab.key)}
                style={{ paddingBlock: 4, paddingLeft: 12, paddingRight: 10, background: '#E3F2FD', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ color: '#304FFE', fontSize: 14, fontWeight: 700, lineHeight: '24px', letterSpacing: '0.20px' }}>{tab.label}</span>
                <span style={{ minWidth: 20, height: 20, paddingInline: 4, paddingBlock: 2, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2962FF', fontSize: 12, fontWeight: 700 }}>
                  {displayCount}
                </span>
              </button>
            ) : (
              <button key={tab.key} type="button" onClick={() => setActiveFilter(tab.key)}
                style={{ paddingBlock: 4, paddingInline: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.38)', fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tab.label} {displayCount}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 0, borderTop: '1px solid #EEEEEE', flexShrink: 0 }} />

      <div ref={listRef} style={{ paddingTop: LIST_PADDING_V, paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24, paddingBottom: LIST_PADDING_V, display: 'flex', flexDirection: 'column', gap: CARD_GAP, ...(needsScroll ? { overflowY: 'auto', maxHeight: cardListMaxH ?? 'none', opacity: measured ? 1 : 0, transition: 'opacity 0.15s ease' } : { overflowY: 'visible' }) }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: isMobile ? 40 : 200, paddingBottom: isMobile ? 40 : 200 }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>조회된 클레임이 없습니다.</span>
          </div>
        ) : (
          filtered.map(claim => (
            <ClaimCard key={claim.claimId} claim={claim} isMobile={isMobile} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}
