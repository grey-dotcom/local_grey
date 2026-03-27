'use client';

/**
 * @file components/dashboard/KpiCards.tsx
 * @description 실시간 관리 지표 — KPI 카드 4종
 *
 * POLICY §14-6: kpiVisibility prop으로 하위 4종 개별 ON/OFF 지원
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { loadMockFeed, loadMockIssues, loadMockClaims } from '@/utils/mockStore';
import type { TicketReport } from '@/types/dashboard';

function isTodayTicket(scheduledAt: string): boolean {
  const d = new Date(scheduledAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

// ⚠️ 프로토타입 전용. 실 서비스 연동 시 제거.
// FeedWidget.applyTodayDueAt과 동일 로직 — scheduledAt을 _scheduledAt_role 기준 오늘 날짜로 재계산.
// KPI 달성률 분자(todayCompleted) 계산에 반드시 필요.
// ⚠️ 프로토타입 전용. 실 서비스 연동 시 제거.
// FeedWidget.applyTodayDueAt과 동일 로직 — scheduledAt + dueAt 모두 오늘 날짜로 재계산.
// KPI 업무현황(분모) + 달성률(분자) 계산에 반드시 필요.
function applyTodayDates(tickets: TicketReport[]): TicketReport[] {
  const now   = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pad   = (n: number) => String(n).padStart(2, '0');

  return tickets.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = t as any;
    const scheduledRole = raw._scheduledAt_role as string | undefined;
    const dueAtRole     = raw._dueAt_role      as string | undefined;

    // scheduledAt 재계산: TODAY/NORMAL → 오늘 날짜 + 원본 시각
    let newScheduledAt = t.scheduledAt;
    if (scheduledRole === 'TODAY' || scheduledRole === 'NORMAL') {
      const timeOnly = t.scheduledAt.includes('T') ? t.scheduledAt.split('T')[1] : '00:00:00';
      newScheduledAt = `${today}T${timeOnly}`;
    }

    // dueAt 재계산: _dueAt_role 기준
    let newDueAt = t.dueAt;
    if (dueAtRole === 'URGENT') {
      const offsetMin: number = raw._urgentOffsetMin ?? 20;
      const urgentDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      newDueAt = `${today}T${pad(urgentDate.getHours())}:${pad(urgentDate.getMinutes())}:00`;
    } else if (dueAtRole === 'NORMAL') {
      // NORMAL: FeedWidget 62차 수정과 동일하게 NOW + _normalOffsetMin으로 동적 계산
      // 이유: 원본 시각(예: 22:00) 붙이면 검수 시각에 따라 지연으로 잏못 판정 되는 문제 발생 (FeedWidget 62차 근본 수정)
      const normalOffsetMin: number = (raw as any)._normalOffsetMin ?? 90;
      const normalDate = new Date(now.getTime() + normalOffsetMin * 60 * 1000);
      newDueAt = `${today}T${pad(normalDate.getHours())}:${pad(normalDate.getMinutes())}:00`;
    } else if (dueAtRole === 'PAST') {
      const timeOnly = t.dueAt.includes('T') ? t.dueAt.split('T')[1] : '00:00:00';
      newDueAt = `${today}T${timeOnly}`;
    }
    // dueAtRole 없음(COMPLETED/CANCELLED 등): 원본 그대로

    return { ...t, scheduledAt: newScheduledAt, dueAt: newDueAt };
  });
}

// POLICY §14-6: KPI 하위 위젯 ON/OFF
export interface KpiSubVisibility {
  kpiTask:  boolean;
  kpiIssue: boolean;
  kpiClaim: boolean;
  kpiRate:  boolean;
}

interface KpiCardsProps {
  isMobile?: boolean;
  desktopCols?: 3 | 2 | 1; // BP 기준 위젯 배치 분기용 (62차 — PM 정책: 2열 구간 2×2 그리드)
  kpiVisibility?: KpiSubVisibility;
}

interface KpiCardData {
  visKey:      keyof KpiSubVisibility;
  iconSrc:     string;
  iconAlt:     string;
  iconNativeW?: number;
  iconNativeH?: number;
  label:       string;
  value:       number;
  unit:        string;
  valueColor?: string;
  subLabel?:   string;
}

interface KpiCardProps extends Omit<KpiCardData, 'visKey'> {
  isMobile: boolean;
}

function KpiCard({ iconSrc, iconAlt, iconNativeW, iconNativeH, label, value, unit, valueColor = 'black', subLabel, isMobile }: KpiCardProps) {
  const cardH   = isMobile ? 85  : 160;
  const pad     = isMobile ? 12  : 24;
  const numSize = isMobile ? 24  : 52;
  const unitSz  = isMobile ? 12  : 14;
  const labelSz = isMobile ? 12  : 16;
  const numPb   = isMobile ? 2   : 8;
  const numGap  = isMobile ? 2   : 4;
  const iconSz  = isMobile ? 28  : 36;

  return (
    <div style={{
      flex: '1 1 0', height: cardH, padding: pad,
      background: 'white', borderRadius: 8,
      outline: '1px #EEEEEE solid', outlineOffset: -1,
      overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8,
      boxSizing: 'border-box',
    }}>
      <div style={{
        flex: '1 1 0', alignSelf: 'stretch',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: isMobile ? 4 : 0,
        paddingTop: isMobile ? 4 : 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc} alt={iconAlt}
          width={iconNativeW ?? iconSz} height={iconNativeH ?? iconSz}
          style={{ flexShrink: 0, objectFit: 'contain' }}
        />
        <div style={{
          flex: '1 1 0', paddingBottom: isMobile ? 0 : 6, paddingLeft: isMobile ? 0 : 4,
          display: 'flex', flexDirection: 'column',
          justifyContent: subLabel ? 'space-between' : 'flex-start',
          alignItems: 'flex-start', alignSelf: isMobile ? 'center' : 'stretch',
        }}>
          <span style={{ color: 'rgba(0,0,0,0.87)', fontSize: labelSz, fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 700, lineHeight: isMobile ? '20px' : '28px', letterSpacing: '0.20px', wordBreak: 'keep-all' }}>
            {label}
          </span>
          {subLabel && !isMobile && (
            <span style={{ color: '#9E9E9E', fontSize: labelSz, fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px' }}>
              {subLabel}
            </span>
          )}
        </div>
      </div>

      <div style={{ width: isMobile ? undefined : 108, flexShrink: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        {subLabel && isMobile && (
          <span style={{ color: '#9E9E9E', fontSize: 10, fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 700, letterSpacing: '0.20px', marginBottom: 2 }}>
            {subLabel}
          </span>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: numGap }}>
          <span style={{ color: valueColor, fontSize: numSize, fontFamily: 'Pretendard, sans-serif', fontWeight: 700, letterSpacing: '0.20px', lineHeight: 1 }}>
            {value}
          </span>
          <div style={{ paddingBottom: numPb }}>
            <span style={{ color: 'black', fontSize: unitSz, fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 700, lineHeight: isMobile ? '20px' : '22px', letterSpacing: '0.20px' }}>
              {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── KPI 안내 툴팁 (60차 확정)
 * - 클릭 토글, 외부클릭 시 닫힘
 * - PM 확정 문구: KPI 라벨과 일치하도록 "오늘 업무 달성률" 사용
 * - 디자인: MUI Tooltip 포맷 (bg rgba(33,33,33,0.87), white, radius 4, maxWidth 280)
 * - 위치: 버튼 우측 우선, 우측 공간 부족 시 좌측으로 fallback
 */
function KpiInfoTooltip() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open]);

  const handleClick = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipW = 280;
      const left = rect.right + 8 + tooltipW < window.innerWidth
        ? rect.right + 8
        : rect.left - tooltipW - 8;
      setPos({ top: rect.top - 4, left });
    }
    setOpen((p) => !p);
  };

  const TOOLTIP_TEXT =
    '현재 시점의 업무 현황을 요약합니다. ' +
    '지연/임박, 미해결 이슈, 미확인 클레임 수와 ' +
    '오늘 업무 달성률을 실시간으로 확인할 수 있습니다.';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-label="안내 보기"
        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill={open ? '#1976D2' : '#9E9E9E'} />
          </svg>
        </div>
      </button>
      {open && pos && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 1300,
            background: 'rgba(33,33,33,0.87)',
            color: 'white',
            borderRadius: 4,
            padding: '8px 12px',
            maxWidth: 280,
            fontSize: 12,
            fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: '0.20px',
            wordBreak: 'keep-all',
          }}
        >
          {TOOLTIP_TEXT}
        </div>
      )}
    </>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function KpiCards({ isMobile = false, desktopCols = 3, kpiVisibility }: KpiCardsProps) {
  const kv = kpiVisibility ?? { kpiTask: true, kpiIssue: true, kpiClaim: true, kpiRate: true };

  const staffAuth            = useAuthStore((s) => s.staffAuth);
  const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

  const [feedTickets,  setFeedTickets]  = useState<TicketReport[]>([]);
  const [rawIssues,    setRawIssues]    = useState<any[]>([]);
  const [rawClaims,    setRawClaims]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true') return;
    const workspaceId = staffAuth?.workspaceId;
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([loadMockFeed(workspaceId), loadMockIssues(), loadMockClaims()])
      .then(([feedRes, issueRes, claimRes]) => {
        // ⚠️ 프로토타입 전용: scheduledAt + dueAt 오늘 날짜 재계산 → KPI 업무현황·달성률 정상 표시
        const todayTickets = applyTodayDates(feedRes.content as TicketReport[]);
        setFeedTickets(todayTickets);
        setRawIssues(issueRes.content);
        setRawClaims(claimRes.content);
        setLoading(false);
      });
  }, [staffAuth?.workspaceId]);

  const applyRoomFilter = useCallback(
    <T extends { roomGroupId?: string }>(items: T[]): T[] => {
      if (activeTabGroupId) return items.filter((i) => i.roomGroupId === activeTabGroupId);
      if (selectedRoomGroupIds.length > 0) return items.filter((i) => selectedRoomGroupIds.includes(i.roomGroupId ?? ''));
      return items;
    },
    [activeTabGroupId, selectedRoomGroupIds]
  );

  const kpi = useMemo(() => {
    // ── 전체 피드 티켓 지점 필터 적용 ──────────────────────────────────────
    const allFiltered = applyRoomFilter(feedTickets);
    const nowMs       = Date.now();
    const urgentMs    = 30 * 60 * 1000; // 30분

    // ── POLICY §15-1 업무 현황 (PM 확정) ────────────────────────────────
    // ① 오늘 등록된 미배정 건 (REPORTED·UNASSIGNED, scheduledAt = 오늘)
    // ② 오늘 이전 등록된 누적 미배정 건 (REPORTED·UNASSIGNED, scheduledAt < 오늘)
    // ③ 지연/임박 건 (dueAt 초과 또는 30분 이내, 미완료 전체)
    // 세 집합 합산 후 중복 ticketId 제거 (Set 기반)
    // 61차 정책 개선:
    // - REPORTED 제외: issueticket으로 분리됨 — 변경사항 피드 업무현황 대상 아님
    // - ON_HOLD 제외: 수직 티켓 아닔, 취소/완료 도 아님 — 취소/완료/지연임박 집계 대상 제외
    // PM 확정: 업무현황 = 전체 - COMPLETED - CANCELLED = UNASSIGNED+ASSIGNED+BEFORE_START+IN_PROGRESS
    const taskCount = allFiltered.filter((t) =>
      t.ticketStatus !== 'CANCELLED' && t.ticketStatus !== 'COMPLETED'
    ).length;

    // ── POLICY §15-2 오늘 업무 달성률 (61차 확정) ──────────────────────
    // 분모: 피드(CANCELLED 제외) + 이슈 전체 + 클레임 전체
    // 분자: 피드 COMPLETED + 이슈 오늘 완료 + 클레임 오늘 완료
    // 이슈·클레임 완료 건은 D+1 00:00:00 리셋 → completedAt 오늘 날짜 기준
    // ⚠️ 프로토타입: completedAt = "_TODAY_T.." 플레이스홀더를 오늘 날짜로 교체 후 판단

    const filteredIssues = applyRoomFilter(rawIssues);
    const filteredClaims = applyRoomFilter(rawClaims);

    // completedAt 재계산 헬퍼 — "_TODAY_T" 플레이스홀더를 오늘 날짜로 교체
    const todayStr = `${nowMs ? new Date(nowMs).getFullYear() : new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
    const resolveCompletedAt = (raw: any): string | null => {
      if (!raw.completedAt) return null;
      if (raw._completedAt_role === 'TODAY' && raw.completedAt.startsWith('_TODAY_T')) {
        return `${todayStr}T${raw.completedAt.split('_TODAY_T')[1]}`;
      }
      return raw.completedAt;
    };
    const isTodayDate = (dateStr: string | null): boolean => {
      if (!dateStr) return false;
      return dateStr.startsWith(todayStr);
    };

    // 피드 달성률
    // 분모: 피드 전체 27건 (취소 포함 — PM 확정: 취소도 오늘 해야 할 일에 포함)
    // 분자: COMPLETED(완료) + CANCELLED(취소) 둘 다 완료된 건
    const feedDone  = allFiltered.filter((t) =>
      t.ticketStatus === 'COMPLETED' || t.ticketStatus === 'CANCELLED'
    ).length;
    const feedTotal = allFiltered.length; // 27건 전체

    // 이슈 달성률 — 오늘 완료된 건만 분자에 포함
    const issueCompletedToday = filteredIssues.filter((i: any) =>
      i.issueStatus === 'COMPLETED' && isTodayDate(resolveCompletedAt(i))
    ).length;
    const issueTotal = filteredIssues.length; // 9건 (issueticket7 + ON_HOLD2)

    // 클레임 달성률 — 오늘 완료된 건만 분자에 포함
    const claimCompletedToday = filteredClaims.filter((c: any) =>
      c.claimStatus === 'COMPLETED' && isTodayDate(resolveCompletedAt(c))
    ).length;
    const claimTotal = filteredClaims.length; // 4건

    // 분모: 피드27 + 처리필요(issueticket7+ON_HOLD2)9 + 클레임4 = 40건
    // 분자: 피드(완료7+취소3)10 + 이슈오늘완료1 + 클레임오늘완료1 = 12건
    const todayCompleted = feedDone + issueCompletedToday + claimCompletedToday;
    const total    = feedTotal + issueTotal + claimTotal;
    const rate     = total > 0 ? Math.round((todayCompleted / total) * 100) : 0;
    const completed = todayCompleted;

    // ── POLICY §15-3 미해결 이슈 (61차 확정) ──────────────────────────────
    // issueticket 미완료(6건) + ON_HOLD 보류(2건) = 8건
    // ON_HOLD는 취소가 아니라 재개 가능한 보류 상태 → 미해결로 집계
    const issueCount = filteredIssues.filter((i: any) =>
      i.issueStatus !== 'COMPLETED'
    ).length;

    // ── POLICY §15-4 미확인 클레임 (61차 확정) ───────────────────────────
    // claimStatus PENDING만 — ON_HOLD 제외
    const claimCount = filteredClaims.filter((c: any) => c.claimStatus === 'PENDING').length;

    return { taskCount, completed, total, rate, issueCount, claimCount };
  }, [feedTickets, rawIssues, rawClaims, applyRoomFilter]);

  // POLICY §14-6: visKey로 ON/OFF 필터링
  const allCards: KpiCardData[] = [
    { visKey: 'kpiTask',  iconSrc: '/images/icons/kpi_task.svg',  iconAlt: 'task icon',  label: '업무 현황',      value: loading ? 0 : kpi.taskCount,  unit: '건' },
    { visKey: 'kpiIssue', iconSrc: '/images/icons/kpi_issue.svg', iconAlt: 'issue icon', iconNativeW: isMobile ? 24 : 29, iconNativeH: isMobile ? 24 : 29, label: '미해결 이슈', value: loading ? 0 : kpi.issueCount, unit: '건' },
    { visKey: 'kpiClaim', iconSrc: '/images/icons/kpi_claim.svg', iconAlt: 'claim icon', label: '미확인 클레임',   value: loading ? 0 : kpi.claimCount, unit: '건' },
    { visKey: 'kpiRate',  iconSrc: '/images/icons/kpi_rate.svg',  iconAlt: 'rate icon',  label: '오늘 업무 달성률', value: loading ? 0 : kpi.rate, unit: '%', valueColor: '#304FFE', subLabel: loading ? '' : `${kpi.completed}/${kpi.total}건` },
  ];
  const cards = allCards.filter((c) => kv[c.visKey]);

  const titleSz = isMobile ? 16 : 20;
  const titleLH = isMobile ? '24px' : '32px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'rgba(0,0,0,0.87)', fontSize: titleSz, fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 700, lineHeight: titleLH, letterSpacing: '0.20px' }}>
          실시간 관리 지표
        </span>
        {/* KPI 안내 툴팁 버튼 (60차 교체) */}
        <KpiInfoTooltip />
      </div>

      {isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile />)}
        </div>
      ) : desktopCols === 2 ? (
        /* 웹 2열 구간: 2×2 그리드 (62차 PM 정책 만영)
         * 카드 순서: 1(업무현황) 2(미해결이슈) / 3(미확인클레임) 4(달성률)
         * 카드 내부 스타일: isMobile=false 유지 (160px 높이, 웹 기준) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile={false} />)}
        </div>
      ) : (
        /* 웹 3열 구간: flex 1줄 4개 (현행 유지) */
        <div style={{ display: 'flex', gap: 16 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile={false} />)}
        </div>
      )}
    </div>
  );
}
