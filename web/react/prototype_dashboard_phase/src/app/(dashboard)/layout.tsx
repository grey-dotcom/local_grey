/**
 * @file app/(dashboard)/layout.tsx
 * @description 대시보드 AppShell — 반응형 포함
 *
 * ─ 레이아웃 구조 ─────────────────────────────────────────────────────────
 *
 *   [데스크탑] viewport > 1,061px
 *   ┌──────────────────────────────────────────────────┐
 *   │                    TopBar                        │ ← 검정, 계정 레이어
 *   ├──────┬──────────┬───────────────────────────────┤
 *   │ GNB  │   Sub    │                               │
 *   │ 64px │ Sidebar  │          children             │
 *   │      │  260px   │                               │
 *   └──────┴──────────┴───────────────────────────────┘
 *
 *   [모바일] viewport ≤ 1,061px
 *   ┌──────────────────────────────────────────────────┐
 *   │  MobileHeader  (대시보드 타이틀 + 햄버거)        │ ← 흰색
 *   ├──────────────────────────────────────────────────┤
 *   │                                                  │
 *   │               children (전체 너비)               │
 *   │                                                  │
 *   └──────────────────────────────────────────────────┘
 *   햄버거 → 드로어 (미확인 건 찾기, 지점 선택, 메모 남기기, 위젯 설정)
 *
 * ─ 반응형 기준 ───────────────────────────────────────────────────────────
 *   MOBILE_BP = 1,061px
 *   - 모바일 위젯(327px)×3 + gap×2 + pad(48) = 1,061
 *   - ResizeObserver로 감지 (SSR 안전: window 체크 후 초기값 설정)
 *
 * ─ Sub Sidebar collapse 정책 ─────────────────────────────────────────────
 *   데스크탑 구간에서:
 *   - GNB의 ≪ 버튼 → SubSidebar 수동 토글
 *   모바일 전환 시:
 *   - SubSidebar 자동 숨김 (sidebarOpen 강제 false)
 *   - 데스크탑 복귀 시 sidebarOpen 복원 (이전 상태 유지)
 *
 * ─ 워크스페이스 / 지점 로드 ─────────────────────────────────────────────
 *   mock: workspaces.json + roomGroups.json
 *   roomGroups는 현재 staffAuth.workspaceId 기준으로 필터링하여 로드
 *   [BE 연동 가이드]
 *   - GET /shared/v1/workspaces  → setWorkspaces
 *   - GET /shared/v1/room-groups?workspaceId={id} → setRoomGroups
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BLOCKED_AUTHORITIES } from '@/config/rbac.config';
import { GNBSidebar } from '@/components/layout/GNBSidebar';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { LayoutContext } from './layoutContext';
import { DEFAULT_WIDGET_VISIBILITY } from '@/components/dashboard/WidgetSelector';
import type { WidgetVisibility } from '@/components/dashboard/WidgetSelector';

/** 모바일 전환 기준 (px) — 41차 확정
 *  사이드바(Sub)는 BP 기준에 포함하지 않음 — 칠드런만 기준
 *  = 웹 위젯(416px)×2 + gap(16) + GNB(64) + PAD(48) = 960px
 *  이 값 이하가 되면 TopBar·GNB·SubSidebar를 숨기고 MobileHeader 표시
 */
// WEB_2COL_MIN_CHILDREN: Sub 열렸을 때 칠드런 최소값 (대안 2, 41차)
// = 웹 위젯(416px)×2 + gap(16) = 848px
const MOBILE_BP = 960;
const WEB_2COL_MIN_CHILDREN = 848;

// [DOM structure design notes — Sub Sidebar wrapper div]
// WHY: wrapper div with width:0/260 + overflow:hidden instead of {sidebarOpen && <SubSidebar />}
//   Conditional render causes 2x reflow (unmount + remount) and breaks CSS width transition.
//   Always-rendered wrapper lets SubSidebar stay mounted; only width animates. (fixed in session 44)
// WHY: Sub auto-close uses vw formula (SUB_AUTO_CLOSE_VP) instead of measuring main DOM width
//   Measuring main width to set sidebarOpen changes main width again, re-firing ResizeObserver.
//   This feedback loop caused visible jitter. vw only changes on window resize, breaking the loop. (fixed in session 43)
// REFACTOR NOTE: This structure is stable for production. Do not change without FE/PM/Design review (HANDOVER Step 6-A).

// SUB_AUTO_CLOSE_BP: Sub 자동닫힘 vw 기준 (피드백 루프 방지 — main 실측 대신 vw 수식 사용)
// Sub 열렸을 때 칠드런 = vw - GNB(64) - Sub(260) - PAD(48) < 848
// → vw < 848 + 64 + 260 + 48 = 1,220px
const GNB_W_LAYOUT = 64;
const SUB_W_LAYOUT = 260;
const PAD_LAYOUT   = 48;
const SUB_AUTO_CLOSE_VP = WEB_2COL_MIN_CHILDREN + GNB_W_LAYOUT + SUB_W_LAYOUT + PAD_LAYOUT; // 1,220

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const staffAuth     = useAuthStore((s) => s.staffAuth);
  const token         = useAuthStore((s) => s.token);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setRoomBrands  = useAuthStore((s) => s.setRoomBrands);
  const setRoomGroups  = useAuthStore((s) => s.setRoomGroups);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // POLICY §14: widgetVisibility — layout 레벨에서 관리 (MobileHeader 공유)
  const [widgetVisibility, setWidgetVisibilityState] = useState<WidgetVisibility>(DEFAULT_WIDGET_VISIBILITY);
  const setWidgetVisibility = useCallback((v: WidgetVisibility) => setWidgetVisibilityState(v), []);
  const lastDesktopSidebarRef = useRef(true);
  // Sub 자동닫힘(대안 2): 사용자가 의도적으로 열었던 상태를 기억 — 여유 생기면 자동 복원
  const userIntendedSubOpenRef = useRef(true);
  // 최근 vw를 ref로 보관 — Sub 자동닫힘 판단에 사용 (main 실측 대신 vw 기준)
  const vpWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);

  // ── ResizeObserver — viewport 변화 감지 + Sub 자동닫힘(대안 2, vw 기준) ──
  // ⚠️ Sub 자동닫힘을 main 실측이 아닌 vw 수식으로 판단하는 이유:
  //   main 실측 기반으로 sidebarOpen을 바꾸면 main 너비가 바뀌고
  //   그 변화가 다시 ResizeObserver를 발화시켜 피드백 루프(떨림)가 발생함.
  //   vw는 사용자가 창 크기를 조절할 때만 바뀌므로 루프 없이 안전.
  //
  //   Sub 자동닫힘 조건: vw < SUB_AUTO_CLOSE_VP(1,220)
  //     = Sub 열렸을 때 칠드런(vw-64-260-48) < 848 과 동치
  //   Sub 자동복원 조건: vw >= SUB_AUTO_CLOSE_VP(1,220)
  useEffect(() => {
    // 이전 isMobile 값을 ref로 추적 — 모바일→데스크탑 전환 감지
    const wasMobileRef = { current: window.innerWidth <= MOBILE_BP };

    function check(vw: number) {
      vpWidthRef.current = vw;
      const mobile = vw <= MOBILE_BP;
      const wasMobile = wasMobileRef.current;
      wasMobileRef.current = mobile;
      setIsMobile(mobile);

      if (mobile) {
        // 모바일 진입: 데스크탑 상태 저장 후 Sub 닫기
        lastDesktopSidebarRef.current = sidebarOpen;
        setSidebarOpen(false);
      } else if (wasMobile && !mobile) {
        // 모바일 → 데스크탑 복귀: lastDesktopSidebarRef 상태로 복원
        setSidebarOpen(lastDesktopSidebarRef.current);
      } else {
        // 데스크탑 ↔ 데스크탑 vw 변화: Sub 자동닫힘/복원 (vw 기준)
        setSidebarOpen((prev) => {
          if (prev && vw < SUB_AUTO_CLOSE_VP) {
            // Sub 열려 있는데 vw < 1,220 → 자동 닫힘, 의도 기억
            userIntendedSubOpenRef.current = true;
            return false;
          }
          if (!prev && userIntendedSubOpenRef.current && vw >= SUB_AUTO_CLOSE_VP) {
            // 의도 있었고 vw 회복 → 자동 복원
            userIntendedSubOpenRef.current = false;
            return true;
          }
          return prev;
        });
      }
    }

    check(window.innerWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        check(entry.contentRect.width);
      }
    });
    observer.observe(document.documentElement);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── mock 데이터 로드 ────────────────────────────────────────────────────
  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
    if (!useMock) return;

    import('@/mocks/workspaces.json').then((mod) => setWorkspaces(mod.default));

    import('@/mocks/roomBrands.json').then((mod) => {
      const currentWorkspaceId = staffAuth?.workspaceId;
      const all = mod.default;
      const filtered = currentWorkspaceId
        ? all.filter((b: { workspaceId: string }) => b.workspaceId === currentWorkspaceId)
        : all;
      setRoomBrands(filtered);
    });

    import('@/mocks/roomGroups.json').then((mod) => {
      const currentWorkspaceId = staffAuth?.workspaceId;
      const all = mod.default;
      const filtered = currentWorkspaceId
        ? all.filter((g: { workspaceId: string }) => g.workspaceId === currentWorkspaceId)
        : all;
      setRoomGroups(filtered);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffAuth?.workspaceId, setWorkspaces, setRoomBrands, setRoomGroups]);

  // ── 인증 체크 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !staffAuth) {
      router.replace('/login');
      return;
    }
    if (BLOCKED_AUTHORITIES.includes(staffAuth.authority)) {
      router.replace('/login');
    }
  }, [token, staffAuth, router]);

  if (!token || !staffAuth) return null;
  if (BLOCKED_AUTHORITIES.includes(staffAuth.authority)) return null;

  // ── 렌더 ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#F5F5F5' }}
    >
      {isMobile ? (
        /* MobileHeader도 widgetVisibility Context 소비 — Provider 안에 포함해야 함 (60차 버그 수정) */
        <LayoutContext.Provider value={{ sidebarOpen: false, widgetVisibility, setWidgetVisibility }}>
          <MobileHeader />
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </LayoutContext.Provider>
      ) : (
        <>
          <TopBar />
          <div className="flex flex-1 overflow-hidden min-h-0">
            <GNBSidebar
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => {
                const next = !sidebarOpen;
                setSidebarOpen(next);
                lastDesktopSidebarRef.current = next;
                // 수동 토글 시 자동닫힘 의도 초기화
                userIntendedSubOpenRef.current = false;
              }}
            />
            {/* Sub 사이드바 — 항상 렌더, width 트랜지션으로 열림/닫힘 제어
             * 이유: {sidebarOpen && <SubSidebar />} 방식은 마운트/언마운트 시
             * DOM 리플로우가 두 번 발생해 깜빡임(떨림)이 생김.
             * wrapper div의 width + overflow: hidden으로 시각적 제어만 하면
             * SubSidebar는 언마운트되지 않아 리플로우 없이 부드럽게 동작.
             */}
            <div style={{
              width: sidebarOpen ? 260 : 0,
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'width 0.2s ease',
            }}>
              <SubSidebar />
            </div>
            <LayoutContext.Provider value={{ sidebarOpen, widgetVisibility, setWidgetVisibility }}>
              <main className="flex-1 overflow-y-auto min-w-0">
                {children}
              </main>
            </LayoutContext.Provider>
          </div>
        </>
      )}
    </div>
  );
}
