/**
 * @file app/(dashboard)/home/page.tsx
 * @description 대시보드 메인 페이지 — Phase 1 배포 전용 (KPI만 노출)
 * @phase 1
 * @note FeedWidget / IssueWidget / ClaimWidget / NoticeBanner 은 Phase 1 에서 제외
 *       NoticeBanner 76차 제거 — 나중에 필요 시 추가 예정
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { WidgetSelector } from '@/components/dashboard/WidgetSelector';
import { useLayoutContext } from '../layoutContext';

const MOBILE_BP     = 960;
const SINGLE_COL_BP = 717;
const GNB_W         = 64;
const SUB_W         = 260;
const PAD_DESKTOP   = 48;
const PAD_MOBILE    = 32;
const MIN_1COL_CHILDREN = 1280;
const MIN_2COL_CHILDREN = 685;

function calcChildrenWidth(viewportW: number, subOpen: boolean): number {
  const sidebar = subOpen ? GNB_W + SUB_W : GNB_W;
  return viewportW - sidebar - PAD_DESKTOP;
}

function calcMobileChildrenWidth(viewportW: number): number {
  return viewportW - PAD_MOBILE;
}

export default function HomePage() {
  const [isMobile, setIsMobile]   = useState(false);
  const [viewport, setViewport]   = useState(0);
  const [childrenW, setChildrenW] = useState(0);
  const [isReady, setIsReady]     = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const { widgetVisibility, setWidgetVisibility } = useLayoutContext();
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [widgetAnchorRect, setWidgetAnchorRect]     = useState<DOMRect | null>(null);

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
        for (const entry of entries) { setChildrenW(Math.round(entry.contentRect.width - PAD_DESKTOP)); }
      });
      mainObserver.observe(main);
      setChildrenW(Math.round(main.getBoundingClientRect().width - PAD_DESKTOP));
      setIsReady(true);
    };
    const timer = setTimeout(connectMain, 0);
    return () => { vwObserver.disconnect(); mainObserver?.disconnect(); clearTimeout(timer); };
  }, []);

  const effectiveChildrenW = isMobile ? calcMobileChildrenWidth(viewport) : childrenW;
  const desktopCols: 3 | 2 | 1 = (() => {
    if (!isMobile) return effectiveChildrenW >= MIN_1COL_CHILDREN ? 3 : 2;
    return effectiveChildrenW >= MIN_2COL_CHILDREN ? 2 : 1;
  })();

  const handleWidgetSettingClick = (rect: DOMRect) => {
    setWidgetAnchorRect(rect);
    setWidgetSelectorOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-full" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.15s ease' }}>
      {!isMobile && <DashboardHeader onWidgetSettingClick={handleWidgetSettingClick} />}
      <WidgetSelector
        isOpen={widgetSelectorOpen}
        onClose={() => setWidgetSelectorOpen(false)}
        visibility={widgetVisibility}
        onChange={setWidgetVisibility}
        anchorRect={widgetAnchorRect}
      />
      <div className="flex flex-col gap-6" style={{ paddingTop: isMobile ? 20 : 40, paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24, paddingBottom: isMobile ? 16 : 40, flex: 1, overflowY: 'auto' }}>
        {widgetVisibility.kpi && (
          <KpiCards
            isMobile={isMobile}
            desktopCols={desktopCols}
            kpiVisibility={{ kpiTask: widgetVisibility.kpiTask, kpiIssue: widgetVisibility.kpiIssue, kpiClaim: widgetVisibility.kpiClaim, kpiRate: widgetVisibility.kpiRate }}
          />
        )}
        {/* Phase 1: FeedWidget / IssueWidget / ClaimWidget / NoticeBanner 미포함 */}
      </div>
    </div>
  );
}
