/**
 * @file components/layout/MobileHeader.tsx
 * @description 모바일 헤더 — viewport ≤ 1,061px 에서 TopBar·GNB·SubSidebar를 대체
 *
 * ─ 피그마 스펙 (모바일 375px 기준) ──────────────────────────────────────
 *   AppBar (height 56px): paddingLeft/Right 16
 *   타이틀: fontSize 20, fontWeight 700, lineHeight 32px, letterSpacing 0.20px
 *   탭 영역: height 46px, 탭 letterSpacing 0.40px
 *
 * ─ Top Bar 탭 정책 (2026-03-23 확정) ────────────────────────────────────
 *   selectedRoomGroupIds = []     → 인가받은 전체 지점 탭 표시
 *   selectedRoomGroupIds = [A, B] → 전체 + A탭 + B탭만 표시
 *   "전체" 탭은 항상 첫 번째, 제거 불가
 *   탭 클릭: activeTabGroupId 변경 (null = 전체)
 *
 * ─ 드로어 구성 (햄버거 클릭 시) ─────────────────────────────────────────
 *   1. 미확인 건 찾기
 *   2. 지점 선택 ✅ RoomGroupBottomSheet 연결 완료
 *   3. 메모 남기기
 *   4. 위젯 설정
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { RoomGroupBottomSheet } from '@/components/dashboard/RoomGroupBottomSheet';
import { WidgetSelector } from '@/components/dashboard/WidgetSelector';
import { useLayoutContext } from '@/app/(dashboard)/layoutContext';

const PRIMARY = '#1976D2';

const ACTION_ITEMS = [
  { id: 'find-unconfirmed', label: '미확인 건 찾기' },
  { id: 'select-branch',    label: '지점 선택' },
  { id: 'memo',             label: '메모 남기기' },
  { id: 'widget-settings',  label: '위젯 설정' },
] as const;

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen]                 = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen]       = useState(false);
  const [widgetSheetOpen, setWidgetSheetOpen]       = useState(false);

  const { widgetVisibility, setWidgetVisibility } = useLayoutContext();

  const roomGroups          = useAuthStore((s) => s.roomGroups);
  const selectedIds         = useAuthStore((s) => s.selectedRoomGroupIds);
  const activeTabGroupId    = useAuthStore((s) => s.activeTabGroupId);
  const setActiveTabGroupId = useAuthStore((s) => s.setActiveTabGroupId);

  const isAll = selectedIds.length === 0;

  /**
   * 탭에 표시할 지점 목록
   * selectedRoomGroupIds = [] → 전체 roomGroups
   * selectedRoomGroupIds = [A, B] → A, B에 해당하는 지점만
   */
  const visibleGroups = isAll
    ? roomGroups
    : roomGroups.filter((g) => selectedIds.includes(g.roomGroupId));

  /* 드로어 열릴 때 배경 스크롤 잠금 */
  useEffect(() => {
    if (!bottomSheetOpen) {
      document.body.style.overflow = drawerOpen ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, bottomSheetOpen]);

  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  const handleSelectBranch = useCallback(() => {
    setDrawerOpen(false);
    setBottomSheetOpen(true);
  }, []);

  const handleBottomSheetClose = useCallback(() => setBottomSheetOpen(false), []);

  return (
    <>
      {/* ── AppBar ─────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', flexShrink: 0 }}>
        <div style={{ height: 56, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16,
              overflow: 'hidden', display: 'inline-flex',
              justifyContent: 'flex-start', alignItems: 'center',
            }}
          >
            {/* 타이틀 */}
            <div style={{ flex: 1, minHeight: 56, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  color: 'black', fontSize: 20,
                  fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                  fontWeight: 700, lineHeight: '32px', letterSpacing: '0.20px', wordBreak: 'keep-all',
                }}
              >
                대시보드
              </span>
            </div>

            {/* 햄버거 */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="메뉴 열기"
              style={{
                padding: 5, overflow: 'hidden', borderRadius: '100px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'inline-flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', color: 'black',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2.5" y="5"  width="15" height="2" rx="1" fill="currentColor" />
                <rect x="2.5" y="9"  width="15" height="2" rx="1" fill="currentColor" />
                <rect x="2.5" y="13" width="15" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── 탭 영역 ──────────────────────────────────────────────── */}
        <div style={{ height: 46, position: 'relative', overflow: 'hidden' }}>
          {/* 하단 구분선 */}
          <div
            style={{
              position: 'absolute', left: 0, top: 45, width: '100%', height: 0,
              outline: '1px solid rgba(0,0,0,0.12)', outlineOffset: '-0.5px',
            }}
          />

          {/* 탭 스크롤 컨테이너 */}
          <div
            style={{
              position: 'absolute', left: 16, top: 4,
              display: 'inline-flex', alignItems: 'flex-start',
              overflow: 'hidden',
            }}
          >
            {/* 전체 탭 — 항상 첫 번째, 제거 불가 */}
            <MobileTabButton
              label="전체"
              active={activeTabGroupId === null}
              onClick={() => setActiveTabGroupId(null)}
            />

            {/* 표시 대상 지점 탭 */}
            {visibleGroups.map((group) => (
              <MobileTabButton
                key={group.roomGroupId}
                label={group.roomGroupName}
                active={activeTabGroupId === group.roomGroupId}
                onClick={() => setActiveTabGroupId(group.roomGroupId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 드로어 ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            onClick={handleDrawerClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
          />
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 280, background: '#FFFFFF', zIndex: 101,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* 드로어 헤더 */}
            <div
              style={{
                height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingLeft: 20, paddingRight: 12,
                borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.87)', fontFamily: 'Pretendard, Noto Sans KR, sans-serif', letterSpacing: '0.20px' }}>
                메뉴
              </span>
              <button
                type="button"
                onClick={handleDrawerClose}
                aria-label="메뉴 닫기"
                style={{ padding: 5, borderRadius: '100px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.6)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 액션 리스트 */}
            <nav style={{ flex: 1, overflowY: 'auto' }}>
              {ACTION_ITEMS.map((item, idx) => {
                const isSelectBranch = item.id === 'select-branch';
                const isActive       = isSelectBranch && !isAll;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={isSelectBranch ? handleSelectBranch : item.id === 'widget-settings' ? () => { setDrawerOpen(false); setWidgetSheetOpen(true); } : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      background: isActive ? 'rgba(25,118,210,0.06)' : 'transparent',
                      border: 'none',
                      borderBottom: idx < ACTION_ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      cursor: (isSelectBranch || item.id === 'widget-settings') ? 'pointer' : 'default',
                      textAlign: 'left',
                      fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                      opacity: (isSelectBranch || item.id === 'widget-settings') ? 1 : 0.45,
                    }}
                    onMouseEnter={(e) => {
                      if (isSelectBranch && !isActive)
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (isSelectBranch && !isActive)
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15, fontWeight: 500, lineHeight: '22px',
                        letterSpacing: '0.20px',
                        color: isActive ? PRIMARY : 'rgba(0,0,0,0.87)', flex: 1,
                      }}
                    >
                      {item.label}
                    </span>
                    {/* 선택된 지점 수 배지 */}
                    {isSelectBranch && !isAll && (
                      <span
                        style={{
                          minWidth: 18, height: 18, borderRadius: 9,
                          background: PRIMARY, color: '#FFFFFF',
                          fontSize: 11, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 5px', lineHeight: 1, flexShrink: 0,
                        }}
                      >
                        {selectedIds.length}
                      </span>
                    )}
                    {/* 화살표 */}
                    {isSelectBranch && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'rgba(0,0,0,0.3)' }}>
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* ── 지점 선택 바텀시트 ────────────────────────────────────── */}
      <RoomGroupBottomSheet isOpen={bottomSheetOpen} onClose={handleBottomSheetClose} />

      {/* widget display settings bottom sheet */}
      <WidgetSelector
        isOpen={widgetSheetOpen}
        isMobile
        onClose={() => setWidgetSheetOpen(false)}
        visibility={widgetVisibility}
        onChange={setWidgetVisibility}
      />
    </>
  );
}

/* ── 모바일 탭 버튼 ──────────────────────────────────────────────────────── */
function MobileTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          paddingLeft: 16, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.40px',
          color: active ? PRIMARY : 'rgba(0,0,0,0.60)', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
      {active && (
        <div
          style={{
            position: 'absolute', left: 0, bottom: 0, width: '100%', height: 0,
            outline: `2px solid ${PRIMARY}`, outlineOffset: '-1px',
          }}
        />
      )}
    </div>
  );
}
