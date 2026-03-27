/**
 * @file components/dashboard/DashboardHeader.tsx
 * @description 대시보드 상단 영역 — 타이틀 + 지점 탭 + 액션 버튼
 *
 * ─ 피그마 스펙 (웹 기준 / 1856px 컨테이너) ───────────────────────────────
 *   컨테이너: paddingTop 24, paddingLeft 24, paddingRight 24, gap 24
 *   타이틀 행: height 36px, justifyContent space-between
 *     - 타이틀: fontSize 24, fontWeight 700, lineHeight 32.02, letterSpacing 0.20px
 *     - 액션 버튼 그룹: gap 16px, 버튼 padding 4px 5px, border-radius 4px
 *   탭 영역 (타이틀 행과 gap 24px):
 *     - 탭 버튼: paddingLeft/Right 16, paddingTop/Bottom 9
 *     - 탭 텍스트: fontSize 14, fontWeight 500, lineHeight 24, letterSpacing 0.20px
 *     - 활성 탭: color #1976D2, 하단 2px solid #1976D2
 *     - 비활성 탭: color rgba(0,0,0,0.60)
 *
 * ─ Top Bar 탭 정책 (2026-03-23 확정) ────────────────────────────────────
 *   탭 목록:
 *     selectedRoomGroupIds = []     → 인가받은 전체 지점 탭 표시 (전체 + 지점1 + 지점2 + ...)
 *     selectedRoomGroupIds = [A, B] → 전체 + A탭 + B탭만 표시
 *     "전체" 탭은 항상 첫 번째, 제거 불가
 *
 *   탭 클릭 동작:
 *     "전체" 탭     → activeTabGroupId = null  → 필터 범위 전체 데이터 호출
 *     지점명 탭     → activeTabGroupId = id    → 해당 지점 단독 데이터 호출
 *
 *   지점 선택 변경 시:
 *     setSelectedRoomGroupIds → activeTabGroupId 자동 null 리셋 (authStore에서 처리)
 *
 * ─ 반응형 패딩 정책 ──────────────────────────────────────────────────────
 *   데스크탑 (> 1,061px): 좌우 패딩 24px, 타이틀 행 표시
 *   모바일   (≤ 1,061px): 좌우 패딩 16px, 타이틀 행 숨김 (MobileHeader 담당)
 *
 * ─ BE 연동 가이드 ────────────────────────────────────────────────────────
 *   activeTabGroupId !== null → roomGroupIds = [activeTabGroupId]
 *   activeTabGroupId === null, selectedRoomGroupIds = [A,B] → roomGroupIds = [A, B]
 *   activeTabGroupId === null, selectedRoomGroupIds = []    → roomGroupIds 파라미터 생략 (전체)
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { RoomGroupSelector } from '@/components/dashboard/RoomGroupSelector';

const PRIMARY      = '#1976D2';
const TEXT_PRIMARY = 'rgba(0,0,0,0.87)';
const TEXT_SECOND  = 'rgba(0,0,0,0.60)';
const DIVIDER      = 'rgba(0,0,0,0.12)';
const BG_HOVER     = 'rgba(0,0,0,0.04)';

interface DashboardHeaderProps {
  isMobile?: boolean;
  onWidgetSettingClick?: (rect: DOMRect) => void;
}

export function DashboardHeader({ isMobile = false, onWidgetSettingClick }: DashboardHeaderProps) {
  const roomGroups        = useAuthStore((s) => s.roomGroups);
  const selectedIds       = useAuthStore((s) => s.selectedRoomGroupIds);
  const setSelectedIds    = useAuthStore((s) => s.setSelectedRoomGroupIds);
  const activeTabGroupId  = useAuthStore((s) => s.activeTabGroupId);
  const setActiveTabGroupId = useAuthStore((s) => s.setActiveTabGroupId);

  const [selectorOpen, setSelectorOpen]       = useState(false);
  const [anchorRect, setAnchorRect]           = useState<DOMRect | null>(null);
  const selectorBtnRef                        = useRef<HTMLButtonElement>(null);
  const widgetBtnRef                          = useRef<HTMLButtonElement>(null);

  const hPadding = isMobile ? 16 : 24;

  /**
   * 탭에 표시할 지점 목록
   * selectedRoomGroupIds = [] → 전체 roomGroups
   * selectedRoomGroupIds = [A, B] → A, B에 해당하는 지점만
   */
  const visibleGroups = selectedIds.length === 0
    ? roomGroups
    : roomGroups.filter((g) => selectedIds.includes(g.roomGroupId));

  /** 지점 선택 버튼 배지: 선택된 지점 수 (0 = 전체이므로 배지 없음) */
  const isAll        = selectedIds.length === 0;
  const isTabAll     = activeTabGroupId === null;

  const handleSelectorToggle = useCallback(() => {
    if (!selectorOpen) {
      setAnchorRect(selectorBtnRef.current?.getBoundingClientRect() ?? null);
    }
    setSelectorOpen((prev) => !prev);
  }, [selectorOpen]);

  const handleSelectorClose = useCallback(() => setSelectorOpen(false), []);

  return (
    <>
      <div style={{ background: '#FFFFFF', position: 'relative', zIndex: 100 }}>

        {/* ── 타이틀 행: 데스크탑 전용 ────────────────────────────────── */}
        {!isMobile && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              height: 36, paddingTop: 24,
              paddingLeft: hPadding, paddingRight: hPadding,
            }}
          >
            {/* 좌측: 타이틀 */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  margin: 0, color: TEXT_PRIMARY,
                  fontSize: 24, fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                  fontWeight: 700, lineHeight: '32.02px', letterSpacing: '0.20px',
                  wordBreak: 'keep-all',
                }}
              >
                대시보드
              </h1>
            </div>

            {/* 우측: 액션 버튼 4개 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
              <div style={{ overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                <ActionButton label="미확인 건 찾기" icon={<SearchFilledIcon />} />
                <ButtonDivider />
                <ActionButton
                  ref={selectorBtnRef}
                  label="지점 선택"
                  icon={<DomainFilledIcon />}
                  badge={isAll ? null : selectedIds.length}
                  active={selectorOpen || !isAll}
                  onClick={handleSelectorToggle}
                />
                <ButtonDivider />
                <ActionButton label="메모 남기기" icon={<EditFilledIcon />} />
                <ButtonDivider />
                <ActionButton
                  ref={widgetBtnRef}
                  label="위젯 설정"
                  icon={<SettingsFilledIcon />}
                  onClick={onWidgetSettingClick ? () => {
                    const rect = widgetBtnRef.current?.getBoundingClientRect() ?? null;
                    if (rect) onWidgetSettingClick(rect);
                  } : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 탭 + 구분선 ──────────────────────────────────────────────── */}
        <div style={{ marginTop: isMobile ? 0 : 24, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex', overflowX: 'auto',
              paddingLeft: hPadding, scrollbarWidth: 'none', msOverflowStyle: 'none',
            } as React.CSSProperties}
            className="[&::-webkit-scrollbar]:hidden"
          >
            {/* 전체 탭 — 항상 첫 번째, 제거 불가 */}
            <TabButton
              label="전체"
              active={isTabAll}
              onClick={() => setActiveTabGroupId(null)}
            />

            {/* 표시 대상 지점 탭 */}
            {visibleGroups.map((group) => (
              <TabButton
                key={group.roomGroupId}
                label={group.roomGroupName}
                active={activeTabGroupId === group.roomGroupId}
                onClick={() => setActiveTabGroupId(group.roomGroupId)}
              />
            ))}
          </div>

          {/* 탭 하단 구분선 */}
          <div style={{ height: 1, background: DIVIDER }} />
        </div>
      </div>

      {/* ── 지점 선택 드롭다운 ────────────────────────────────────────── */}
      <RoomGroupSelector
        isOpen={selectorOpen}
        onClose={handleSelectorClose}
        anchorRect={anchorRect}
      />
    </>
  );
}

/* ── 탭 버튼 ─────────────────────────────────────────────────────────────── */
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative', flexShrink: 0,
        paddingTop: 9, paddingBottom: 9, paddingLeft: 16, paddingRight: 16,
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
        fontSize: 14, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.20px',
        color: active ? PRIMARY : TEXT_SECOND,
        transition: 'color 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {label}
      {active && (
        <span
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2, display: 'block', background: PRIMARY,
          }}
        />
      )}
    </button>
  );
}

/* ── 액션 버튼 ───────────────────────────────────────────────────────────── */
const ActionButton = ({
  label, icon, badge, active, onClick, ref,
}: {
  label: string; icon: React.ReactNode;
  badge?: number | null; active?: boolean;
  onClick?: () => void; ref?: React.Ref<HTMLButtonElement>;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      ref={ref}
      type="button"
      disabled={!onClick}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        paddingLeft: 5, paddingRight: 5, paddingTop: 4, paddingBottom: 4,
        overflow: 'hidden', borderRadius: 4,
        background: active || hovered ? BG_HOVER : 'transparent',
        border: 'none', cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        position: 'relative', transition: 'background 0.1s',
        // §13-1: 미구현 버튼 inactive — opacity 0.45, cursor default (onClick 없으면 inactive)
        opacity: onClick ? 1 : 0.45,
      }}
    >
      {icon}
      <span
        style={{
          color: active ? PRIMARY : TEXT_PRIMARY,
          fontSize: 13, fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          fontWeight: 500, lineHeight: '22px', letterSpacing: '0.20px', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span
          style={{
            minWidth: 16, height: 16, borderRadius: 8,
            background: PRIMARY, color: '#FFFFFF',
            fontSize: 10, fontWeight: 600,
            fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

/* ── 버튼 구분선 ─────────────────────────────────────────────────────────── */
function ButtonDivider() {
  return <div style={{ width: 1, height: 12, background: DIVIDER, flexShrink: 0 }} />;
}

/* ── 아이콘 ─────────────────────────────────────────────────────────────── */
function SearchFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill={TEXT_PRIMARY} d="M11.71 10.29 10.29 11.71l3.17 3.17 1.42-1.42-3.17-3.17zM7.5 13C5.01 13 3 10.99 3 8.5S5.01 4 7.5 4 12 6.01 12 8.5 9.99 13 7.5 13zm0-7.5C5.84 5.5 4.5 6.84 4.5 8.5S5.84 11.5 7.5 11.5 10.5 10.16 10.5 8.5 9.16 5.5 7.5 5.5z" />
    </svg>
  );
}
function DomainFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill={TEXT_PRIMARY} d="M1.5 15.75V6h4.5V3.75L9 1.5l3 2.25V6H16.5v9.75H10.5v-3H7.5v3H1.5zm1.5-1.5H6V12H3v2.25zm0-3.75H6V8.25H3V10.5zm0-3.75H6V4.5H3V6.75zm6 7.5H9v-2.25H7.5v2.25zm0-3.75H9V8.25H7.5V10.5zm0-3.75H9V4.5H7.5V6.75zm3 7.5h2.25V12H10.5v2.25zm0-3.75h2.25V8.25H10.5V10.5zm0-3.75h2.25V4.5H10.5V6.75z" />
    </svg>
  );
}
function EditFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill={TEXT_PRIMARY} d="M2.25 12.94V15.75h2.81l8.29-8.29-2.81-2.81-8.29 8.29zM15.54 5.21c.29-.29.29-.77 0-1.06l-1.69-1.69a.75.75 0 0 0-1.06 0l-1.32 1.32 2.81 2.81 1.26-1.38z" />
    </svg>
  );
}
function SettingsFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill={TEXT_PRIMARY} d="M14.57 9.73c.03-.24.05-.48.05-.73s-.02-.49-.05-.73l1.58-1.24a.38.38 0 0 0 .09-.48l-1.5-2.6a.38.38 0 0 0-.46-.17l-1.87.75c-.39-.3-.81-.55-1.27-.74l-.28-2A.37.37 0 0 0 10.5 1.5h-3a.37.37 0 0 0-.37.32l-.28 2c-.46.19-.88.44-1.27.74l-1.87-.75a.37.37 0 0 0-.46.17l-1.5 2.6a.37.37 0 0 0 .09.48L3.43 8.27A5.56 5.56 0 0 0 3.38 9c0 .24.02.49.05.73L1.85 10.97a.38.38 0 0 0-.09.48l1.5 2.6c.09.17.29.23.46.17l1.87-.75c.39.3.81.55 1.27.74l.28 2c.05.19.2.32.37.32h3c.18 0 .33-.13.37-.32l.28-2c.46-.19.88-.44 1.27-.74l1.87.75c.17.06.37 0 .46-.17l1.5-2.6a.38.38 0 0 0-.09-.48l-1.58-1.24zM9 11.25A2.25 2.25 0 1 1 9 6.75a2.25 2.25 0 0 1 0 4.5z" />
    </svg>
  );
}
