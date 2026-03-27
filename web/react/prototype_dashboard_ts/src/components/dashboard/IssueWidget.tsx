/**
 * @file components/dashboard/IssueWidget.tsx
 * @description 처리 필요 — 필터 레이아웃 2 (Phase 3 기초 UI)
 *
 * [높이 정책] (19차 확정)
 *
 *   카드 수 ≤ MAX_VISIBLE_CARDS(3):
 *     외곽 = 전체 카드 자연 높이 + 패딩
 *
 *   카드 수 > MAX_VISIBLE_CARDS(3):
 *     외곽 = 첫 3개 카드의 실제 렌더 높이 합산 + gap + 패딩으로 고정
 *     4번째 카드부터 내부 스크롤
 *
 *   모바일: 높이 제한 없음
 *
 * [BE 연동 가이드]
 *   GET /page-dashboard/v1/issues
 *   Query: roomGroupIds={id}&filter={issueFilter}
 *
 * [Claude Code] 기초 UI 구현 — mock 데이터 연결, 필터 탭 껍데기
 *   필터 세부 로직은 Claude Desktop에서 후속 반영
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { IssueReport, IssueFilter } from '@/types/dashboard';
import { IssueCard } from './IssueCard';
import issuesMock from '@/mocks/issues.json';

const MAX_VISIBLE_CARDS = 3;
const CARD_GAP          = 8;
const LIST_PADDING_V    = 16;

// ── 필터 탭 정의 ─────────────────────────────────────────────────────────
const FILTER_TABS: { key: IssueFilter; label: string }[] = [
  { key: 'ALL',       label: '전체' },
  { key: 'ISSUE',     label: '이슈' },
  { key: 'ON_HOLD',   label: '보류' },
  { key: 'COMPLETED', label: '완료' },
];

// ── 필터 로직 (61차 확정) ───────────────────────────────────────────────────
// 이슈 탭: issueticket만 (ON_HOLD 제외, COMPLETED 제외) → 6건
// 보류 탭: ON_HOLD만 → 2건
// 이슈와 보류는 완전히 다른 데이터. 중복 없음.
function filterIssues(issues: IssueReport[], filter: IssueFilter): IssueReport[] {
  switch (filter) {
    case 'ALL':       return issues;
    case 'ISSUE':     return issues.filter(i => i.issueStatus !== 'COMPLETED' && i.issueStatus !== 'ON_HOLD');
    case 'ON_HOLD':   return issues.filter(i => i.issueStatus === 'ON_HOLD');
    case 'COMPLETED': return issues.filter(i => i.issueStatus === 'COMPLETED');
    default:          return issues;
  }
}

// ── 탭별 카운트 ──────────────────────────────────────────────────────────
function getTabCount(issues: IssueReport[], filter: IssueFilter): number {
  return filterIssues(issues, filter).length;
}

interface IssueWidgetProps {
  isMobile?:       boolean;
  isSingleColumn?: boolean;
  is3Col?:         boolean;
  desktopCols?:    number; // Empty 상태 마진 분기용 (POLICY.md § 6-7)
  style?:          React.CSSProperties; // 모바일 2열 그리드 배치용 (39차)
}

export function IssueWidget({ isMobile = false, isSingleColumn = false, desktopCols = 2, style }: IssueWidgetProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [cardListMaxH, setCardListMaxH] = useState<number | null>(null);
  const [measured, setMeasured]         = useState(false);
  const [activeFilter, setActiveFilter] = useState<IssueFilter>('ALL');

  const [allIssues, setAllIssues] = useState<IssueReport[]>(
    (issuesMock.content ?? []) as IssueReport[]
  );
  const filtered  = filterIssues(allIssues, activeFilter);

  // 카드 상태 변경 핸들러 (mock 프로토타입 — BE 연동 시 API 호출로 교체)
  const handleStatusChange = (issueId: string, newStatus: IssueReport['issueStatus']) => {
    setAllIssues(prev => prev.map(issue =>
      issue.issueId === issueId ? { ...issue, issueStatus: newStatus, isNew: false } : issue
    ));
  };
  const cardCount   = filtered.length;
  // 카드 수 제한 적용 조건 (39차 확정):
  //   - 웹(isMobile=false): 항상 적용
  //   - 모바일 2열(isMobile=true && desktopCols===2): 웹과 동일하게 적용
  //   - 모바일 1열/탭: 제한 없음
  const needsScroll = (
    (!isMobile || (isMobile && desktopCols === 2)) &&
    !isSingleColumn &&
    cardCount > MAX_VISIBLE_CARDS
  );

  useEffect(() => {
    setMeasured(false);
    setCardListMaxH(null);

    if (!needsScroll) {
      setMeasured(true);
      return;
    }

    const container = listRef.current;
    if (!container) return;

    const measure = () => {
      const cards = Array.from(container.children) as HTMLElement[];
      if (cards.length < MAX_VISIBLE_CARDS) return;

      let total = LIST_PADDING_V * 2;
      for (let i = 0; i < MAX_VISIBLE_CARDS; i++) {
        total += cards[i].getBoundingClientRect().height;
      }
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
    <div style={{
      background: 'white',
      borderRadius: 8,
      outline: '1px #EEEEEE solid',
      outlineOffset: -1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style,
    }}>
      {/* 헤더 */}
      <div style={{
        padding: isMobile ? '16px 16px 12px' : '24px 24px 18px',
        display: 'flex', flexDirection: 'column', gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'rgba(0,0,0,0.87)', fontSize: 20, fontWeight: 700, lineHeight: '32px', letterSpacing: '0.20px' }}>
              처리 필요
            </h3>
            <button type="button" title="처리 필요 안내" style={{ width: 18, height: 18, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#9E9E9E" />
              </svg>
            </button>
          </div>
          {/* + 이슈 생성 버튼 — FeedWidget "일감 생성" 공통 스펙 */}
          <button type="button"
            style={{ paddingInline: 10, paddingBlock: 4, background: '#E0E0E0', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.87)', fontSize: 13, fontWeight: 500, lineHeight: '22px', letterSpacing: '0.20px' }}
            onClick={() => console.log('[IssueWidget] 이슈 생성')}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="rgba(0,0,0,0.87)" />
            </svg>
            이슈 생성
          </button>
        </div>

        {/* 필터 탭 — FeedWidget 공통 스펙 (테두리 없음, flexWrap, 99+ §12-5) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.key;
            const count    = getTabCount(allIssues, tab.key);
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
                style={{ paddingBlock: 4, paddingInline: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.60)', fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tab.label} {displayCount}
              </button>
            );
          })}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 0, borderTop: '1px solid #EEEEEE', flexShrink: 0 }} />

      {/* 카드 리스트 */}
      <div
        ref={listRef}
        style={{
          paddingTop: LIST_PADDING_V,
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24,
          paddingBottom: LIST_PADDING_V,
          display: 'flex',
          flexDirection: 'column',
          gap: CARD_GAP,
          ...(needsScroll
            ? {
                overflowY: 'auto',
                maxHeight: cardListMaxH ?? 'none',
                opacity: measured ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }
            : { overflowY: 'visible' }),
        }}
      >
        {filtered.length === 0 ? (
          // Empty 상태 (POLICY.md § 6-7) — 열 수에 따라 상/하 마진 분기
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingTop: isMobile ? 40 : 200,
            paddingBottom: isMobile ? 40 : 200,
          }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>
              조회된 일감이 없습니다.
            </span>
          </div>
        ) : (
          filtered.map(issue => (
            <IssueCard
              key={issue.issueId}
              issue={issue}
              isMobile={isMobile}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
