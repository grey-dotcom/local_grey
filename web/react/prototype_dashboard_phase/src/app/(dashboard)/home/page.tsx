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

  // visible 탭 목록 (POLICY §14-3: OFF 위젯 탭에서도 제거)
  // singleColTab이 OFF된 경우 첫 번째 visible 탭으로 교정

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

        {/* Feed / Issue / Claim (POLICY §14-3: OFF 위젯 제거, 나머지 당겨서 채움)
         * 모든 위젯 OFF 시 안내 문구 표시 (Phase 1 정책서 확정) */}
        {/* 모든 피드 위젯 OFF 상태 안내 */}
        {!widgetVisibility.feed && !widgetVisibility.issue && !widgetVisibility.claim && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            paddingTop: 80, paddingBottom: 80, gap: 12,
          }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>
              선택한 위젯이 없습니다. 위젯 설정에서 위젯을 선택해 주세요.
            </span>
            <button
              type="button"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                handleWidgetSettingClick(rect);
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#1976D2', fontSize: 14, fontWeight: 500,
                textDecoration: 'underline', padding: 0,
              }}
            >
              위젯 설정 열기
            </button>
          </div>
        )}
        {isSingleColumnActual ? (
          /* 1열 + 세그먼트 탭 (POLICY §3-7) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ height: 40, borderRadius: 8, overflow: 'hidden', display: 'flex', width: '100%' }}>
                  const label = key === 'feed' ? '변경사항 피드' : key === 'issue' ? '처리필요' : '클레임';
                  const count = key === 'feed' ? 7 : key === 'issue' ? 2 : 1; // TODO: 실제 카운트
                  const isFirst = idx === 0;
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
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 탭 콘텐츠 */}
          </div>

        ) : (
          /* 그리드 레이아웃 (POLICY §3-8 + §14-3: OFF 위젯 제거, 나머지 당겨서 채움) */
          <>
            {desktopCols === 3 ? (
              /* 웹 3열
               * [DOM 구조 설계 이유]
               * 각 위젯을 <div style={{ flex:'1 1 0', minWidth:0 }}>로 감싼 이유:
               *     자체 루트 div가 'width:100%'로 고정되어 있음.
               *   - flex-item 역할(flex:1 1 0, minWidth:0)을 위젯 내부에 넣으면
               *     위젯이 단독으로 쓰일 때와 그리드 안에서 쓰일 때 스타일이 달라져
               *     컴포넌트 재사용성이 떨어짐.
               *   - wrapper div 하나로 flex-item 역할을 분리하면 위젯은 항상
               *     '컨테이너를 꽉 채우는' 단순한 역할만 유지할 수 있음.
               * [리팩토링 시점] 실 서비스 연동 시 위젯에 flex prop을 직접 받도록
               *   수정하면 이 wrapper div를 제거할 수 있음. (FE 검토 의견 참고) */
              <div style={{ display: 'flex', gap: GAP, width: '100%', alignItems: 'flex-start' }}>
              </div>
            ) : (
              /* 웹·모바일 2열 (POLICY §3-8, 40차 확정)
               * 좌 컬럼: Feed → Claim 세로 / 우 컬럼: Issue
               * OFF 시 해당 위젯 제거, 나머지가 앞으로 당겨짐
               *
               * [DOM 구조 설계 이유 — 우 컬럼 wrapper div 유지 이유]
               *   보이지만, HANDOVER Step 3에 '4번 위젯 예정' 항목이 있음.
               *   gap과 flexDirection:column 역할을 담당해야 하므로 미리 유지.
               *   지금 제거하면 4번 위젯 추가 시 다시 wrapper를 넣어야 함.
               * [리팩토링 시점] 4번 위젯이 확정되지 않거나 다른 레이아웃으로
               *   결정되면 그 시점에 재검토. */
              <div style={{ display: 'flex', gap: GAP, width: '100%', alignItems: 'flex-start' }}>
                {(widgetVisibility.feed || widgetVisibility.claim) && (
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>
                  </div>
                )}
                {widgetVisibility.issue && (
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>
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
