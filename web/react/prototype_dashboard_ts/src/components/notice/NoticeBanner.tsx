/**
 * @file components/notice/NoticeBanner.tsx
 * @description 대시보드 공지사항 배너 컴포넌트
 *
 * ─ 웹 배너 레이아웃 정책 (확정) ──────────────────────────────────────────
 *
 *   배너 height: 84px 강제 고정
 *   내부 구조: flex row, alignItems center (배너 전체 세로 중앙)
 *
 *   패딩 구조:
 *   - 배너 좌: 32px / 배너 우: 16px (자세히보기·X 포함 영역)
 *   - 상하: flex center로 자동 (84px 안에서 콘텐츠가 세로 중앙)
 *
 *   영역 구성 (좌 → 우):
 *   [32px] [🔔 32px] [gap 12] [배지] [gap 12] [타이틀/일정 블록 flex:1] [gap 16] [자세히보기 120px] [gap 8] [X 40px] [16px]
 *
 *   1단 — title + 일정이 1줄에 들어올 때:
 *   [🔔][배지][타이틀 ────────────────] | [일정]    [자세히보기][X]
 *   → 벨·배지·타이틀·일정 모두 배너 세로 중앙정렬
 *
 *   2단 — title + 일정 합산 2줄:
 *   [🔔][배지][타이틀 ────────────]    [자세히보기][X]
 *             [일정]
 *   → 벨·배지는 title+schedule 2행 블록 기준 세로 중앙
 *   → title과 일정은 같은 왼쪽 기준점 정렬
 *
 *   캐러셀: 도트 UI는 배너 하단 외부 8px 중앙 (A안) — 배너 84px 불변
 *   자동 루프 5초 유지
 *
 * ─ 피그마 확정값 ─────────────────────────────────────────────────────────
 *   height 84px / 벨 32px / 타이틀 700 / 일정 400 / line-height 32px
 *   구분선(1단): 1px×14px rgba(0,0,0,0.20) / 자세히보기 120×40px #00C853
 *
 * ─ 공지 닫기 정책 ──────────────────────────────────────────────────────────
 *   세션마다 항상 노출: X 버튼 클릭 시 React state(dismissed)에만 저장
 *   → 새로고침·재방문 시 항상 다시 노출됨
 *   → localStorage/sessionStorage 미사용 (개발자 전달 환경에서 항상 재노출 목적)
 *   [실서비스 전환 시] dismissed 상태를 localStorage 또는 서버 저장으로 교체 필요
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Notice } from '@/types/notice';

/* ── 상수 ───────────────────────────────────────────────────────────────── */
const CAROUSEL_INTERVAL_MS = 5000;
const TITLE_LINE_HEIGHT_PX = 32;
const BANNER_HEIGHT        = 84;   // 절대 변경 금지
const BELL_SIZE            = 32;   // 피그마 확정

// 우측 고정: 자세히보기(120)+gap(8)+X버튼(24+16패딩)+paddingRight(16)
const RIGHT_FIXED_PX = 16 + 120 + 8 + 56 + 16; // = 216

// 폰트: 피그마 20px 기준, 최소 16px
const FONT_BASE_WIDTH = 1200;
const FONT_BASE_SIZE  = 20;
const FONT_MIN_SIZE   = 16;

/* ── 타이틀 강조 렌더링 ─────────────────────────────────────────────────── */
function HighlightTitle({ title, keywords = [], fontSize, style }: {
  title: string; keywords?: string[]; fontSize: string; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
    fontWeight: 700, fontSize,
    lineHeight: `${TITLE_LINE_HEIGHT_PX}px`,
    letterSpacing: '0.20px',
    wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal',
    ...style,
  };
  if (!keywords.length) return <span style={{ ...base, color: 'white' }}>{title}</span>;
  const pattern = new RegExp(
    `(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g'
  );
  const parts = title.split(pattern);
  return (
    <span style={base}>
      {parts.map((part, i) =>
        keywords.includes(part)
          ? <span key={i} style={{ color: '#FFEB3B' }}>{part}</span>
          : <span key={i} style={{ color: 'white' }}>{part}</span>
      )}
    </span>
  );
}

/* ── 캐러셀 도트 A안: 배너 하단 외부 ───────────────────────────────────── */
function CarouselDotsExternal({ count, current }: { count: number; current: number }) {
  if (count <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 16 : 6, height: 6, borderRadius: 3,
          background: i === current ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.18)',
          transition: 'all 0.25s',
        }} />
      ))}
    </div>
  );
}

/* ── Props ──────────────────────────────────────────────────────────────── */
interface NoticeBannerProps {
  notices: Notice[];
  isMobile?: boolean;
}

/* ── 메인 컴포넌트 ───────────────────────────────────────────────────────── */
export function NoticeBanner({ notices, isMobile = false }: NoticeBannerProps) {
  const router = useRouter();

  // 공지 닫기: React state만 사용 — 새로고침/재방문 시 항상 재노출
  // [실서비스 전환 시] localStorage 또는 서버 저장 방식으로 교체 필요
  const [dismissed, setDismissed]         = useState<string[]>([]);
  const [current, setCurrent]             = useState(0);
  const [titleOverflow, setTitleOverflow] = useState(false);
  const [fontSize, setFontSize]           = useState(`${FONT_BASE_SIZE}px`);

  const measureRef   = useRef<HTMLDivElement>(null);
  const bannerRef    = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef       = useRef<number | null>(null);

  const visible = notices.filter((n) => n.isActive && !dismissed.includes(n.id));

  useEffect(() => {
    if (visible.length === 0) return;
    setCurrent((prev) => prev % visible.length);
  }, [visible.length]);

  const noticeId = visible[current]?.id ?? '';

  useEffect(() => {
    if (isMobile || !measureRef.current || !bannerRef.current) return;

    const check = () => {
      const bw = bannerRef.current?.getBoundingClientRect().width ?? 0;
      if (!bw || !measureRef.current) return;

      // 타이틀 가용너비
      const leftOffset = 32 + BELL_SIZE + 12 + 44 + 12; // 132
      const avail = bw - leftOffset - RIGHT_FIXED_PX;

      // 폰트 크기: 가용너비 기준 비례, 최소 FONT_MIN_SIZE
      const computed = Math.max(FONT_MIN_SIZE, Math.round(FONT_BASE_SIZE * Math.min(1, avail / FONT_BASE_WIDTH)));
      setFontSize(`${computed}px`);

      if (avail > 0) measureRef.current.style.width = `${avail}px`;

      // title + 일정 합산 높이로 2단 판단
      const next = (measureRef.current?.scrollHeight ?? 0) > TITLE_LINE_HEIGHT_PX * 1.5;
      setTitleOverflow((prev) => (prev === next ? prev : next));
    };

    const obs = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(check);
    });
    obs.observe(bannerRef.current);
    rafRef.current = requestAnimationFrame(check);
    return () => { obs.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, noticeId]);

  /* ── 자동 루프 5초 ─────────────────────────────────────────────────────── */
  const startTimer = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (visible.length <= 1) return;
    autoTimerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % Math.max(visible.length, 1));
    }, CAROUSEL_INTERVAL_MS);
  }, [visible.length]);

  useEffect(() => {
    startTimer();
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, [startTimer]);

  // 닫기: state에만 추가 (localStorage 미사용 — 세션마다 재노출)
  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => [...new Set([...prev, id])]);
  }, []);
  const handleDetail = useCallback((id: string) => { router.push(`/notice/${id}`); }, [router]);

  if (visible.length === 0) return null;

  const notice     = visible[current];
  const gradientBg = 'linear-gradient(135deg, #1763FD 0%, #008B76 100%)';

  const scheduleStyle: React.CSSProperties = {
    color: 'white', fontSize,
    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
    fontWeight: 400, lineHeight: `${TITLE_LINE_HEIGHT_PX}px`,
    letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0,
  };

  const StatusBadge = () => (
    <span style={{
      background: 'white', borderRadius: 8, padding: '4px 8px', flexShrink: 0,
      fontSize: 12, fontWeight: 700,
      fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
      color: '#606060', lineHeight: '14px', whiteSpace: 'nowrap',
    }}>{notice.status}</span>
  );

  const DetailButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button type="button" onClick={() => handleDetail(notice.id)} style={{
      width: fullWidth ? '100%' : 120, height: 40,
      background: '#00C853', border: 'none', borderRadius: 8,
      cursor: 'pointer', flexShrink: 0, fontSize: 14, fontWeight: 700,
      fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: 'white',
    }}>자세히 보기</button>
  );

  const CloseButton = ({ size = 20 }: { size?: number }) => (
    <button type="button" onClick={() => handleDismiss(notice.id)} aria-label="공지 닫기" style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );

  /* 벨: 32px flex 중앙 */
  const BellIcon = () => (
    <span style={{
      fontSize: BELL_SIZE, width: BELL_SIZE, height: BELL_SIZE, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
    }}>🔔</span>
  );

  return (
    <div style={{
      paddingLeft:  isMobile ? 16 : 24,
      paddingRight: isMobile ? 16 : 24,
      paddingTop:   isMobile ? 20 : 24,
    }}>
      {isMobile ? (
        /* ── 모바일 ─────────────────────────────────────────────────── */
        <div style={{
          background: gradientBg, borderRadius: 8, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <StatusBadge />
            </div>
            <CloseButton size={20} />
          </div>
          <span style={{
            fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
            fontWeight: 700, fontSize: 16, lineHeight: '28px',
            letterSpacing: '0.20px', wordBreak: 'keep-all', color: 'white',
          }}>{notice.title}</span>
          <span style={{
            color: 'rgba(255,255,255,0.85)', fontSize: 14,
            fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
            fontWeight: 400, lineHeight: '20px', letterSpacing: '0.20px',
          }}>{notice.schedule}</span>
          <DetailButton fullWidth />
        </div>
      ) : (
        /* ── 웹 배너 wrapper ─────────────────────────────────────────── */
        <div>
          {/* 배너 본체: height 84px 강제 고정 */}
          <div
            ref={bannerRef}
            style={{
              background: gradientBg,
              borderRadius: 8,
              height: BANNER_HEIGHT,
              minHeight: BANNER_HEIGHT,
              maxHeight: BANNER_HEIGHT,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
              paddingLeft: 32,
              paddingRight: 16,
              boxSizing: 'border-box',
            }}
          >
            {/* 숨김 측정 레이어: title+일정 합산 높이 측정 */}
            <div
              ref={measureRef}
              aria-hidden="true"
              style={{
                position: 'absolute', visibility: 'hidden',
                pointerEvents: 'none', top: 0, left: 0, width: 0,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}>
                <HighlightTitle title={notice.title} keywords={notice.markKeywords} fontSize={fontSize} />
                <span style={{ ...scheduleStyle }}>{notice.schedule}</span>
              </div>
            </div>

            {/* 벨 아이콘 */}
            <BellIcon />

            {/* gap 12 */}
            <div style={{ width: 12, flexShrink: 0 }} />

            {/* 배지 */}
            <StatusBadge />

            {/* gap 12 */}
            <div style={{ width: 12, flexShrink: 0 }} />

            {/* 콘텐츠 블록: 타이틀 + 일정 (1단 or 2단) */}
            <div style={{
              flex: 1, minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
              overflow: 'hidden',
            }}>

              {/* 1단: [타이틀] | [일정] 한 행 */}
              {!titleOverflow && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <HighlightTitle
                      title={notice.title}
                      keywords={notice.markKeywords}
                      fontSize={fontSize}
                    />
                  </div>
                  {/* 구분선 + 일정 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.20)', flexShrink: 0 }} />
                    <span style={scheduleStyle}>{notice.schedule}</span>
                  </div>
                </div>
              )}

              {/* 2단: 타이틀 위 / 일정 아래 */}
              {titleOverflow && (
                <>
                  <div style={{ minWidth: 0 }}>
                    <HighlightTitle
                      title={notice.title}
                      keywords={notice.markKeywords}
                      fontSize={fontSize}
                    />
                  </div>
                  <span style={scheduleStyle}>{notice.schedule}</span>
                </>
              )}

            </div>

            {/* gap 16 */}
            <div style={{ width: 16, flexShrink: 0 }} />

            {/* 자세히보기 버튼 */}
            <DetailButton />

            {/* gap 8 */}
            <div style={{ width: 8, flexShrink: 0 }} />

            {/* X 버튼 */}
            <CloseButton size={24} />

          </div>

          {/* 캐러셀 도트 A안: 배너 하단 외부 8px 중앙 */}
          <CarouselDotsExternal count={visible.length} current={current} />
        </div>
      )}
    </div>
  );
}
