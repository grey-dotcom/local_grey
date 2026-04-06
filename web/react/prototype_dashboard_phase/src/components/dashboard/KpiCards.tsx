'use client';

/**
 * @file components/dashboard/KpiCards.tsx
 * @description 실시간 관리 지표 — KPI 카드 4종
 *
 * ─ KPI 집계 정책 (73차 확정) ─────────────────────────────────────────────
 *
 *   [달성률 분모] 피드 전체 + 이슈 전체 + 클레임 전체 = 42건
 *     ⚠️ HOLD(보류)는 issueTotal 안에 이미 포함된 상태.
 *        별도 holdCount 가산 없음 — 이중 집계 방지.
 *        issueTotal = REPORTED(접수됨) + HOLD(보류) + RESOLVED(완료) + CANCELED(취소)
 *        피드·처리필요·클레임 각 위젯의 "전체 탭" 카운트 합과 동일.
 *
 *   [미해결 이슈] REPORTED(접수됨) + HOLD(보류)
 *     HOLD(보류)는 이슈의 보류 상태 — 별도 타입이 아닌 이슈 안의 한 상태
 *
 *   [미확인 클레임] PENDING(처리 대기)만 포함 (73차 수정)
 *     2안 확정: 고객사 등록(PENDING) → 파트너사 인정(ACCEPTED) 또는 이의제기(DISPUTED) → 종결
 *     DISPUTED(이의제기)는 파트너사 처리 완료 = 종결 상태 → 미확인 클레임에서 제외
 *     제외: DISPUTED(이의제기) + ACCEPTED(인정완료) + DISPUTE_COMPLETED(이의제기 후속 처리 완료)
 *
 *   [달성률 분자] 오늘 완료 건수
 *     피드: RESOLVED(완료) + CANCELED(취소)
 *     이슈: RESOLVED(완료) + CANCELED(취소)
 *     클레임: ACCEPTED(인정완료) + DISPUTED(이의제기) + DISPUTE_COMPLETED(이의제기 후속 처리 완료)
 *     ⚠️ 클레임 분자에 DISPUTED(이의제기) 포함 (73차 수정) — 종결 상태이므로 달성 건으로 처리
 *
 *   [갱신 주기]
 *     mock 환경: 30초 interval / 실운영 환경: 60초 polling
 *     ⚠️ 프로토타입 한정: mock에서 집계된 숫자 직접 산출. 실 운영: BE 개발자가 결정.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { loadMockFeed, loadMockIssues, loadMockClaims } from '@/utils/mockStore';
import type { TicketReport } from '@/types/dashboard';

function applyTodayDates(tickets: TicketReport[]): TicketReport[] {
  const now   = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pad   = (n: number) => String(n).padStart(2, '0');

  return tickets.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw           = t as any;
    const scheduledRole = raw._scheduledAt_role as string | undefined;
    const dueAtRole     = raw._dueAt_role       as string | undefined;

    let newScheduledAt = t.scheduledAt;
    if (scheduledRole === 'TODAY' || scheduledRole === 'NORMAL') {
      const timeOnly = t.scheduledAt.includes('T') ? t.scheduledAt.split('T')[1] : '00:00:00';
      newScheduledAt = `${today}T${timeOnly}`;
    }

    let newDueAt = t.dueAt;
    if (dueAtRole === 'URGENT') {
      const offsetMin: number = raw._urgentOffsetMin ?? 20;
      const urgentDate = new Date(now.getTime() + offsetMin * 60 * 1000);
      newDueAt = `${today}T${pad(urgentDate.getHours())}:${pad(urgentDate.getMinutes())}:00`;
    } else if (dueAtRole === 'NORMAL') {
      const normalOffsetMin: number = raw._normalOffsetMin ?? 90;
      const normalDate = new Date(now.getTime() + normalOffsetMin * 60 * 1000);
      newDueAt = `${today}T${pad(normalDate.getHours())}:${pad(normalDate.getMinutes())}:00`;
    } else if (dueAtRole === 'PAST') {
      const timeOnly = t.dueAt.includes('T') ? t.dueAt.split('T')[1] : '00:00:00';
      newDueAt = `${today}T${timeOnly}`;
    }

    return { ...t, scheduledAt: newScheduledAt, dueAt: newDueAt };
  });
}

export interface KpiSubVisibility {
  kpiTask:  boolean;
  kpiIssue: boolean;
  kpiClaim: boolean;
  kpiRate:  boolean;
}

interface KpiCardsProps {
  isMobile?: boolean;
  desktopCols?: 3 | 2 | 1;
  kpiVisibility?: KpiSubVisibility;
}

interface KpiCardData {
  visKey:       keyof KpiSubVisibility;
  iconSrc:      string;
  iconAlt:      string;
  iconNativeW?: number;
  iconNativeH?: number;
  label:        string;
  value:        number;
  unit:         string;
  valueColor?:  string;
  subLabel?:    string;
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
        <img src={iconSrc} alt={iconAlt} width={iconNativeW ?? iconSz} height={iconNativeH ?? iconSz} style={{ flexShrink: 0, objectFit: 'contain' }} />
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

function KpiInfoTooltip() {
  const [open, setOpen] = useState(false);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        btnRef.current    && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open]);

  const handleClick = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipW = 280;
      const left = rect.right + 8 + tooltipW < window.innerWidth ? rect.right + 8 : rect.left - tooltipW - 8;
      setPos({ top: rect.top - 4, left });
    }
    setOpen((p) => !p);
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleClick} aria-label="안내 보기"
        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill={open ? '#1976D2' : '#9E9E9E'} />
          </svg>
        </div>
      </button>
      {open && pos && (
        <div ref={tooltipRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 1300,
          background: 'rgba(33,33,33,0.87)', color: 'white', borderRadius: 4,
          padding: '8px 12px', maxWidth: 280, fontSize: 12,
          fontFamily: 'Noto Sans KR, Pretendard, sans-serif', fontWeight: 400,
          lineHeight: 1.6, letterSpacing: '0.20px', wordBreak: 'keep-all',
        }}>
          현재 시점의 업무 현황을 요약합니다. 지연/임박, 미해결 이슈, 미확인 클레임 수와 오늘 업무 달성률을 실시간으로 확인할 수 있습니다.
        </div>
      )}
    </>
  );
}

export function KpiCards({ isMobile = false, desktopCols = 3, kpiVisibility }: KpiCardsProps) {
  const kv = kpiVisibility ?? { kpiTask: true, kpiIssue: true, kpiClaim: true, kpiRate: true };

  const staffAuth            = useAuthStore((s) => s.staffAuth);
  const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

  const [feedTickets, setFeedTickets] = useState<TicketReport[]>([]);
  const [rawIssues,   setRawIssues]   = useState<any[]>([]);
  const [rawClaims,   setRawClaims]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  const loadData = useCallback(async () => {
    const workspaceId = staffAuth?.workspaceId;
    if (!workspaceId) return;
    if (isMockEnv) {
      const [feedRes, issueRes, claimRes] = await Promise.all([
        loadMockFeed(workspaceId), loadMockIssues(), loadMockClaims(),
      ]);
      setFeedTickets(applyTodayDates(feedRes.content as TicketReport[]));
      setRawIssues(issueRes.content);
      setRawClaims(claimRes.content);
    } else {
      // 실운영 환경: BE API 연동 필요
      // TODO: polling 엔드포인트 확정 후 구현 (미결: BE)
      console.log('[KpiCards] 실운영 환경 — BE API 연동 필요');
    }
    setLoading(false);
  }, [staffAuth?.workspaceId, isMockEnv]);

  useEffect(() => {
    setLoading(true);
    loadData();
    // mock: 30초 / 실운영: 60초 polling
    // ⚠️ 실운영 환경에서는 BE API 엔드포인트 확정 후 interval 방식 또는 WebSocket으로 교체할 것
    const timer = setInterval(() => { loadData(); }, isMockEnv ? 30_000 : 60_000);
    return () => clearInterval(timer);
  }, [loadData, isMockEnv]);

  const applyRoomFilter = useCallback(
    <T extends { roomGroupId?: string }>(items: T[]): T[] => {
      if (activeTabGroupId)                return items.filter((i) => i.roomGroupId === activeTabGroupId);
      if (selectedRoomGroupIds.length > 0) return items.filter((i) => selectedRoomGroupIds.includes(i.roomGroupId ?? ''));
      return items;
    },
    [activeTabGroupId, selectedRoomGroupIds]
  );

  const kpi = useMemo(() => {
    const allFiltered    = applyRoomFilter(feedTickets);
    const filteredIssues = applyRoomFilter(rawIssues);
    const filteredClaims = applyRoomFilter(rawClaims);

    const nowMs    = Date.now();
    const todayStr = `${new Date(nowMs).getFullYear()}-${String(new Date(nowMs).getMonth()+1).padStart(2,'0')}-${String(new Date(nowMs).getDate()).padStart(2,'0')}`;

    const resolveCompletedAt = (raw: any): string | null => {
      if (!raw.completedAt) return null;
      if (raw._completedAt_role === 'TODAY' && raw.completedAt.startsWith('_TODAY_T')) {
        return `${todayStr}T${raw.completedAt.split('_TODAY_T')[1]}`;
      }
      return raw.completedAt;
    };
    const isTodayDate = (dateStr: string | null): boolean => !!dateStr && dateStr.startsWith(todayStr);

    // ── 업무 현황: PENDING(미배정)·ASSIGNED(배정됨)·RESERVED(수행전)·STARTED(수행중) 4종만
    const taskCount = allFiltered.filter((t) =>
      t.ticketStatus === 'PENDING' || t.ticketStatus === 'ASSIGNED' ||
      t.ticketStatus === 'RESERVED' || t.ticketStatus === 'STARTED'
    ).length;

    // ── 달성률 분모: 피드 전체 + 이슈 전체 + 클레임 전체
    //    HOLD(보류)는 issueTotal 안에 이미 포함 → holdCount 별도 가산 없음 (이중집계 방지)
    //    27 + 9 + 6 = 42건 (각 위젯 "전체 탭" 합과 동일)
    const feedTotal  = allFiltered.length;
    const issueTotal = filteredIssues.length;
    const claimTotal = filteredClaims.length;
    const total      = feedTotal + issueTotal + claimTotal;

    // ── 달성률 분자: 오늘 완료 건수
    const feedDone = allFiltered.filter((t) =>
      (t.ticketStatus === 'RESOLVED' || t.ticketStatus === 'CANCELED') &&
      isTodayDate(resolveCompletedAt(t as any))
    ).length;

    const issueCompletedToday = filteredIssues.filter((i: any) =>
      (i.issueStatus === 'RESOLVED' || i.issueStatus === 'CANCELED') &&
      isTodayDate(resolveCompletedAt(i))
    ).length;

    // 클레임 완료: ACCEPTED(인정완료) + DISPUTED(이의제기) + DISPUTE_COMPLETED(이의제기 후속 처리 완료)
    // ⚠️ 73차 수정: DISPUTED(이의제기)는 파트너사 처리 완료(종결) 상태 → 달성 건에 포함
    const claimCompletedToday = filteredClaims.filter((c: any) =>
      (c.claimStatus === 'ACCEPTED' || c.claimStatus === 'DISPUTED' || c.claimStatus === 'DISPUTE_COMPLETED') &&
      isTodayDate(resolveCompletedAt(c))
    ).length;

    const todayCompleted = feedDone + issueCompletedToday + claimCompletedToday;
    const rate           = total > 0 ? Math.round((todayCompleted / total) * 100) : 0;

    // ── 미해결 이슈: REPORTED(접수됨) + HOLD(보류)
    //    HOLD(보류)는 이슈의 보류 상태 — 별도 타입이 아닌 이슈 안의 한 상태
    const issueCount = filteredIssues.filter((i: any) =>
      i.issueStatus === 'REPORTED' || i.issueStatus === 'HOLD'
    ).length;

    // ── 미확인 클레임: PENDING(처리 대기)만 포함 (73차 수정)
    //    2안 확정: DISPUTED(이의제기)는 파트너사 처리 완료 = 종결 → 미확인에서 제외
    //    제외: DISPUTED(이의제기) + ACCEPTED(인정완료) + DISPUTE_COMPLETED(이의제기 후속 처리 완료)
    const claimCount = filteredClaims.filter((c: any) =>
      c.claimStatus === 'PENDING'
    ).length;

    return { taskCount, completed: todayCompleted, total, rate, issueCount, claimCount };
  }, [feedTickets, rawIssues, rawClaims, applyRoomFilter]);

  const allCards: KpiCardData[] = [
    { visKey: 'kpiTask',  iconSrc: '/images/icons/kpi_task.svg',  iconAlt: 'task icon',  label: '업무 현황',       value: loading ? 0 : kpi.taskCount,  unit: '건' },
    { visKey: 'kpiIssue', iconSrc: '/images/icons/kpi_issue.svg', iconAlt: 'issue icon', iconNativeW: isMobile ? 24 : 29, iconNativeH: isMobile ? 24 : 29, label: '미해결 이슈', value: loading ? 0 : kpi.issueCount, unit: '건' },
    { visKey: 'kpiClaim', iconSrc: '/images/icons/kpi_claim.svg', iconAlt: 'claim icon', label: '미확인 클레임',    value: loading ? 0 : kpi.claimCount, unit: '건' },
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
        <KpiInfoTooltip />
      </div>
      {isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile />)}
        </div>
      ) : desktopCols === 2 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile={false} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          {cards.map((card) => <KpiCard key={card.visKey} {...card} isMobile={false} />)}
        </div>
      )}
    </div>
  );
}
