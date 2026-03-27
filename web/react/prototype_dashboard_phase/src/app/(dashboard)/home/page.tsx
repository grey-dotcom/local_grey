/**
 * @file app/(dashboard)/home/page.tsx
 * @description 대시보드 메인 페이지
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NoticeBanner } from '@/components/notice/NoticeBanner';
import { KpiCards } from '@/components/dashboard/KpiCards';
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
  // isReady: 첫 측정 완료 전까지 opacity:0 유지 — BP 깨뷁임 방지
  const [isReady, setIsReady] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

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
      // main 측정 완료 시점에 ready 설정 — 이 시점에 BP가 확정되어 깨뷁임 없이 코드는 바로 내려옴
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

  // [Phase 1] 피드/처리필요/클레임 위젯 탭 — Phase 2 이후 활성화 예정

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
        {/* KPI (POLICY §14: kpi ON일 때만 렌더 / POLICY §14-6: 하위 4종 개별 ON/OFF) */}
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

        {/* [Phase 1] 변경사항 피드 / 처리필요 / 클레임 위젯 — Phase 2 이후 추가 예정 */}
      </div>

    </div>
  );
}
