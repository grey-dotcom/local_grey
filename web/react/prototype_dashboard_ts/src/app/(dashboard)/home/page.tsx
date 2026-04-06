/**
 * @file app/(dashboard)/home/page.tsx
 * @description 대시보드 메인 페이지
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NoticeBanner } from '@/components/notice/NoticeBanner';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FeedWidget } from '@/components/dashboard/FeedWidget';
import { IssueWidget } from '@/components/dashboard/IssueWidget';
import { ClaimWidget } from '@/components/dashboard/ClaimWidget';
import { WidgetSelector } from '@/components/dashboard/WidgetSelector';
import { useLayoutContext } from '../layoutContext';
import type { Notice } from '@/types/notice';

// MOBILE_BP: 41차 확정 — 사이드바 BP 제외, 칠드런만 기준
// = 웹 위젯(416px)×2 + gap(16) + GNB(64) + PAD(48) = 960px
const MOBILE_BP     = 960;
const SINGLE_COL_BP = 717; // 모바일 위젯(327)×2 + gap(16) + pad(48) = 718 ≈ 717

const GAP         = 16;
const GNB_W       = 64;
const SUB_W       = 260;
const PAD_DESKTOP = 48;
const PAD_MOBILE  = 32;

// ⚠️ 연관 맥락 전체 검토 없이 임의 변경 금지 (POLICY § 3-2, HANDOVER Step 5)
const MIN_1COL_CHILDREN = 1280; // 웹 3열 최소: 416×3 + gap×2 = 1280
const MIN_2COL_CHILDREN = 685;  // 모바일 2열 최소: 717 - 32 = 685

function calcChildrenWidth(viewportW: number, subOpen: boolean): number {
  const sidebar = subOpen ? GNB_W + SUB_W : GNB_W;
  return viewportW - sidebar - PAD_DESKTOP;
}

function calcMobileChildrenWidth(viewportW: number): number {
  return viewportW - PAD_MOBILE;
}

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState(0);
  const [childrenW, setChildrenW] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [singleColTab, setSingleColTab] = useState<'feed' | 'issue' | 'claim'>('feed');
  const [notices, setNotices] = useState<Notice[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  // 65차: 세그먼트 탭 카운트 실시간 관리 — 위젯 onCountChange 콜백으로 수신
  const [feedCount,  setFeedCount]  = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);

  const handleFeedCount  = useCallback((n: number) => setFeedCount(n),  []);
  const handleIssueCount = useCallback((n: number) => setIssueCount(n), []);
  const handleClaimCount = useCallback((n: number) => setClaimCount(n), []);

  // POLICY §14: widgetVisibility는 layoutContext에서 가져옴 (MobileHeader와 공유)
  const { widgetVisibility, setWidgetVisibility } = useLayoutContext();
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [widgetAnchorRect, setWidgetAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const vwObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setViewport(w);
        setIsMobile(w <= MOBILE_BP);
      }
    });
    vwObserver.observe(document.documentElement);
    setViewport(window.innerWidth);
    setIsMobile(window.innerWidth <= MOBILE_BP);

    let mainObserver: ResizeObserver | null = null;
    const connectMain = () => {
      const main = document.querySelector('main');
      if (!main) return;
      mainRef.current = main;
      mainObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setChildrenW(Math.round(entry.contentRect.width - PAD_DESKTOP));
        }
      });
      mainObserver.observe(main);
      setChildrenW(Math.round(main.getBoundingClientRect().width - PAD_DESKTOP));
      setIsReady(true);
    };
    const timer = setTimeout(connectMain, 0);
    return () => { vwObserver.disconnect(); mainObserver?.disconnect(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
    if (!useMock) return;
    import('@/mocks/notices.json').then((mod) => setNotices(mod.default as Notice[]));
  }, []);

  const effectiveChildrenW = isMobile ? calcMobileChildrenWidth(viewport) : childrenW;
  const desktopCols: 3 | 2 | 1 = (() => {
    if (!isMobile) return effectiveChildrenW >= MIN_1COL_CHILDREN ? 3 : 2;
    return effectiveChildrenW >= MIN_2COL_CHILDREN ? 2 : 1;
  })();

  const isSingleColumnActual = (viewport <= SINGLE_COL_BP) || (isMobile && desktopCols === 1);

  const handleWidgetSettingClick = (rect: DOMRect) => {
    setWidgetAnchorRect(rect);
    setWidgetSelectorOpen((prev) => !prev);
  };

  const visibleTabs = (['feed', 'issue', 'claim'] as const).filter((k) => widgetVisibility[k]);
  const effectiveSingleColTab = visibleTabs.includes(singleColTab) ? singleColTab : (visibleTabs[0] ?? 'feed');

  // 65차: 세그먼트 탭 카운트 — 위젯별 onCountChange에서 수신한 실시간 값 사용
  const segTabCount = (key: 'feed' | 'issue' | 'claim') => {
    if (key === 'feed')  return feedCount;
    if (key === 'issue') return issueCount;
    return claimCount;
  };

  return (
    <div className="flex flex-col min-h-full" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.15s ease' }}>

      {!isMobile && (
        <DashboardHeader onWidgetSettingClick={handleWidgetSettingClick} />
      )}

      <WidgetSelector
        isOpen={widgetSelectorOpen}
        onClose={() => setWidgetSelectorOpen(false)}
        visibility={widgetVisibility}
        onChange={setWidgetVisibility}
        anchorRect={widgetAnchorRect}
      />

      <NoticeBanner notices={notices} isMobile={isMobile} />

      <div
        className="flex flex-col gap-6"
        style={{
          paddingTop: isMobile ? 20 : 40,
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24,
          paddingBottom: isMobile ? 16 : 40,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {/* KPI */}
        {widgetVisibility.kpi && (
          <KpiCards
            isMobile={isMobile}
            desktopCols={desktopCols}
            kpiVisibility={{
              kpiTask:  widgetVisibility.kpiTask,
              kpiIssue: widgetVisibility.kpiIssue,
              kpiClaim: widgetVisibility.kpiClaim,
              kpiRate:  widgetVisibility.kpiRate,
            }}
          />
        )}

        {/* 모든 위젯 OFF 안내 */}
        {!widgetVisibility.feed && !widgetVisibility.issue && !widgetVisibility.claim && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80, gap: 12 }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>
              선택한 위젯이 없습니다. 위젯 설정에서 위젯을 선택해 주세요.
            </span>
            <button
              type="button"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                handleWidgetSettingClick(rect);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2', fontSize: 14, fontWeight: 500, textDecoration: 'underline', padding: 0 }}
            >
              위젯 설정 열기
            </button>
          </div>
        )}

        {isSingleColumnActual ? (
          /* 1열 + 세그먼트 탭 (POLICY §3-7) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 세그먼트 탭 — 65차: 하드코딩 카운트 → onCountChange 실시간 값으로 교체 */}
            {visibleTabs.length > 0 && (
              <div style={{ height: 40, borderRadius: 8, overflow: 'hidden', display: 'flex', width: '100%' }}>
                {visibleTabs.map((key, idx) => {
                  const isActive = effectiveSingleColTab === key;
                  const label    = key === 'feed' ? '변경사항 피드' : key === 'issue' ? '처리필요' : '클레임';
                  const count    = segTabCount(key);
                  const displayCount = count > 99 ? '99+' : count;
                  const isFirst  = idx === 0;
                  const isLast   = idx === visibleTabs.length - 1;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSingleColTab(key)}
                      style={{
                        flex: 1, height: 40, paddingInline: 8, paddingBlock: 8,
                        background: isActive ? '#212121' : 'white',
                        border: 'none',
                        borderTop:    isActive ? 'none' : '1px solid #E0E0E0',
                        borderBottom: isActive ? 'none' : '1px solid #E0E0E0',
                        borderRight:  isLast  ? (isActive ? 'none' : '1px solid #E0E0E0') : '1px solid #E0E0E0',
                        borderLeft:   isFirst ? (isActive ? 'none' : '1px solid #E0E0E0') : 'none',
                        borderTopLeftRadius:     isFirst ? 8 : 0,
                        borderBottomLeftRadius:  isFirst ? 8 : 0,
                        borderTopRightRadius:    isLast  ? 8 : 0,
                        borderBottomRightRadius: isLast  ? 8 : 0,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '20px', letterSpacing: '0.20px', color: isActive ? 'white' : '#757575', whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                      <span style={{ width: 20, height: 20, borderRadius: 14, background: isActive ? 'white' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.87)', paddingBottom: 1, flexShrink: 0 }}>
                        {displayCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 탭 콘텐츠 — onCountChange로 세그먼트 탭 카운트 실시간 수신 */}
            {effectiveSingleColTab === 'feed'  && widgetVisibility.feed  && (
              <FeedWidget  isMobile isSingleColumn desktopCols={1} onCountChange={handleFeedCount} />
            )}
            {effectiveSingleColTab === 'issue' && widgetVisibility.issue && (
              <IssueWidget isMobile isSingleColumn desktopCols={1} onCountChange={handleIssueCount} />
            )}
            {effectiveSingleColTab === 'claim' && widgetVisibility.claim && (
              <ClaimWidget isMobile isSingleColumn desktopCols={1} onCountChange={handleClaimCount} />
            )}
          </div>

        ) : (
          /* 그리드 레이아웃 */
          <>
            {desktopCols === 3 ? (
              <div style={{ display: 'flex', gap: GAP, width: '100%', alignItems: 'flex-start' }}>
                {widgetVisibility.feed  && <div style={{ flex: '1 1 0', minWidth: 0 }}><FeedWidget  isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} /></div>}
                {widgetVisibility.issue && <div style={{ flex: '1 1 0', minWidth: 0 }}><IssueWidget isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} /></div>}
                {widgetVisibility.claim && <div style={{ flex: '1 1 0', minWidth: 0 }}><ClaimWidget isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} /></div>}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: GAP, width: '100%', alignItems: 'flex-start' }}>
                {(widgetVisibility.feed || widgetVisibility.claim) && (
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>
                    {widgetVisibility.feed  && <FeedWidget  isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} />}
                    {widgetVisibility.claim && <ClaimWidget isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} />}
                  </div>
                )}
                {widgetVisibility.issue && (
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>
                    <IssueWidget isMobile={isMobile} isSingleColumn={false} desktopCols={desktopCols} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
