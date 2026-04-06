/**
 * @file components/dashboard/FeedWidget.tsx
 * @description 변경사항 피드 — 필터 레이아웃 1
 *
 * ─ ⚠️ 개발자 안내 (실 서비스 연동 시) ──────────────────────────────────
 *   mock 관련 파일/로직은 프로토타입 전용입니다. 실 서비스에서는 무시하거나
 *   삭제해도 됩니다. 상세 안내: docs/MOCK_GUIDE.md
 *
 *   실 서비스 연동 시 무시/삭제 대상:
 *     src/mocks/           — JSON 샘플 데이터 전체
 *     src/utils/mockStore.ts — mock 로드 유틸
 *     applyTodayDueAt()    — 아래 함수, mock 전용 날짜 재계산
 *     applyRandomNew()     — 아래 함수, mock 전용 NEW 랜덤 배정
 *     .env.local의 NEXT_PUBLIC_USE_MOCK=true → false로 변경
 *
 *   실 서비스 연동 포인트:
 *     loadMockFeed 호출부를 실제 API fetch로 교체
 *     applyTodayDueAt() 호출 한 줄 제거
 *     applyRandomNew() 호출 한 줄 제거 (isNew는 BE 응답값 직접 사용)
 *     → BE API: GET /page-dashboard/v1/ticket-reports
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ─ 높이 정책 (19차 확정) ─────────────────────────────────────────────────
 *   카드 수 ≤ MAX_VISIBLE_CARDS(4): 외곽 = 전체 카드 자연 높이 + 패딩
 *   카드 수 > MAX_VISIBLE_CARDS(4): 외곽 = 첫 4개 실제 렌더 높이 합산 + gap + 패딩 고정
 *   구현: ResizeObserver DOM 측정 + opacity 깜빡임 방지 / 모바일: 높이 제한 없음
 *
 * ─ 탭 순서 정책 (21차 확정) ──────────────────────────────────────────────
 *   전체 → 업무관리 → 지연/임박 → 취소 → 완료 (모바일 앱 기준, 웹도 동일)
 *
 * ─ onCountChange (65차 신규) ─────────────────────────────────────────────
 *   page.tsx 세그먼트 탭의 카운트를 실시간으로 전달하기 위한 콜백 prop.
 *   roomFilteredTickets 전체(ALL 필터 기준)의 카드 수를 전달.
 *   실 서비스에서도 유지 가능 (mock 전용 아님).
 *
 * ─ 지점 필터링 정책 ──────────────────────────────────────────────────────
 *   activeTabGroupId !== null → 해당 지점만
 *   selectedRoomGroupIds=[A,B] → A, B만
 *   selectedRoomGroupIds=[] → 전체
 *
 * ─ BE 연동 가이드 ────────────────────────────────────────────────────────
 *   GET /page-dashboard/v1/ticket-reports
 *   Query: roomGroupIds={id}&filter={feedFilter}&sort=LATEST&page=0&size=20
 *
 * ─ 상태값 정책 (68차 교체) ───────────────────────────────────────────────
 *   BE 원본 키로 전면 교체. 상세: docs/STATUS_POLICY.md §3
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import { loadMockFeed } from '@/utils/mockStore';
import type { FeedFilter, TicketReport, TicketStatus } from '@/types/dashboard';
import { FeedCard, isDelayOrUrgent } from './FeedCard';
import type { CardLocalState } from './FeedCard';

// ── 높이 정책 상수 ───────────────────────────────────────────────────────────
const MAX_VISIBLE_CARDS = 4;
const CARD_GAP          = 8;
const LIST_PADDING_V    = 16;

// ── NEW 랜덤 복구 상수 ────────────────────────────────────────────────────────
// ⚠️ 프로토타입 전용. 실 서비스 연동 시 이 상수 및 관련 함수/호출부를 제거할 것.
const NEW_RANDOM_RATIO = 0.35;

// ── 필터 탭 (21차 확정 / 68차 키 교체) ──────────────────────────────────────
interface FilterTab { key: FeedFilter; label: string; }
const FILTER_TABS: FilterTab[] = [
  { key: 'ALL',       label: '전체'     },
  { key: 'TASK',      label: '업무관리' },
  { key: 'DELAY',     label: '지연/임박' },
  { key: 'CANCELED',  label: '취소'     }, // ⚠️ 68차: CANCELLED → CANCELED
  { key: 'COMPLETED', label: '완료'     },
];

// ── 탭별 대상 상태 (61차 확정 / 68차 키 교체) ───────────────────────────────
// ⚠️ 68차: UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
const TASK_STATUSES:      TicketStatus[] = ['PENDING', 'ASSIGNED', 'RESERVED', 'STARTED'];
const CANCELED_STATUSES:  TicketStatus[] = ['CANCELED'];  // ⚠️ 68차: CANCELLED → CANCELED
const COMPLETED_STATUSES: TicketStatus[] = ['RESOLVED'];  // ⚠️ 68차: COMPLETED → RESOLVED

function filterTickets(
  tickets: TicketReport[],
  filter: FeedFilter,
  localOverrides?: Map<string, CardLocalState>,
): TicketReport[] {
  const getStatus = (t: TicketReport): TicketStatus =>
    localOverrides?.get(t.ticketId)?.status ?? t.ticketStatus;
  const getIsUrgent = (t: TicketReport): boolean =>
    localOverrides?.get(t.ticketId)?.isUrgent ?? false;

  switch (filter) {
    case 'ALL':
      return tickets;
    case 'TASK':
      return tickets.filter((t) => {
        const status = getStatus(t);
        if (!TASK_STATUSES.includes(status)) return false;
        if (isDelayOrUrgent({ ...t, ticketStatus: status }) || getIsUrgent(t)) return false;
        return true;
      });
    case 'DELAY':
      return tickets.filter((t) => {
        const status = getStatus(t);
        if (status === 'STARTED')  return false; // ⚠️ 68차: IN_PROGRESS → STARTED
        if (status === 'RESOLVED') return false; // ⚠️ 68차: COMPLETED → RESOLVED
        if (status === 'CANCELED') return false; // ⚠️ 68차: CANCELLED → CANCELED
        return isDelayOrUrgent({ ...t, ticketStatus: status }) || getIsUrgent(t);
      });
    case 'CANCELED':  // ⚠️ 68차: CANCELLED → CANCELED
      return tickets.filter((t) => CANCELED_STATUSES.includes(getStatus(t)));
    case 'COMPLETED':
      return tickets.filter((t) => COMPLETED_STATUSES.includes(getStatus(t)));
    default:
      return tickets;
  }
}

// ── mock dueAt 자동 재계산 (21차, 프로토타입 전용) ───────────────────────────
function applyTodayDueAt(tickets: TicketReport[]): TicketReport[] {
  const now   = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pad   = (n: number) => String(n).padStart(2, '0');

  return tickets.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw  = t as any;
    const role = raw._dueAt_role as string | undefined;
    const scheduledRole = raw._scheduledAt_role as string | undefined;

    let newScheduledAt = t.scheduledAt;
    if (scheduledRole === 'TODAY' || scheduledRole === 'NORMAL') {
      const timeOnly = t.scheduledAt.includes('T') ? t.scheduledAt.split('T')[1] : '00:00:00';
      newScheduledAt = `${today}T${timeOnly}`;
    }

    if (!role) return { ...t, scheduledAt: newScheduledAt };

    if (role === 'URGENT') {
      const offsetMin: number = raw._urgentOffsetMin ?? 20;
      const urgentDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${pad(urgentDate.getHours())}:${pad(urgentDate.getMinutes())}:00` };
    }

    if (role === 'NORMAL') {
      const offsetMin: number = raw._normalOffsetMin ?? 90;
      const normalDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${pad(normalDate.getHours())}:${pad(normalDate.getMinutes())}:00` };
    }

    // PAST
    const timeOnly = t.dueAt.includes('T') ? t.dueAt.split('T')[1] : '00:00:00';
    return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${timeOnly}` };
  });
}

// ── NEW 세션 랜덤 복구 (22차, 프로토타입 전용) ───────────────────────────────
function getNewStorageKey(workspaceId: string): string {
  const suffix = workspaceId.endsWith('2') ? 'w1' : workspaceId.endsWith('3') ? 'w2' : 'w1';
  return `feed_new_${suffix}`;
}

function applyRandomNew(tickets: TicketReport[], workspaceId: string): TicketReport[] {
  if (typeof window === 'undefined') return tickets;
  const key = getNewStorageKey(workspaceId);
  let newIds: string[];
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      newIds = JSON.parse(stored) as string[];
    } catch {
      newIds = pickRandomIds(tickets);
      localStorage.setItem(key, JSON.stringify(newIds));
    }
  } else {
    newIds = pickRandomIds(tickets);
    localStorage.setItem(key, JSON.stringify(newIds));
  }
  const newSet = new Set(newIds);
  return tickets.map((t) => ({ ...t, isNew: newSet.has(t.ticketId) }));
}

function pickRandomIds(tickets: TicketReport[]): string[] {
  const count = Math.max(1, Math.round(tickets.length * NEW_RANDOM_RATIO));
  const shuffled = [...tickets].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((t) => t.ticketId);
}

function persistDismissNew(workspaceId: string, ticketId: string): void {
  if (typeof window === 'undefined') return;
  const key = getNewStorageKey(workspaceId);
  const stored = localStorage.getItem(key);
  if (!stored) return;
  try {
    const ids: string[] = JSON.parse(stored);
    const next = ids.filter((id) => id !== ticketId);
    localStorage.setItem(key, JSON.stringify(next));
  } catch { /* ignore */ }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface FeedWidgetProps {
  isMobile?:       boolean;
  isSingleColumn?: boolean;
  is3Col?:         boolean;
  desktopCols?:    number;
  onCountChange?:  (count: number) => void; // 65차: 세그먼트 탭 카운트 실시간 전달용
}

export function FeedWidget({ isMobile = false, isSingleColumn = false, desktopCols = 2, onCountChange }: FeedWidgetProps) {
  const feedFilter    = useDashboardStore((s) => s.feedFilter);
  const setFeedFilter = useDashboardStore((s) => s.setFeedFilter);

  const staffAuth            = useAuthStore((s) => s.staffAuth);
  const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

  const [allTickets, setAllTickets]         = useState<TicketReport[]>([]);
  const [loading, setLoading]               = useState(true);
  const [localOverrides, setLocalOverrides] = useState<Map<string, CardLocalState>>(new Map());

  const handleLocalStateChange = (ticketId: string, next: CardLocalState) => {
    setLocalOverrides((prev) => new Map(prev).set(ticketId, next));
  };

  const listRef                         = useRef<HTMLDivElement>(null);
  const [cardListMaxH, setCardListMaxH] = useState<number | null>(null);
  const [measured, setMeasured]         = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true') return;
    const workspaceId = staffAuth?.workspaceId;
    if (!workspaceId) return;
    setLoading(true);
    loadMockFeed(workspaceId).then((res) => {
      const todayTickets = applyTodayDueAt(res.content as TicketReport[]);
      const newTickets   = applyRandomNew(todayTickets, workspaceId);
      setAllTickets(newTickets);
      setLoading(false);
    });
  }, [staffAuth?.workspaceId]);

  const handleDismissNew = (ticketId: string) => {
    const workspaceId = staffAuth?.workspaceId;
    if (workspaceId) persistDismissNew(workspaceId, ticketId);
    setAllTickets((prev) =>
      prev.map((t) => t.ticketId === ticketId ? { ...t, isNew: false } : t),
    );
  };

  const roomFilteredTickets = useMemo(() => {
    if (activeTabGroupId)
      return allTickets.filter((t) => t.roomGroupId === activeTabGroupId);
    if (selectedRoomGroupIds.length > 0)
      return allTickets.filter((t) => selectedRoomGroupIds.includes(t.roomGroupId ?? ''));
    return allTickets;
  }, [allTickets, activeTabGroupId, selectedRoomGroupIds]);

  const filteredTickets = useMemo(
    () => filterTickets(roomFilteredTickets, feedFilter, localOverrides),
    [roomFilteredTickets, feedFilter, localOverrides],
  );

  // 65차: 세그먼트 탭 카운트 실시간 전달 — ALL 기준 총 카드 수
  useEffect(() => {
    onCountChange?.(roomFilteredTickets.length);
  }, [roomFilteredTickets.length, onCountChange]);

  const needsScroll = (
    (!isMobile || (isMobile && desktopCols === 2)) &&
    !isSingleColumn &&
    filteredTickets.length > MAX_VISIBLE_CARDS
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
    Array.from(container.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [filteredTickets, needsScroll]);

  const paddingLeft = isMobile ? 16 : 24;

  return (
    <div style={{ background: 'white', borderRadius: 8, outline: '1px #EEEEEE solid', outlineOffset: -1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ padding: isMobile ? '16px 16px 12px' : '24px 24px 18px', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'rgba(0,0,0,0.87)', fontSize: 20, fontWeight: 700, lineHeight: '32px', letterSpacing: '0.20px' }}>
              변경사항 피드
            </h3>
            <button type="button" title="변경사항 피드 안내" style={{ width: 18, height: 18, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#9E9E9E" />
              </svg>
            </button>
          </div>
          <button type="button"
            style={{ paddingInline: 10, paddingBlock: 4, background: '#E0E0E0', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.87)', fontSize: 13, fontWeight: 500, lineHeight: '22px', letterSpacing: '0.20px' }}
            onClick={() => console.log('[FeedWidget] 일감 생성')}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="rgba(0,0,0,0.87)" />
            </svg>
            일감 생성
          </button>
        </div>

        {/* 필터 탭 (POLICY § 12-5) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => {
            const isActive     = feedFilter === tab.key;
            const count        = filterTickets(roomFilteredTickets, tab.key, localOverrides).length;
            const displayCount = count > 99 ? '99+' : count;
            return isActive ? (
              <button key={tab.key} type="button" onClick={() => setFeedFilter(tab.key)}
                style={{ paddingBlock: 4, paddingLeft: 12, paddingRight: 10, background: '#E3F2FD', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ color: '#304FFE', fontSize: 14, fontWeight: 700, lineHeight: '24px', letterSpacing: '0.20px' }}>{tab.label}</span>
                <span style={{ minWidth: 20, height: 20, paddingInline: 4, paddingBlock: 2, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2962FF', fontSize: 12, fontWeight: 700 }}>
                  {displayCount}
                </span>
              </button>
            ) : (
              <button key={tab.key} type="button" onClick={() => setFeedFilter(tab.key)}
                style={{ paddingBlock: 4, paddingInline: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.38)', fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tab.label} {displayCount}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 0, borderTop: '1px solid #EEEEEE', flexShrink: 0 }} />

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.38)', fontSize: 14 }}>로딩 중...</div>}

      {!loading && filteredTickets.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: isMobile ? 40 : 200, paddingBottom: isMobile ? 40 : 200, paddingLeft: 24, paddingRight: 24 }}>
          <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>조회된 일감이 없습니다.</span>
        </div>
      )}

      {!loading && filteredTickets.length > 0 && (
        <div
          ref={listRef}
          style={{
            paddingTop: LIST_PADDING_V, paddingLeft, paddingRight: paddingLeft, paddingBottom: LIST_PADDING_V,
            display: 'flex', flexDirection: 'column', gap: CARD_GAP,
            ...(needsScroll
              ? { overflowY: 'auto', maxHeight: cardListMaxH ?? 'none', opacity: measured ? 1 : 0, transition: 'opacity 0.15s ease' }
              : { overflowY: 'visible' }),
          }}
        >
          {filteredTickets.map((ticket) => (
            <FeedCard
              key={ticket.ticketId}
              ticket={ticket}
              isMobile={isMobile}
              isSingleColumn={isSingleColumn}
              onDismissNew={handleDismissNew}
              localOverride={localOverrides.get(ticket.ticketId)}
              onLocalStateChange={handleLocalStateChange}
              activeFilter={feedFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
