/**
 * @file components/notice/NoticeBanner.tsx
 * @description 대시보드 공지사항 배너 컴포넌트
 *
 * ⚠️ 76차: 자동 루프(5초 캐러셀) 제거 — 나중에 필요 시 추가 예정
 *   공지가 여러 개여도 첫 번째 공지만 고정 표시.
 *   CarouselDotsExternal, startTimer, autoTimerRef 제거.
 *
 * ─ 웹 배너 레이아웃 정책 (확정) ──────────────────────────────────────────
 *   배너 height: 84px 강제 고정
 *   [32px] [🔔 32px] [gap 12] [배지] [gap 12] [타이틀/일정 flex:1] [gap 16] [자세히보기 120px] [gap 8] [X] [16px]
 *
 * ─ 공지 닫기 정책 ──────────────────────────────────────────────────────────
 *   X 버튼 클릭 시 React state(dismissed)에만 저장 — 세션마다 재노출
 *   [실서비스 전환 시] localStorage 또는 서버 저장으로 교체 필요
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Notice } from '@/types/notice';

const TITLE_LINE_HEIGHT_PX = 32;
const BANNER_HEIGHT        = 84;
const BELL_SIZE            = 32;
const RIGHT_FIXED_PX       = 16 + 120 + 8 + 56 + 16;
const FONT_BASE_WIDTH      = 1200;
const FONT_BASE_SIZE       = 20;
const FONT_MIN_SIZE        = 16;

function HighlightTitle({ title, keywords = [], fontSize, style }: {
  title: string; keywords?: string[]; fontSize: string; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
    fontWeight: 700, fontSize, lineHeight: `${TITLE_LINE_HEIGHT_PX}px`,
    letterSpacing: '0.20px', wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal',
    ...style,
  };
  if (!keywords.length) return <span style={{ ...base, color: 'white' }}>{title}</span>;
  const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = title.split(pattern);
  return (
    <span style={base}>
      {parts.map((part, i) => keywords.includes(part) ? <span key={i} style={{ color: '#FFEB3B' }}>{part}</span> : <span key={i} style={{ color: 'white' }}>{part}</span>)}
    </span>
  );
}

interface NoticeBannerProps {
  notices: Notice[];
  isMobile?: boolean;
}

export function NoticeBanner({ notices, isMobile = false }: NoticeBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed]         = useState<string[]>([]);
  const [titleOverflow, setTitleOverflow] = useState(false);
  const [fontSize, setFontSize]           = useState(`${FONT_BASE_SIZE}px`);

  const measureRef = useRef<HTMLDivElement>(null);
  const bannerRef  = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number | null>(null);

  const visible = notices.filter((n) => n.isActive && !dismissed.includes(n.id));
  const notice  = visible[0]; // 76차: 루프 제거 — 항상 첫 번째만 표시

  useEffect(() => {
    if (isMobile || !measureRef.current || !bannerRef.current || !notice) return;
    const check = () => {
      const bw = bannerRef.current?.getBoundingClientRect().width ?? 0;
      if (!bw || !measureRef.current) return;
      const leftOffset = 32 + BELL_SIZE + 12 + 44 + 12;
      const avail      = bw - leftOffset - RIGHT_FIXED_PX;
      const computed   = Math.max(FONT_MIN_SIZE, Math.round(FONT_BASE_SIZE * Math.min(1, avail / FONT_BASE_WIDTH)));
      setFontSize(`${computed}px`);
      if (avail > 0) measureRef.current.style.width = `${avail}px`;
      const next = (measureRef.current?.scrollHeight ?? 0) > TITLE_LINE_HEIGHT_PX * 1.5;
      setTitleOverflow((prev) => (prev === next ? prev : next));
    };
    const obs = new ResizeObserver(() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(check); });
    obs.observe(bannerRef.current);
    rafRef.current = requestAnimationFrame(check);
    return () => { obs.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, notice?.id]);

  const handleDismiss = useCallback((id: string) => { setDismissed((prev) => [...new Set([...prev, id])]); }, []);
  const handleDetail  = useCallback((id: string) => { router.push(`/notice/${id}`); }, [router]);

  if (!notice) return null;

  const gradientBg   = 'linear-gradient(135deg, #1763FD 0%, #008B76 100%)';
  const scheduleStyle: React.CSSProperties = { color: 'white', fontSize, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: 400, lineHeight: `${TITLE_LINE_HEIGHT_PX}px`, letterSpacing: '0.20px', whiteSpace: 'nowrap', flexShrink: 0 };

  const StatusBadge  = () => <span style={{ background: 'white', borderRadius: 8, padding: '4px 8px', flexShrink: 0, fontSize: 12, fontWeight: 700, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: '#606060', lineHeight: '14px', whiteSpace: 'nowrap' }}>{notice.status}</span>;
  const DetailButton = ({ fullWidth = false }: { fullWidth?: boolean }) => <button type="button" onClick={() => handleDetail(notice.id)} style={{ width: fullWidth ? '100%' : 120, height: 40, background: '#00C853', border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontSize: 14, fontWeight: 700, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: 'white' }}>자세히 보기</button>;
  const CloseButton  = ({ size = 20 }: { size?: number }) => <button type="button" onClick={() => handleDismiss(notice.id)} aria-label="공지 닫기" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg></button>;
  const BellIcon     = () => <span style={{ fontSize: BELL_SIZE, width: BELL_SIZE, height: BELL_SIZE, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>🔔</span>;

  return (
    <div style={{ paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24, paddingTop: isMobile ? 20 : 24 }}>
      {isMobile ? (
        <div style={{ background: gradientBg, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>🔔</span><StatusBadge /></div>
            <CloseButton size={20} />
          </div>
          <span style={{ fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: '28px', letterSpacing: '0.20px', wordBreak: 'keep-all', color: 'white' }}>{notice.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: 400, lineHeight: '20px', letterSpacing: '0.20px' }}>{notice.schedule}</span>
          <DetailButton fullWidth />
        </div>
      ) : (
        <div>
          <div ref={bannerRef} style={{ background: gradientBg, borderRadius: 8, height: BANNER_HEIGHT, minHeight: BANNER_HEIGHT, maxHeight: BANNER_HEIGHT, display: 'flex', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative', paddingLeft: 32, paddingRight: 16, boxSizing: 'border-box' }}>
            <div ref={measureRef} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', top: 0, left: 0, width: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}>
                <HighlightTitle title={notice.title} keywords={notice.markKeywords} fontSize={fontSize} />
                <span style={scheduleStyle}>{notice.schedule}</span>
              </div>
            </div>
            <BellIcon />
            <div style={{ width: 12, flexShrink: 0 }} />
            <StatusBadge />
            <div style={{ width: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, overflow: 'hidden' }}>
              {!titleOverflow && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><HighlightTitle title={notice.title} keywords={notice.markKeywords} fontSize={fontSize} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.20)', flexShrink: 0 }} />
                    <span style={scheduleStyle}>{notice.schedule}</span>
                  </div>
                </div>
              )}
              {titleOverflow && (
                <><div style={{ minWidth: 0 }}><HighlightTitle title={notice.title} keywords={notice.markKeywords} fontSize={fontSize} /></div><span style={scheduleStyle}>{notice.schedule}</span></>
              )}
            </div>
            <div style={{ width: 16, flexShrink: 0 }} />
            <DetailButton />
            <div style={{ width: 8, flexShrink: 0 }} />
            <CloseButton size={24} />
          </div>
        </div>
      )}
    </div>
  );
}
