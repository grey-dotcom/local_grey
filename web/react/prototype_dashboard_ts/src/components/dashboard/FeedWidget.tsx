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
 *   카드 수 ≤ MAX_VISIBLE_CARDS(4):
 *     외곽 = 전체 카드 자연 높이 + 패딩
 *   카드 수 > MAX_VISIBLE_CARDS(4):
 *     외곽 = 첫 4개 카드 실제 렌더 높이 합산 + gap + 패딩으로 고정
 *     5번째 카드부터 내부 스크롤
 *   구현: ResizeObserver DOM 측정 + opacity 깜빡임 방지
 *   모바일: 높이 제한 없음
 *
 * ─ 탭 순서 정책 (21차 확정) ─────────────────────────────────────────────
 *   전체 → 업무관리 → 지연/임박 → 취소 → 완료
 *   ※ 모바일 앱 기준. 웹도 동일 적용.
 *
 * ─ 업무관리 탭 필터 기준 ─────────────────────────────────────────────────
 *   REPORTED|UNASSIGNED|ASSIGNED|BEFORE_START|IN_PROGRESS 전체 표시
 *   지연/임박 카드 중복 표시 여부 → PM 확인 필요
 *   [BE 연동 시] filter=TASK 파라미터 또는 별도 API 협의 필요
 *
 * ─ mock dueAt 자동 재계산 정책 (21차 신규) ──────────────────────────────
 *   목적: 매일 로케일 기준 00:00이 되면 오늘 날짜 기준 카드가 자동 구성되어
 *         지연/임박/정상 카드를 별도 수작업 없이 확인 가능하게 함.
 *   feed.json _dueAt_role 필드: PAST(지연) / URGENT(임박) / NORMAL(정상)
 *   ⚠️ 프로토타입 전용. 실 서비스에서는 applyTodayDueAt() 호출 제거.
 *
 * ─ NEW 세션 랜덤 복구 정책 (22차 신규) ──────────────────────────────────
 *   목적: 새 세션(브라우저 탭 재시작) 시 일부 카드에 NEW 배지를 랜덤 복구하여
 *         실서비스처럼 새로운 변경사항이 생긴 상태를 시뮬레이션.
 *   동작:
 *     1. 세션 시작 시 localStorage에 NEW 상태 키(feed_new_w1 등)가 없으면
 *        전체 티켓 중 일부(NEW_RANDOM_RATIO 비율)를 랜덤 선택 → 저장
 *     2. 이미 저장된 키가 있으면 그 목록 그대로 복원
 *     3. 카드 클릭 / 버튼 클릭 시 onDismissNew 콜백 → localStorage 동기 업데이트
 *   localStorage 키: feed_new_{workspaceKey} (예: feed_new_w1)
 *   ⚠️ 프로토타입 전용. 실 서비스에서는 applyRandomNew() 및 dismissNew 로직 제거,
 *      isNew는 BE API 응답의 isNew 필드 직접 사용.
 *
 * ─ 지점 필터링 정책 ──────────────────────────────────────────────────────
 *   activeTabGroupId !== null → 해당 지점만
 *   selectedRoomGroupIds=[A,B] → A, B만
 *   selectedRoomGroupIds=[] → 전체
 *
 * ─ BE 연동 가이드 ─────────────────────────────────────────────────────────
 *   GET /page-dashboard/v1/ticket-reports
 *   Query: roomGroupIds={id}&filter={feedFilter}&sort=LATEST&page=0&size=20
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
const NEW_RANDOM_RATIO = 0.35; // 전체 티켓 중 NEW 배지를 붙일 비율 (0~1)

// ── 필터 탭 (21차 확정: 전체 → 업무관리 → 지연/임박 → 취소 → 완료) ───────────
interface FilterTab { key: FeedFilter; label: string; }
const FILTER_TABS: FilterTab[] = [
  { key: 'ALL',       label: '전체'     },
  { key: 'TASK',      label: '업무관리' },
  { key: 'DELAY',     label: '지연/임박' },
  { key: 'CANCELLED', label: '취소'     },
  { key: 'COMPLETED', label: '완료'     },
];

// ── 탭별 대상 상태 (27차 확정) ───────────────────────────────────────────────
//
// [업무관리] REPORTED~IN_PROGRESS 전체 — 지연/임박 카드 중복 포함
//   목적: 상태값 기준 보고됨~수행중까지의 과정 관리
//   지연/임박은 일의 진행 상태(dueAt 기준)이므로 업무관리와 중복 노출 가능
//
// [취소] CANCELLED + ON_HOLD
//   ON_HOLD(보류) = 완료 건의 정산 보류 등 종료 처리 보류 상태
//   완료/보류/취소 = "더이상 일이 진행되지 않음" → 취소 탭에 통합
//
// [완료] COMPLETED만
// 61차 정책 개선:
// - TASK: REPORTED 제외 (issueticket으로 분리) / ON_HOLD 제외 (처리필요 위젯 보류 탭으로 이동)
// - DELAY: IN_PROGRESS 제외 확정 (수행중은 지연/임박 미포함 — isDelayOrUrgent 조건에서 충분히 처리)
// - CANCELLED: ON_HOLD 제외 (보류는 취소가 아님, 취소만)
const TASK_STATUSES:      TicketStatus[] = ['UNASSIGNED', 'ASSIGNED', 'BEFORE_START', 'IN_PROGRESS'];
const CANCELLED_STATUSES: TicketStatus[] = ['CANCELLED'];
const COMPLETED_STATUSES: TicketStatus[] = ['COMPLETED'];

// localOverrides: FeedCard에서 변경된 status를 반영하여 필터링
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
      // 업무관리: UNASSIGNED/ASSIGNED/BEFORE_START/IN_PROGRESS
      // 단, 지연/임박 건 제외 (dueAt 30분 이내 또는 초과 건은 DELAY 탭에서만 표시)
      // 완료(COMPLETED) · 취소(CANCELLED) · 보류(ON_HOLD)는 미포함
      return tickets.filter((t) => {
        const status = getStatus(t);
        if (!TASK_STATUSES.includes(status)) return false;
        // 지연/임박 건은 제외
        if (isDelayOrUrgent({ ...t, ticketStatus: status }) || getIsUrgent(t)) return false;
        return true;
      });

    case 'DELAY':
      // 61차 정책:
      // - IN_PROGRESS 제외: 수행중은 지연/임박 탭 미포함
      // - COMPLETED 제외: 완료된 건은 완료 탭에서만 표시
      // - CANCELLED 제외: 취소된 건은 취소 탭에서만 표시
      // 대상: UNASSIGNED/ASSIGNED/BEFORE_START만, dueAt 30분 이내 또는 초과
      return tickets.filter((t) => {
        const status = getStatus(t);
        if (status === 'IN_PROGRESS') return false;
        if (status === 'COMPLETED') return false;
        if (status === 'CANCELLED') return false;
        return isDelayOrUrgent({ ...t, ticketStatus: status }) || getIsUrgent(t);
      });

    case 'CANCELLED':
      // 취소: CANCELLED + ON_HOLD(보류) — 더이상 일이 진행되지 않는 상태 (27차 확정)
      return tickets.filter((t) => CANCELLED_STATUSES.includes(getStatus(t)));

    case 'COMPLETED':
      // 완료: COMPLETED만
      return tickets.filter((t) => COMPLETED_STATUSES.includes(getStatus(t)));

    default:
      return tickets;
  }
}

// ── mock dueAt 자동 재계산 ────────────────────────────────────────────────────
// ⚠️ 프로토타입 전용. 실 서비스 연동 시 이 함수와 호출부를 제거할 것.
// feed.json _dueAt_role: PAST(지연) / URGENT(NOW+offset분, 임박) / NORMAL(정상)
function applyTodayDueAt(tickets: TicketReport[]): TicketReport[] {
  const now   = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pad   = (n: number) => String(n).padStart(2, '0');

  return tickets.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw  = t as any;
    const role = raw._dueAt_role as string | undefined;
    const scheduledRole = raw._scheduledAt_role as string | undefined;

    // ── scheduledAt 재계산 (_scheduledAt_role: TODAY|NORMAL → 오늘 날짜, PAST → 원본 유지) ──
    // ⚠️ 프로토타입 전용. KPI 달성률 계산(KpiCards.tsx)에 반드시 필요.
    // TODAY/NORMAL: 오늘 날짜 + 원본 시각으로 교체
    // PAST/없음: 원본 그대로 유지 (취소/보류 등 완결된 과거 건)
    let newScheduledAt = t.scheduledAt;
    if (scheduledRole === 'TODAY' || scheduledRole === 'NORMAL') {
      const timeOnlySch = t.scheduledAt.includes('T') ? t.scheduledAt.split('T')[1] : '00:00:00';
      newScheduledAt = `${today}T${timeOnlySch}`;
    }

    // ── dueAt 재계산 (_dueAt_role: URGENT|PAST|NORMAL) ────────────────────────
    if (!role) return { ...t, scheduledAt: newScheduledAt };

    if (role === 'URGENT') {
      const offsetMin: number = raw._urgentOffsetMin ?? 20;
      const urgentDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${pad(urgentDate.getHours())}:${pad(urgentDate.getMinutes())}:00` };
    }

    // NORMAL: 원본 시각(고정값) 대신 NOW + _normalOffsetMin 으로 동적 계산 (62차 근본 수정)
    // 이유: 원본 시각(예: 22:00)을 오늘 날짜로 붙이면 검수 시각에 따라 이미 지연으로 판정되는 문제.
    // _normalOffsetMin 미지정 시 기본값 90분 — 항상 현재 시각 기준 미래 시각 보장.
    // PAST: 지연 카드 전용. 원본 시각 그대로 오늘 날짜로 교체 (이미 지난 시각 의도).
    if (role === 'NORMAL') {
      const offsetMin: number = raw._normalOffsetMin ?? 90;
      const normalDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${pad(normalDate.getHours())}:${pad(normalDate.getMinutes())}:00` };
    }

    // PAST: 오늘 날짜 + 원본 시각(이미 지난 시각) — 지연 카드 전용
    const timeOnly = t.dueAt.includes('T') ? t.dueAt.split('T')[1] : '00:00:00';
    return { ...t, scheduledAt: newScheduledAt, dueAt: `${today}T${timeOnly}` };
  });
}

// ── NEW 세션 랜덤 복구 ────────────────────────────────────────────────────────
// ⚠️ 프로토타입 전용. 실 서비스 연동 시 이 함수와 관련 호출부를 제거할 것.
//
// 동작:
//   - localStorage에 newIds 저장 키가 없으면 → 랜덤 선택 후 저장
//   - 저장 키가 있으면 → 그대로 복원
//   - 이후 티켓 목록의 isNew 필드를 newIds 기준으로 덮어씀
function getNewStorageKey(workspaceId: string): string {
  // workspaceId 마지막 1글자로 w1/w2 구분 (mockStore.ts의 WORKSPACE_KEY_MAP 패턴 참고)
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
      // 파싱 실패 시 랜덤 재생성
      newIds = pickRandomIds(tickets);
      localStorage.setItem(key, JSON.stringify(newIds));
    }
  } else {
    // 세션 최초 — 랜덤 선택 후 저장
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
  } catch { /* 무시 */ }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface FeedWidgetProps {
  isMobile?:       boolean;
  isSingleColumn?: boolean;
  is3Col?:         boolean;
  desktopCols?:    number; // Empty 상태 마진 분기용 (§ 6-7)
}

export function FeedWidget({ isMobile = false, isSingleColumn = false, desktopCols = 2 }: FeedWidgetProps) {
  const feedFilter    = useDashboardStore((s) => s.feedFilter);
  const setFeedFilter = useDashboardStore((s) => s.setFeedFilter);

  const staffAuth            = useAuthStore((s) => s.staffAuth);
  const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

  const [allTickets, setAllTickets]         = useState<TicketReport[]>([]);
  const [loading, setLoading]               = useState(true);
  // 25차: FeedCard localStatus/localIsUrgent를 FeedWidget으로 끌어올림
  // key: ticketId, value: { status, isUrgent }
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
      // ⚠️ 프로토타입 전용: 실 서비스 연동 시 아래 두 줄 제거 후 res.content 직접 사용
      const todayTickets = applyTodayDueAt(res.content as TicketReport[]);
      const newTickets   = applyRandomNew(todayTickets, workspaceId);
      setAllTickets(newTickets);
      setLoading(false);
    });
  }, [staffAuth?.workspaceId]);

  // ── NEW 소멸 핸들러 ───────────────────────────────────────────────────────
  // 카드/버튼 클릭 시 FeedCard에서 호출됨 → 상태 + localStorage 동기 업데이트
  // ⚠️ 프로토타입 전용. 실 서비스 연동 시 이 핸들러 및 persistDismissNew 제거.
  const handleDismissNew = (ticketId: string) => {
    const workspaceId = staffAuth?.workspaceId;
    if (workspaceId) persistDismissNew(workspaceId, ticketId);
    setAllTickets((prev) =>
      prev.map((t) => t.ticketId === ticketId ? { ...t, isNew: false } : t),
    );
  };

  // 탭 카운터는 localOverrides 반영 기준으로 계산
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

  // 카드 수 제한 적용 조건 (39차 확정):
  //   - 웹(isMobile=false): 항상 적용
  //   - 모바일 2열(isMobile=true && desktopCols===2): 웹과 동일하게 적용
  //   - 모바일 1열/탭(isSingleColumn 또는 desktopCols===1): 제한 없음
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

      {/* ── 헤더 ── */}
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

        {/* ── 필터 탭 (POLICY § 12-5, 33차 확정) ──
             flexWrap: wrap — 넘치면 2줄 허용 (모바일 1열 포함 전체)
             gap: 8, flexShrink: 0 — 탭 텍스트 잔림 방지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => {
            const isActive = feedFilter === tab.key;
            const count    = filterTickets(roomFilteredTickets, tab.key, localOverrides).length;
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
                style={{ paddingBlock: 4, paddingInline: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.60)', fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tab.label} {displayCount}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 0, borderTop: '1px solid #EEEEEE', flexShrink: 0 }} />

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.38)', fontSize: 14 }}>로딩 중...</div>}

      {/* ── Empty 상태 (POLICY.md § 6-7, 34차 확정) ──
          - 안내 문구: "조회된 일감이 없습니다."
          - 데스크탑 2열: 상/하 200px / 모바일·1열: 40px
          - 공간번호 검색 도입 시 검색 결과 없음 상태에도 동일 UI 재사용 */}
      {!loading && filteredTickets.length === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop:    isMobile ? 40 : 200,
          paddingBottom: isMobile ? 40 : 200,
          paddingLeft: 24,
          paddingRight: 24,
        }}>
          <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>
            조회된 일감이 없습니다.
          </span>
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
